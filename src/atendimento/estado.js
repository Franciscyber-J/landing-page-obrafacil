// O atendimento do site: qual canal aparece (WhatsApp, conversa com o Max ou os dois), o número do WhatsApp e se o
// painel da conversa está aberto. Um "lugar só" que o botão flutuante, o rodapé, a página inicial, o Suporte e a
// Central leem (useAtendimento).
//
// Página pronta e hidratação: no build e no primeiro desenho no navegador o grupo é o do país do idioma da página
// (grupoDaPagina), pelos valores iniciais; só depois de a página abrir o site lê o fuso do navegador, o documento dos
// grupos e o número do WhatsApp, e ajusta. Os dois primeiros desenhos saem iguais (sem erro de hidratação).
//
// Custo: os dois documentos (configuracoes/atendimento_paises e configuracoes/suporte) são lidos pela API pública do
// Firestore, sem SDK, quando o navegador está livre, e ficam guardados no navegador por 12 horas: no máximo duas
// leituras por visitante a cada 12 horas. Nada da conversa é guardado aqui.

import { useSyncExternalStore } from 'react';
import { WHATSAPP } from '../links.js';
import { fusoDoNavegador } from '../i18n/formatos.js';
import { idioma } from '../i18n/idiomas.js';
import { lerCampos, PROJETO } from '../legal/firestore.js';
import { CONFIG_INICIAL, grupoDaPagina, lerConfiguracao, visitante, whatsappValido } from './grupos.js';

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents/configuracoes`;
const CACHE = 'atendimento:v1:configuracao';
const VALIDADE_MS = 12 * 60 * 60 * 1000;

const INICIAL = Object.freeze({ calculado: false, pais: null, grupo: null, whatsapp: WHATSAPP, aberto: false, origem: null });
let estado = INICIAL;
const ouvintes = new Set();

function mudar(parcial) {
    estado = { ...estado, ...parcial };
    for (const ouvir of ouvintes) ouvir();
}

function assinar(ouvir) {
    ouvintes.add(ouvir);
    return () => ouvintes.delete(ouvir);
}

// { grupo, pais, whatsapp, aberto }. codigo: o idioma da página (para o grupo antes de o navegador dizer o país).
export function useAtendimento(codigo) {
    const s = useSyncExternalStore(assinar, () => estado, () => INICIAL);
    const grupo = s.grupo ?? grupoDaPagina(idioma(codigo)?.pais);
    return { grupo, pais: s.pais, whatsapp: s.whatsapp, aberto: s.aberto, origem: s.origem };
}

// O país do visitante (ISO-2) para o servidor, ou null enquanto não calculado ou desconhecido.
export function paisDoVisitante() {
    return estado.pais;
}

// ---------- Painel da conversa ----------

let quemAbriu = null;

// origem: de onde a pessoa abriu (botão flutuante, rodapé...), só para devolver o foco ao fechar.
export function abrirConversa(origem = 'flutuante') {
    if (typeof document !== 'undefined') quemAbriu = document.activeElement;
    mudar({ aberto: true, origem });
}

export function fecharConversa() {
    mudar({ aberto: false });
    const voltar = quemAbriu;
    quemAbriu = null;
    // O botão flutuante volta a aparecer depois do fechamento; o foco vai para ele (ou para quem abriu).
    requestAnimationFrame(() => {
        const destino = voltar && voltar.isConnected ? voltar : document.querySelector('[data-atendimento="flutuante"]');
        destino?.focus?.();
    });
}

// ---------- País, grupo e número ----------

function lerCache() {
    try {
        const bruto = window.localStorage.getItem(CACHE);
        const dados = bruto ? JSON.parse(bruto) : null;
        if (dados && typeof dados.em === 'number' && Date.now() - dados.em < VALIDADE_MS) return dados;
    } catch {
        // Sem acesso ao armazenamento (aba anônima, bloqueio): segue sem cache.
    }
    return null;
}

function gravarCache(dados) {
    try {
        window.localStorage.setItem(CACHE, JSON.stringify({ ...dados, em: Date.now() }));
    } catch {
        // Sem espaço ou sem permissão: segue sem cache.
    }
}

// Um documento público de configuracoes/. null quando não existe (valem os valores iniciais); erro quando a leitura
// falha (não guarda nada e tenta de novo na próxima visita).
async function lerDocumento(nome) {
    const resposta = await fetch(`${BASE}/${nome}`, { headers: { Accept: 'application/json' } });
    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return lerCampos((await resposta.json()).fields);
}

function quandoLivre(fazer) {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fazer, { timeout: 3000 });
    else setTimeout(fazer, 1200);
}

let iniciado = false;

// Chamado uma vez, depois de a página abrir (Atendimento.jsx).
export function iniciarAtendimento() {
    if (iniciado || typeof window === 'undefined') return;
    iniciado = true;
    const fuso = fusoDoNavegador();
    const idiomas = Array.isArray(navigator.languages) && navigator.languages.length ? [...navigator.languages] : [navigator.language];

    import('./fusos.js').then(({ paisDoFuso }) => {
        const aplicar = (config, numero) => {
            const { pais, grupo } = visitante({ fuso, idiomas }, paisDoFuso, config);
            mudar({ calculado: true, pais, grupo, whatsapp: numero ?? WHATSAPP });
        };
        const guardado = lerCache();
        aplicar(guardado ? lerConfiguracao(guardado.paises) : CONFIG_INICIAL, whatsappValido(guardado?.whatsapp));
        if (guardado) return;
        quandoLivre(async () => {
            try {
                const [paises, suporte] = await Promise.all([lerDocumento('atendimento_paises'), lerDocumento('suporte')]);
                const numero = whatsappValido(suporte?.whatsapp);
                gravarCache({ paises: paises ?? null, whatsapp: numero });
                aplicar(lerConfiguracao(paises), numero);
            } catch {
                // Sem internet ou Firestore fora: continuam os valores iniciais.
            }
        });
    }).catch(() => {
        // O arquivo dos fusos não baixou: fica o grupo da página.
    });
}
