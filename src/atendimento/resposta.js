// Leitor da resposta do Max. O texto vem do servidor no formato do WhatsApp (contrato, "Formato da resposta"):
// *negrito* (um asterisco de cada lado; **assim** também vale), listas com "• ", "- " ou "1. ", blocos separados
// por linha em branco, e os endereços dos artigos e dos planos no fim.
//
// Segurança (pedido do Francis, 18/11/2026): nada aqui gera HTML. O resultado é uma lista de blocos que o componente
// transforma em elementos React (texto puro). Endereço vira link só se for de um destino da lista fechada abaixo
// (o próprio site, o app e a página do ObraFácil nas lojas), sempre https; qualquer outro fica como texto.

import { APP_STORE_ID, ID_GOOGLE_PLAY } from '../links.js';

export const SITE = 'appobrafacil.expertbr.com';
export const APP_WEB = 'obrafacilapp.expertbr.com';

// Destinos que podem virar link, conferidos pelo endereço já interpretado (new URL), nunca por pedaço de texto.
export function linkPermitido(endereco) {
    let url;
    try {
        url = new URL(endereco);
    } catch {
        return null;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    if (host === SITE || host === APP_WEB) return url.href;
    if (host === 'play.google.com' && url.pathname === '/store/apps/details' && url.searchParams.get('id') === ID_GOOGLE_PLAY) return url.href;
    if (host === 'apps.apple.com' && new RegExp(`/id${APP_STORE_ID}$`).test(url.pathname)) return url.href;
    return null;
}

const ENDERECO = /https?:\/\/[^\s<>"'`]+/g;
// Pontuação que encosta no fim do endereço ("veja https://.../ajuda." ) não faz parte dele.
const FIM_SOLTO = /[.,;:!?)\]}»"'”’]+$/;

// Divide um pedaço de texto em texto e links.
function comLinks(texto, negrito) {
    const pedacos = [];
    let inicio = 0;
    for (const m of texto.matchAll(ENDERECO)) {
        let bruto = m[0];
        const solto = FIM_SOLTO.exec(bruto)?.[0] ?? '';
        if (solto) bruto = bruto.slice(0, -solto.length);
        const fim = m.index + bruto.length;
        if (m.index > inicio) pedacos.push({ tipo: 'texto', texto: texto.slice(inicio, m.index), negrito });
        const href = linkPermitido(bruto);
        pedacos.push(href ? { tipo: 'link', texto: bruto, href, negrito } : { tipo: 'texto', texto: bruto, negrito });
        inicio = fim;
    }
    if (inicio < texto.length) pedacos.push({ tipo: 'texto', texto: texto.slice(inicio), negrito });
    return pedacos;
}

// **negrito** ou *negrito* (sem espaço logo depois do primeiro asterisco nem logo antes do último, numa linha só).
const NEGRITO = /\*\*([^*\n]+?)\*\*|\*([^*\s](?:[^*\n]*[^*\s])?)\*/g;

// Uma linha em pedaços: { tipo: 'texto', texto, negrito } ou { tipo: 'link', texto, href, negrito }.
export function lerLinha(linha) {
    const pedacos = [];
    let inicio = 0;
    for (const m of linha.matchAll(NEGRITO)) {
        if (m.index > inicio) pedacos.push(...comLinks(linha.slice(inicio, m.index), false));
        pedacos.push(...comLinks(m[1] ?? m[2], true));
        inicio = m.index + m[0].length;
    }
    if (inicio < linha.length) pedacos.push(...comLinks(linha.slice(inicio), false));
    // Pedaços de texto vizinhos com o mesmo negrito viram um só.
    return pedacos.reduce((juntos, p) => {
        const ultimo = juntos[juntos.length - 1];
        if (ultimo && p.tipo === 'texto' && ultimo.tipo === 'texto' && ultimo.negrito === p.negrito) ultimo.texto += p.texto;
        else juntos.push({ ...p });
        return juntos;
    }, []);
}

const ITEM = /^(?:[•\-–]\s+|(\d{1,3})[.)]\s+)(.*)$/;

// O texto em blocos: { tipo: 'paragrafo', linhas: [pedacos] } (linhas seguidas do mesmo bloco) ou
// { tipo: 'lista', numerada, itens: [pedacos] }.
export function lerResposta(texto) {
    const blocos = [];
    let bloco = null;
    for (const bruta of String(texto ?? '').replace(/\r\n?/g, '\n').split('\n')) {
        const linha = bruta.trim();
        if (!linha) {
            bloco = null;
            continue;
        }
        const item = ITEM.exec(linha);
        if (item) {
            const numerada = Boolean(item[1]);
            if (!bloco || bloco.tipo !== 'lista' || bloco.numerada !== numerada) {
                bloco = { tipo: 'lista', numerada, itens: [] };
                blocos.push(bloco);
            }
            bloco.itens.push(lerLinha(item[2]));
            continue;
        }
        if (!bloco || bloco.tipo !== 'paragrafo') {
            bloco = { tipo: 'paragrafo', linhas: [] };
            blocos.push(bloco);
        }
        bloco.linhas.push(lerLinha(linha));
    }
    return blocos;
}
