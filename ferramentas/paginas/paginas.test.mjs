// Conferência das páginas prontas: os erros que ela tem de pegar e, se o build já rodou, o dist/ inteiro.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../../src/seo/paginas.js';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { conferirDist, conferirLlms, conferirPagina, conferirRobots, conferirSitemap } from './conferir.mjs';
import { conferirFontes, lerAjuda } from './fontes.mjs';
import { IDIOMAS } from '../../src/i18n/idiomas.js';

const URL_ARTIGO = `${SITE}/pt-br/ajuda/criar-rdo`;
const TEXTO = 'Texto do artigo, visível sem JavaScript. '.repeat(10);

function pagina({ lang = 'pt-BR', canonical = URL_ARTIGO, jsonld = '{"@context":"https://schema.org","@graph":[]}', titulo = 'Como criar um RDO · ObraFácil', corpo = `<main><h1>Criar RDO</h1><p>${TEXTO}</p></main>` } = {}) {
    return `<!doctype html><html lang="${lang}" dir="ltr"><head><title>${titulo}</title><meta name="description" content="Registre o dia." />
    <link rel="canonical" href="${canonical}" data-idiomas data-build />
    <link rel="alternate" hreflang="pt-BR" href="${URL_ARTIGO}" data-idiomas data-build />
    <link rel="alternate" hreflang="x-default" href="${SITE}/en-us/help/create-daily-report" data-idiomas data-build />
    <script type="application/ld+json" data-build>${jsonld}</script></head><body><div id="root" data-pronta>${corpo}</div></body></html>`;
}

test('página pronta certa passa', () => {
    assert.deepEqual(conferirPagina(pagina(), URL_ARTIGO), []);
});

test('pega canonical errado ou relativo, JSON-LD quebrado, título genérico e página sem texto', () => {
    assert.match(conferirPagina(pagina({ canonical: '/pt-br/ajuda/criar-rdo' }), URL_ARTIGO).join(), /canonical/);
    assert.match(conferirPagina(pagina({ canonical: `${SITE}/pt-br/ajuda/criar-rdo/` }), URL_ARTIGO).join(), /canonical/);
    assert.match(conferirPagina(pagina({ jsonld: '{"@context":' }), URL_ARTIGO).join(), /JSON-LD inválido/);
    assert.match(conferirPagina(pagina({ titulo: 'ObraFácil' }), URL_ARTIGO).join(), /título/);
    assert.match(conferirPagina(pagina({ corpo: '<main><h1>Oi</h1></main>' }), URL_ARTIGO).join(), /pouco texto/);
    assert.match(conferirPagina(pagina({ corpo: `<main><p>${TEXTO}</p></main>` }), URL_ARTIGO).join(), /sem <h1>/);
    assert.match(conferirPagina(pagina({ lang: 'fr' }), URL_ARTIGO).join(), /lang/);
});

test('sitemap: pega endereço repetido, hreflang que não volta e & sem escape', () => {
    const url = (loc, alternativos) => `<url><loc>${loc}</loc>${alternativos.map(([h, href]) => `<xhtml:link rel="alternate" hreflang="${h}" href="${href}" />`).join('')}</url>`;
    const cabeca = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';
    const a = `${SITE}/pt-br/`;
    const b = `${SITE}/en-us/`;
    const certo = `${cabeca}${url(a, [['pt-BR', a], ['en-US', b], ['x-default', `${SITE}/`]])}${url(b, [['pt-BR', a], ['en-US', b], ['x-default', `${SITE}/`]])}</urlset>`;
    assert.deepEqual(conferirSitemap(certo).problemas, []);
    const semVolta = `${cabeca}${url(a, [['pt-BR', a], ['en-US', b], ['x-default', `${SITE}/`]])}${url(b, [['en-US', b], ['x-default', `${SITE}/`]])}</urlset>`;
    assert.match(conferirSitemap(semVolta).problemas.join(), /não aponta de volta/);
    const repetido = `${cabeca}${url(a, [['pt-BR', a], ['x-default', a]])}${url(a, [['pt-BR', a], ['x-default', a]])}</urlset>`;
    assert.match(conferirSitemap(repetido).problemas.join(), /repetido/);
    assert.match(conferirSitemap(`${cabeca}${url(`${SITE}/a?b&c`, [])}</urlset>`).problemas.join(), /& sem escape/);
});

