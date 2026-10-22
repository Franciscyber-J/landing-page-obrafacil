// De onde vem o conteúdo das páginas prontas: o Firestore (leitura pública pela API REST, sem chave, igual ao
// site no navegador) ou, só para testar no computador, as pastas locais do gestao_obras.

import fs from 'node:fs';
import path from 'node:path';
import { IDIOMAS } from '../../src/i18n/idiomas.js';
import { IDIOMAS_AJUDA } from '../../src/ajuda/idiomas.js';
import { DOCUMENTOS, PROJETO, lerCampos, textoDaVersao, versoesDoDocumento } from '../../src/legal/firestore.js';
import { compararVersoes, versaoValida } from '../../src/legal/escolha.js';

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents`;

async function lerJson(url) {
    const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao ler ${url.replace(BASE, '')}`);
    return resposta.json();
}

// ---------- Central de Ajuda ----------
// Resultado: { indices: { <idioma>: índice }, artigos: Map(id → artigo), atualizados: Map(id → data),
//              indicesAtualizados: { <idioma>: data } }

async function ajudaDoFirestore() {
    const indices = {};
    const indicesAtualizados = {};
    for (const idioma of IDIOMAS_AJUDA) {
        let corpo;
        try {
            corpo = await lerJson(`${BASE}/ajuda_indices/${idioma}`);
        } catch (erro) {
            if (/HTTP 404/.test(erro.message)) continue; // nada publicado neste idioma
            throw erro;
        }
        indices[idioma] = lerCampos(corpo.fields);
        indicesAtualizados[idioma] = corpo.updateTime ?? null;
    }
    const artigos = new Map();
    const atualizados = new Map();
    let pagina = '';
    do {
        const corpo = await lerJson(`${BASE}/ajuda_artigos?pageSize=100${pagina ? `&pageToken=${encodeURIComponent(pagina)}` : ''}`);
        for (const d of corpo.documents ?? []) {
            const doc = lerCampos(d.fields);
            artigos.set(doc.id, doc);
            atualizados.set(doc.id, d.updateTime ?? null);
        }
        pagina = corpo.nextPageToken ?? '';
    } while (pagina);
    return { indices, artigos, atualizados, indicesAtualizados };
}

// Pasta gravada pelo publicador do gestao_obras (node bin/publicar.mjs --saida <pasta>).
function ajudaLocal(pasta) {
    const ler = (arq) => JSON.parse(fs.readFileSync(arq, 'utf8'));
    const data = (arq) => fs.statSync(arq).mtime.toISOString();
    const indices = {};
    const indicesAtualizados = {};
    for (const idioma of IDIOMAS_AJUDA) {
        const arq = path.join(pasta, 'ajuda_indices', `${idioma}.json`);
        if (!fs.existsSync(arq)) continue;
        indices[idioma] = ler(arq);
        indicesAtualizados[idioma] = data(arq);
    }
    const artigos = new Map();
    const atualizados = new Map();
    for (const nome of fs.readdirSync(path.join(pasta, 'ajuda_artigos')).filter((n) => n.endsWith('.json'))) {
        const arq = path.join(pasta, 'ajuda_artigos', nome);
        const doc = ler(arq);
        artigos.set(doc.id, doc);
        atualizados.set(doc.id, data(arq));
    }
    return { indices, artigos, atualizados, indicesAtualizados };
}

export async function lerAjuda({ local = null } = {}) {
    const ajuda = local ? ajudaLocal(local) : await ajudaDoFirestore();
    if (!Object.keys(ajuda.indices).length) throw new Error('nenhum índice da Central publicado');
    return ajuda;
}

// ---------- Termos e Política ----------
// Resultado: { termos: { <idioma do site>: { documento, idioma, atual, proxima } }, privacidade: {...} }

async function legalDoFirestore() {
    const saida = {};
    for (const documento of DOCUMENTOS) {
        saida[documento] = {};
        const escolha = await versoesDoDocumento(documento);
        if (!escolha) continue;
        for (const { codigo } of IDIOMAS) {
            const lido = await textoDaVersao(documento, escolha.atual.versao, codigo);
            if (!lido) continue;
            saida[documento][codigo] = {
                documento,
                idioma: codigo,
                atual: { versao: lido.versao, texto: lido.texto, vigenteDesde: escolha.atual.vigenteDesde },
                proxima: escolha.proxima,
            };
        }
    }
    return saida;
}

// Pasta legal/ do gestao_obras: a versão mais nova de cada documento, sem data (como o "npm run dev" mostra).
function legalLocal(pasta) {
    const saida = {};
    for (const documento of DOCUMENTOS) {
        saida[documento] = {};
        const dir = path.join(pasta, documento);
        if (!fs.existsSync(dir)) continue;
        const versao = fs.readdirSync(dir).filter(versaoValida).sort(compararVersoes).pop();
        if (!versao) continue;
        for (const { codigo } of IDIOMAS) {
            const arq = path.join(dir, versao, `${codigo}.md`);
            if (!fs.existsSync(arq)) continue;
            saida[documento][codigo] = {
                documento,
                idioma: codigo,
                atual: { versao, texto: fs.readFileSync(arq, 'utf8'), vigenteDesde: null },
                proxima: null,
            };
        }
    }
    return saida;
}

export async function lerLegal({ local = null } = {}) {
    return local ? legalLocal(local) : legalDoFirestore();
}
