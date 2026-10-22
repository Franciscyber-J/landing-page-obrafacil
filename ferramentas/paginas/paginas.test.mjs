// Conferência das páginas prontas: os erros que ela tem de pegar e, se o build já rodou, o dist/ inteiro.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../../src/seo/paginas.js';
import { conferirDist, conferirLlms, conferirPagina, conferirRobots, conferirSitemap } from './conferir.mjs';

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

// Depois do "npm run build" (ou do gerador com as pastas locais), confere o dist/ inteiro.
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
const temDist = fs.existsSync(path.join(DIST, 'sitemap.xml'));
test('dist/ gerado: todas as páginas prontas, sitemap, robots.txt e llms.txt sem problema', { skip: temDist ? false : 'dist/ sem páginas prontas (rode npm run build)' }, () => {
    const { problemas, paginas } = conferirDist(DIST);
    assert.deepEqual(problemas.slice(0, 20), []);
    assert.ok(paginas >= 8 * 4, `${paginas} páginas`);
});