test('robots.txt e llms.txt: pega o que falta', () => {
    assert.match(conferirRobots('User-agent: *\nDisallow: /\n').join(), /sitemap absoluto.*GPTBot|GPTBot/s);
    assert.match(conferirLlms('# Outro\n').join(), /ObraFácil/);
});

test('fontes: sem a Central ou os Termos o build para; com --sem-firestore só avisa', () => {
    const textos = Object.fromEntries(IDIOMAS.map((i) => [i.codigo, { atual: {} }]));
    const legal = { termos: textos, privacidade: textos };
    const ajuda = { indices: { 'pt-BR': {} }, artigos: { 'pt-BR': new Map([['a', {}]]) } };
    assert.deepEqual(conferirFontes({ ajuda, legal }), { erros: [], avisos: [] });
    assert.equal(conferirFontes({ ajuda: null, erroAjuda: new Error('fetch failed'), legal }).erros.length, 1);
    assert.equal(conferirFontes({ ajuda: { indices: {}, artigos: {} }, legal }).erros.length, 1);
    assert.equal(conferirFontes({ ajuda: { indices: { 'pt-BR': {} }, artigos: { 'pt-BR': new Map() } }, legal }).erros.length, 1);
    assert.equal(conferirFontes({ ajuda, legal: {}, erroLegal: new Error('fetch failed') }).erros.length, 1);
    assert.equal(conferirFontes({ ajuda, legal: { termos: textos, privacidade: {} } }).erros.length, 1);
    const sem = conferirFontes({ ajuda: null, erroAjuda: new Error('x'), legal: {}, erroLegal: new Error('x'), semFirestore: true });
    assert.equal(sem.erros.length, 0);
    assert.equal(sem.avisos.length, 2);
    const umIdioma = conferirFontes({ ajuda, legal: { termos: { 'pt-BR': {} }, privacidade: textos } });
    assert.equal(umIdioma.erros.length, 0);
    assert.match(umIdioma.avisos.join(), /termos: sem texto em pt-PT/);
});

// ---------- Central no formato novo (um documento por idioma): só o idioma de cada página ----------

function cabecalho(idioma, hash = 'h1') {
    return { formato: 2, idioma, hash, versao: 1, total: 1 };
}
function indiceDe(idioma, hash = 'h1') {
    return { formato: 2, idioma, hash, versao: 1, total: 1, modulos: [{ id: 'diario', nome: 'Diário', nomes: {}, total: 1 }], artigos: [{ id: 'criar-rdo', slug: `rdo-${idioma}`, modulo: 'diario', hash: 'a1' }] };
}
function artigoDe(idioma, id = 'criar-rdo') {
    return {
        formato: 2, id, idioma, modulo: 'diario', publico: ['gestor'], pre_requisitos: [], relacionados: [],
        conteudo: { slug: `rdo-${idioma}`, titulo: `Criar RDO (${idioma})`, resumo: 'r', tags: [], passos: [{ titulo: 'p', texto: 't' }] },
        slugs: { 'pt-BR': 'rdo-pt-BR', 'en-US': 'rdo-en-US' }, busca: 'p t', hash: 'a1', hash_documento: 'x',
    };
}

test('fontes: Central da pasta local (saída do publicador com --saida), no formato novo', async () => {
    const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'ajuda-por-idioma-'));
    const gravar = (caminho, dados) => {
        const arq = path.join(pasta, ...`${caminho}.json`.split('/'));
        fs.mkdirSync(path.dirname(arq), { recursive: true });
        fs.writeFileSync(arq, JSON.stringify(dados));
    };
    try {
        for (const idioma of ['pt-BR', 'en-US']) {
            gravar(`ajuda_idiomas/${idioma}`, cabecalho(idioma));
            gravar(`ajuda_idiomas/${idioma}/partes/indice`, indiceDe(idioma));
            gravar(`ajuda_idiomas/${idioma}/artigos/criar-rdo`, artigoDe(idioma));
        }
        // Sobra do formato antigo na mesma pasta: o site não lê mais.
        gravar('ajuda_indices/es-ES', indiceDe('es-ES'));
        const ajuda = await lerAjuda({ local: pasta });
        assert.deepEqual(Object.keys(ajuda.indices).sort(), ['en-US', 'pt-BR']);
        const doc = ajuda.artigos['pt-BR'].get('criar-rdo');
        assert.equal(doc.conteudo['pt-BR'].titulo, 'Criar RDO (pt-BR)');
        assert.deepEqual(doc.conteudo['en-US'], { slug: 'rdo-en-US' }, 'só o endereço nos outros idiomas (hreflang)');
        assert.equal(ajuda.artigos['en-US'].get('criar-rdo').conteudo['en-US'].titulo, 'Criar RDO (en-US)');
        assert.ok(ajuda.atualizados['pt-BR'].get('criar-rdo'));
        assert.deepEqual(conferirFontes({ ajuda, legal: { termos: {}, privacidade: {} }, semFirestore: true }).erros, []);
    } finally {
        fs.rmSync(pasta, { recursive: true });
    }
});

