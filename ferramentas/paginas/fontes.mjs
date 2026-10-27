// De onde vem o conteúdo das páginas prontas: o Firestore (leitura pública pela API REST, sem chave, igual ao
// site no navegador) ou, só para testar no computador, as pastas locais do gestao_obras.

import fs from 'node:fs';
import path from 'node:path';
import { IDIOMAS } from '../../src/i18n/idiomas.js';
import { IDIOMAS_AJUDA } from '../../src/ajuda/idiomas.js';
import {
    artigoDoIdiomaValido, artigoParaPagina, caminhoDoCabecalho, caminhoDoIndice, caminhoDosArtigos, indiceValido,
} from '../../src/ajuda/formato.js';
import { DOCUMENTOS, PROJETO, lerCampos, textoDaVersao, versoesDoDocumento } from '../../src/legal/firestore.js';
import { compararVersoes, versaoValida } from '../../src/legal/escolha.js';

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents`;

async function lerJson(url) {
    const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao ler ${url.replace(BASE, '')}`);
    return resposta.json();
}

// ---------- Central de Ajuda ----------
// Formato novo, um documento por idioma (src/ajuda/formato.js): de cada idioma, o cabeçalho, o índice e os artigos
// daquele idioma.
// Resultado: { indices: { <idioma>: índice }, indicesAtualizados: { <idioma>: data },
//              artigos: { <idioma>: Map(id → artigo no formato das páginas) }, atualizados: { <idioma>: Map(id → data) } }
// O artigo no formato das páginas tem o conteúdo inteiro no idioma e o endereço (slug) nos outros
// (formato.js, artigoParaPagina), como o site recebe no navegador.

// Guarda o artigo lido de um idioma, conferido.
function guardarArtigo(saida, idioma, doc, data) {
    if (!doc?.id || !artigoDoIdiomaValido(doc, doc.id, idioma)) {
        console.warn(`  artigo fora do formato em ${caminhoDosArtigos(idioma)} (${doc?.id ?? 'sem id'}): ignorado.`);
        return;
    }
    saida.artigos[idioma].set(doc.id, artigoParaPagina(doc));
    saida.atualizados[idioma].set(doc.id, data ?? null);
}

async function ajudaDoFirestore() {
    const saida = { indices: {}, indicesAtualizados: {}, artigos: {}, atualizados: {} };
    for (const idioma of IDIOMAS_AJUDA) {
        try {
            await lerJson(`${BASE}/${caminhoDoCabecalho(idioma)}`);
        } catch (erro) {
            if (/HTTP 404/.test(erro.message)) continue; // nada publicado neste idioma
            throw erro;
        }
        const corpo = await lerJson(`${BASE}/${caminhoDoIndice(idioma)}`);
        const indice = lerCampos(corpo.fields);
        if (!indiceValido(indice, idioma)) throw new Error(`índice da Central em formato inesperado (${idioma})`);
        saida.indices[idioma] = indice;
        saida.indicesAtualizados[idioma] = corpo.updateTime ?? null;
        saida.artigos[idioma] = new Map();
        saida.atualizados[idioma] = new Map();
        let pagina = '';
        do {
            const lista = await lerJson(`${BASE}/${caminhoDosArtigos(idioma)}?pageSize=100${pagina ? `&pageToken=${encodeURIComponent(pagina)}` : ''}`);
            for (const d of lista.documents ?? []) guardarArtigo(saida, idioma, lerCampos(d.fields), d.updateTime);
            pagina = lista.nextPageToken ?? '';
        } while (pagina);
    }
    return saida;
}

// Pasta gravada pelo publicador do gestao_obras (node bin/publicar.mjs --saida <pasta>), com as mesmas pastas do
// Firestore: ajuda_idiomas/<idioma>.json, ajuda_idiomas/<idioma>/partes/indice.json e .../artigos/<id>.json.
function ajudaLocal(pasta) {
    const ler = (arq) => JSON.parse(fs.readFileSync(arq, 'utf8'));
    const data = (arq) => fs.statSync(arq).mtime.toISOString();
    const arquivo = (caminho) => path.join(pasta, ...`${caminho}.json`.split('/'));
    const saida = { indices: {}, indicesAtualizados: {}, artigos: {}, atualizados: {} };
    for (const idioma of IDIOMAS_AJUDA) {
        if (!fs.existsSync(arquivo(caminhoDoCabecalho(idioma)))) continue;
        const arqIndice = arquivo(caminhoDoIndice(idioma));
        const indice = ler(arqIndice);
        if (!indiceValido(indice, idioma)) throw new Error(`índice da Central em formato inesperado (${idioma})`);
        saida.indices[idioma] = indice;
        saida.indicesAtualizados[idioma] = data(arqIndice);
        saida.artigos[idioma] = new Map();
        saida.atualizados[idioma] = new Map();
        const pastaArtigos = path.join(pasta, ...caminhoDosArtigos(idioma).split('/'));
        if (!fs.existsSync(pastaArtigos)) continue;
        for (const nome of fs.readdirSync(pastaArtigos).filter((n) => n.endsWith('.json'))) {
            const arq = path.join(pastaArtigos, nome);
            guardarArtigo(saida, idioma, ler(arq), data(arq));
        }
    }
    return saida;
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

// O que fazer com o que foi lido: erros (o build para) e avisos. Central e Termos são obrigatórios; só com
// semFirestore (teste sem internet) a falta deles vira aviso. Idioma sem texto dos Termos é só aviso (a página
// daquele idioma fica sem versão pronta e o site lê o texto no navegador).
export function conferirFontes({ ajuda, erroAjuda = null, legal, erroLegal = null, semFirestore = false }) {
    const erros = [];
    const avisos = [];
    const falta = (texto) => (semFirestore ? avisos : erros).push(texto);
    const temArtigos = Object.values(ajuda?.artigos ?? {}).some((lista) => lista?.size);
    if (erroAjuda || !ajuda || !Object.keys(ajuda.indices ?? {}).length || !temArtigos) {
        falta(`Central de Ajuda não lida (${erroAjuda?.message ?? 'nada publicado'}): sem páginas prontas dos artigos e fora do sitemap.`);
    }
    if (erroLegal) {
        falta(`Termos e Política não lidos (${erroLegal.message}): sem páginas prontas.`);
    } else {
        for (const documento of DOCUMENTOS) {
            const idiomas = Object.keys(legal?.[documento] ?? {});
            if (!idiomas.length) falta(`${documento}: nenhum texto publicado; sem páginas prontas.`);
            else {
                const faltam = IDIOMAS.map((i) => i.codigo).filter((c) => !idiomas.includes(c));
                if (faltam.length) avisos.push(`${documento}: sem texto em ${faltam.join(', ')}; essas páginas não ficam prontas.`);
            }
        }
    }
    return { erros, avisos };
}
