// Ligação com o Max no servidor (function maxChatSite, contrato em gestao_obras/docs/agencia_ia/ATENDIMENTO_CHAT.md).
// Este arquivo e o SDK do Firebase só são baixados quando a pessoa abre a conversa (Painel.jsx importa sob demanda):
// a página não fica mais pesada para quem não conversa.
//
// O que vai no navegador é só a configuração PÚBLICA do aplicativo web do Firebase (a mesma que o app web já publica;
// ela identifica o projeto e não é segredo). Nenhuma chave de servidor entra no site. Quem protege o Max é o servidor:
// login anônimo obrigatório, limites por visitante e por endereço IP, teto de gasto e, quando ligado, o App Check.
//
// Login anônimo: só quando a pessoa começa a escrever (preparar) ou envia, nunca ao abrir a página. Fica guardado
// pelo próprio Firebase no navegador, para o limite diário e a conversa seguirem a mesma pessoa.

import { initializeApp } from 'firebase/app';
import {
    browserLocalPersistence, inMemoryPersistence, indexedDBLocalPersistence, initializeAuth, signInAnonymously, signOut,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const CONFIGURACAO_PUBLICA = {
    apiKey: 'AIzaSyC5opi9qCHgzT9ldu4tzvznQcj2CuSNEmw',
    authDomain: 'gestao-obras-app-8342c.firebaseapp.com',
    projectId: 'gestao-obras-app-8342c',
    appId: '1:1030083935852:web:a82d91ef594e3a8cac2249',
    messagingSenderId: '1030083935852',
};
// Região das functions do app (contrato, item 3).
const REGIAO = 'us-central1';
// App Check do site (reCAPTCHA v3): vazio enquanto o site não tem o App Check registrado no Firebase. Com a chave do
// site aqui, o SDK manda o token em cada pedido; o servidor passa a exigir pelo campo exigir_app_check_site do
// documento ia_config/max. Ligar exige também liberar o reCAPTCHA na política de conteúdo (hospedagem/LEIAME.md).
const RECAPTCHA_V3_DO_SITE = '';
// A resposta do Max pode levar alguns segundos (a IA pensa e consulta a Central). O site espera até o tempo máximo da
// function (timeoutSeconds: 180 em maxChatSite), mais a folga da rede: desistir antes deixaria a resposta "ocupada".
const TEMPO_MAXIMO_MS = 185_000;

let pronto = null;

function iniciar() {
    pronto ??= (async () => {
        const app = initializeApp(CONFIGURACAO_PUBLICA, 'atendimento-site');
        if (RECAPTCHA_V3_DO_SITE) {
            const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
            initializeAppCheck(app, { provider: new ReCaptchaV3Provider(RECAPTCHA_V3_DO_SITE), isTokenAutoRefreshEnabled: true });
        }
        // Sem o "popupRedirectResolver" do getAuth: o site não abre janela de login (menos código e nenhum iframe).
        const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence] });
        const chamar = httpsCallable(getFunctions(app, REGIAO), 'maxChatSite', { timeout: TEMPO_MAXIMO_MS });
        return { auth, chamar };
    })();
    return pronto.catch((erro) => {
        pronto = null;
        throw erro;
    });
}

const LOGIN_INVALIDO = new Set(['auth/user-token-expired', 'auth/user-not-found', 'auth/user-disabled', 'auth/invalid-user-token']);

// O login anônimo pronto (e válido). O servidor apaga o login de quem ficou 30 dias sem usar a conversa: o login
// guardado no navegador deixa de valer e é trocado por um novo, sem a pessoa perceber.
async function comLogin({ novo = false } = {}) {
    const { auth, chamar } = await iniciar();
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
        // Adianta o SDK e o login anônimo quando a pessoa começa a escrever (a primeira resposta chega mais cedo).
        preparar() {
            if (semInternet()) return;
            comLogin().catch(() => {
                // Sem problema: o envio tenta de novo e mostra o aviso se falhar.
            });
        },
        async enviar({ texto, idioma, pais }) {
            if (semInternet()) throw Object.assign(new Error('sem internet'), { semInternet: true });
            const entrada = { texto, idioma: idioma.toLowerCase() };
            if (pais) entrada.pais = pais;
            try {
                const { data } = await (await comLogin())(entrada);
                return data;
            } catch (erro) {
                // O servidor não reconheceu o login (apagado entre a conferência e o pedido): um login novo, uma vez.
                if (erro?.code !== 'functions/unauthenticated') throw erro;
                const { data } = await (await comLogin({ novo: true }))(entrada);
                return data;
            }
        },
    };
}