test('fontes: Central do Firestore pela API REST, com páginas de artigos, só nos idiomas publicados', async () => {
    const valor = (v) => (v === null ? { nullValue: null } : Array.isArray(v) ? { arrayValue: { values: v.map(valor) } }
        : typeof v === 'object' ? { mapValue: { fields: campos(v) } } : typeof v === 'number' ? { integerValue: String(v) }
            : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: v });
    const campos = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, valor(v)]));
    const pedidos = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (url) => {
        const [caminho, busca = ''] = String(url).split('/documents/')[1].split('?');
        pedidos.push(caminho + (busca ? `?${busca}` : ''));
        const resposta = (corpo) => ({ ok: true, status: 200, json: async () => corpo });
        if (caminho === 'ajuda_idiomas/pt-BR') return resposta({ fields: campos(cabecalho('pt-BR')) });
        if (caminho === 'ajuda_idiomas/pt-BR/partes/indice') return resposta({ fields: campos(indiceDe('pt-BR')), updateTime: '2026-10-26T10:00:00Z' });
        if (caminho === 'ajuda_idiomas/pt-BR/artigos') {
            return busca.includes('pageToken')
                ? resposta({ documents: [{ fields: campos(artigoDe('pt-BR', 'editar-rdo')), updateTime: '2026-10-25T10:00:00Z' }] })
                : resposta({ documents: [{ fields: campos(artigoDe('pt-BR')), updateTime: '2026-10-26T09:00:00Z' }], nextPageToken: 'p2' });
        }
        return { ok: false, status: 404, json: async () => ({}) };
    };
    try {
        const ajuda = await lerAjuda();
        assert.deepEqual(Object.keys(ajuda.indices), ['pt-BR']);
        assert.deepEqual([...ajuda.artigos['pt-BR'].keys()].sort(), ['criar-rdo', 'editar-rdo']);
        assert.equal(ajuda.atualizados['pt-BR'].get('criar-rdo'), '2026-10-26T09:00:00Z');
        assert.equal(ajuda.indicesAtualizados['pt-BR'], '2026-10-26T10:00:00Z');
        assert.ok(pedidos.every((p) => p.startsWith('ajuda_idiomas/')), 'nada do formato antigo');
        assert.ok(!pedidos.some((p) => p.startsWith('ajuda_idiomas/en-US/')), 'idioma sem cabeçalho: nem o índice nem os artigos');
    } finally {
        globalThis.fetch = original;
    }
});

const SSR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist-ssr', 'entrada.js');
test('gerador sai com erro (sem gravar nada) quando a Central não é lida', { skip: fs.existsSync(SSR) ? false : 'sem dist-ssr (rode npm run build)' }, () => {
    const vazia = fs.mkdtempSync(path.join(os.tmpdir(), 'ajuda-vazia-'));
    const sitemap = path.join(path.dirname(SSR), '..', 'dist', 'sitemap.xml');
    const antes = fs.existsSync(sitemap) ? fs.statSync(sitemap).mtimeMs : null;
    const r = spawnSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'gerar.mjs'), '--ajuda-local', vazia], { encoding: 'utf8' });
    fs.rmSync(vazia, { recursive: true });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /Central de Ajuda não lida/);
    assert.equal(fs.existsSync(sitemap) ? fs.statSync(sitemap).mtimeMs : null, antes, 'nada foi gravado');
});

// Depois do "npm run build" (ou do gerador com as pastas locais), confere o dist/ inteiro.
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
const temDist = fs.existsSync(path.join(DIST, 'sitemap.xml'));
test('dist/ gerado: todas as páginas prontas, sitemap, robots.txt e llms.txt sem problema', { skip: temDist ? false : 'dist/ sem páginas prontas (rode npm run build)' }, () => {
    const { problemas, paginas } = conferirDist(DIST);
    assert.deepEqual(problemas.slice(0, 20), []);
    assert.ok(paginas >= 8 * 4, `${paginas} páginas`);
});
