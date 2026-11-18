// Ligação com o Max no servidor (function maxChatSite, contrato em gestao_obras/docs/agencia_ia/ATENDIMENTO_CHAT.md).
// Este arquivo e o SDK do Firebase só são baixados quando a pessoa abre a conversa (Painel.jsx importa sob demanda):
// a página não fica mais pesada para quem não conversa.
//
// O que vai no navegador é só a configuração PÚBLICA do app web do site no Firebase (src/atendimento/configuracao.js);
// nenhuma chave de servidor entra no site. Quem protege o Max: App Check (reCAPTCHA Enterprise), login anônimo
// obrigatório, limites por visitante e por endereço IP e o teto de gasto, no servidor.
//
// Ordem, só quando a pessoa ENVIA a primeira mensagem (nada disso acontece ao abrir a página, ao abrir o painel ou ao
// escrever):
//   1. App Check: o reCAPTCHA Enterprise é carregado e o token do App Check é obtido. Sem token, para aqui com erro:
//      o site nunca cria login nem chama o servidor sem o App Check.
//   2. Login anônimo (guardado pelo próprio Firebase no navegador, para o limite diário e a conversa seguirem a mesma
//      pessoa).
//   3. A function maxChatSite, com o token do App Check e o do login.

import { initializeApp } from 'firebase/app';
import { ReCaptchaEnterpriseProvider, getToken, initializeAppCheck } from 'firebase/app-check';
import {
    browserLocalPersistence, inMemoryPersistence, indexedDBLocalPersistence, initializeAuth, signInAnonymously, signOut,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { REGIAO, SITE_NO_FIREBASE, conversaLigada } from './configuracao.js';

// A resposta do Max pode levar alguns segundos (a IA pensa e consulta a Central). O site espera até o tempo máximo da
// function (timeoutSeconds: 180 em maxChatSite), mais a folga da rede: desistir antes deixaria a resposta "ocupada".
const TEMPO_MAXIMO_MS = 185_000;

// Prazo do App Check e do login anônimo juntos. O reCAPTCHA que não carrega (bloqueador, rede) deixaria o token
// esperando para sempre; passado o prazo, a mensagem volta para o campo com o aviso de erro.
const PRAZO_DA_PREPARACAO_MS = 20_000;

function comPrazo(promessa, ms) {
    let relogio;
    const prazo = new Promise((_, falhar) => {
        relogio = setTimeout(() => falhar(Object.assign(new Error('prazo esgotado'), { code: 'app-check/prazo' })), ms);
    });
    return Promise.race([promessa, prazo]).finally(() => clearTimeout(relogio));
}

let pronto = null;

function iniciar() {
    pronto ??= (async () => {
        if (!conversaLigada(SITE_NO_FIREBASE)) {
            throw Object.assign(new Error('App Check do site não configurado'), { code: 'app-check/nao-configurado' });
        }
        const { recaptchaEnterprise, ...opcoes } = SITE_NO_FIREBASE;
        const app = initializeApp(opcoes, 'atendimento-site');
        // Sem renovação automática: o token só é pedido quando a pessoa envia (e vale pelo tempo registrado no
        // console). Cada token novo é uma avaliação do reCAPTCHA; renovar sozinho gastaria a cota grátis à toa.
        const appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(recaptchaEnterprise),
            isTokenAutoRefreshEnabled: false,
        });
        // Sem o "popupRedirectResolver" do getAuth: o site não abre janela de login (menos código e nenhum iframe).
        const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence] });
        const chamar = httpsCallable(getFunctions(app, REGIAO), 'maxChatSite', { timeout: TEMPO_MAXIMO_MS });
        return { appCheck, auth, chamar };
    })();
    return pronto.catch((erro) => {
        pronto = null;
        throw erro;
    });
}

const LOGIN_INVALIDO = new Set(['auth/user-token-expired', 'auth/user-not-found', 'auth/user-disabled', 'auth/invalid-user-token']);

// App Check, depois o login anônimo pronto (e válido). O servidor apaga o login de quem ficou 30 dias sem usar a
// conversa: o login guardado no navegador deixa de valer e é trocado por um novo, sem a pessoa perceber.
function prontoParaChamar(opcoes) {
    return comPrazo(preparar(opcoes), PRAZO_DA_PREPARACAO_MS);
}

async function preparar({ novo = false } = {}) {
    const { appCheck, auth, chamar } = await iniciar();
    // getToken lança o erro quando não consegue o token (reCAPTCHA bloqueado, chave errada, robô): nada segue.
    await getToken(appCheck, false);
    await auth.authStateReady();
    if (auth.currentUser && !novo) {
        try {
            await auth.currentUser.getIdToken();
            return chamar;
        } catch (erro) {
            // Só login apagado ou inválido troca de login; falha de rede segue como erro (a pessoa tenta de novo).
            if (!LOGIN_INVALIDO.has(erro?.code)) throw erro;
        }
    }
    if (auth.currentUser) await signOut(auth).catch(() => {});
    await signInAnonymously(auth);
    return chamar;
}

function semInternet() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function criarServidor() {
    return {
        async enviar({ texto, idioma, pais }) {
            if (semInternet()) throw Object.assign(new Error('sem internet'), { semInternet: true });
            const entrada = { texto, idioma: idioma.toLowerCase() };
            if (pais) entrada.pais = pais;
            try {
                const { data } = await (await prontoParaChamar())(entrada);
                return data;
            } catch (erro) {
                // O servidor não reconheceu o login (apagado entre a conferência e o pedido): um login novo, uma vez.
                if (erro?.code !== 'functions/unauthenticated') throw erro;
                const { data } = await (await prontoParaChamar({ novo: true }))(entrada);
                return data;
            }
        },
    };
}
