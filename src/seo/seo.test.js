// Testes do SEO das páginas prontas: endereços (canonical/hreflang), cabeça, dados estruturados, sitemap,
// robots.txt e llms.txt. Rodam no Node, com os textos de verdade (src/i18n/textos).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import i18next from 'i18next';
import { CODIGOS, IDIOMAS, REFERENCIA, cadeia } from '../i18n/idiomas.js';
import { precosDoIdioma } from '../i18n/pricing.js';
import { SITE, absoluto, alternativosDaPagina, arquivoDaPagina, caminhoDaPagina, indexavel } from './paginas.js';
import { cabecaDaPagina, etiquetasDaCabeca, jsonNoHtml, montarPagina, separarPreloads } from './cabeca.js';
import { gerarRobots, gerarSitemap, ROBOS } from './sitemap.js';
import { gerarLlms } from './llms.js';

const resources = {};
for (const { codigo } of IDIOMAS) {
    resources[codigo] = { translation: JSON.parse(fs.readFileSync(new URL(`../i18n/textos/${codigo}.json`, import.meta.url), 'utf8')) };
}
const i18n = i18next.createInstance();
i18n.init({
    resources, lng: REFERENCIA, supportedLngs: CODIGOS, fallbackLng: (c) => cadeia(c).slice(1), load: 'currentOnly',
    returnEmptyString: false, interpolation: { escapeValue: false }, initAsync: false, showSupportNotice: false,
});
const tradutor = (codigo) => i18n.getFixedT(codigo);

const MODULO = {
    id: 'diario-de-obra', nome: 'Diário de Obra (RDO)', descricao: 'Registrar o dia da obra.',
    nomes: { 'pt-BR': 'Diário de Obra (RDO)', 'pt-PT': 'Diário de obra', 'en-US': 'Daily reports', 'en-GB': 'Daily reports', 'en-AU': 'Daily reports', 'en-CA': 'Daily reports', 'es-ES': 'Partes diarios', 'es-MX': 'Reportes diarios' },
};
const ARTIGO = {
    id: 'criar-rdo',
    slugs: { 'pt-BR': 'criar-rdo', 'pt-PT': 'criar-diario', 'en-US': 'create-daily-report', 'en-GB': 'create-daily-report', 'en-AU': 'create-daily-report', 'en-CA': 'create-daily-report', 'es-ES': 'crear-parte', 'es-MX': 'crear-reporte' },
};
const ENTRADA = { id: 'criar-rdo', titulo: 'Como criar um RDO', resumo: 'Registre o dia da obra & fotos.', slug: 'criar-rdo', modulo: 'diario-de-obra' };

test('endereços: canonical e versões em cada idioma, com x-default', () => {
    const inicio = alternativosDaPagina({ tipo: 'inicio', codigo: 'pt-BR' });
    assert.equal(inicio.length, IDIOMAS.length + 1);
    assert.deepEqual(inicio.at(-1), { hreflang: 'x-default', href: `${SITE}/` });
    assert.ok(inicio.every((a) => a.href.startsWith(`${SITE}/`)));
    const artigo = alternativosDaPagina({ tipo: 'artigo', codigo: 'es-MX', artigo: ARTIGO });
    assert.equal(artigo.find((a) => a.hreflang === 'es-MX').href, `${SITE}/es-mx/ayuda/crear-reporte`);
    assert.equal(artigo.find((a) => a.hreflang === 'x-default').href, `${SITE}/en-us/help/create-daily-report`);
    assert.equal(caminhoDaPagina({ tipo: 'assunto', codigo: 'en-GB', modulo: MODULO }), '/en-gb/help/topic/daily-reports');
    assert.equal(caminhoDaPagina({ tipo: 'artigo', codigo: 'pt-BR', artigo: { id: 'x', slugs: {} } }), null);
    assert.equal(absoluto('/pt-br/'), `${SITE}/pt-br/`);
});

test('arquivo de cada página: pasta com index.html só na página inicial; o resto vira .html sem barra', () => {
    assert.equal(arquivoDaPagina('/pt-br/'), 'pt-br/index.html');
    assert.equal(arquivoDaPagina('/pt-br/ajuda'), 'pt-br/ajuda.html');
    assert.equal(arquivoDaPagina('/en-us/help/topic/daily-reports'), 'en-us/help/topic/daily-reports.html');
    assert.equal(arquivoDaPagina('/pt-br/termos-de-uso'), 'pt-br/termos-de-uso.html');
});

test('volta do pagamento e Perfil não vão para o Google; o resto vai', () => {
    assert.equal(indexavel({ tipo: 'pagamento' }), false);
    assert.equal(indexavel({ tipo: 'perfil' }), false);
    for (const tipo of ['inicio', 'ajuda', 'assunto', 'artigo', 'legal', 'suporte']) assert.equal(indexavel({ tipo }), true);
});

test('cabeça: título e descrição próprios por página e idioma, canonical absoluto igual ao endereço', () => {
    const vistos = new Set();
    for (const { codigo } of IDIOMAS) {
        const t = tradutor(codigo);
        for (const [pagina, dados] of [
            [{ tipo: 'inicio', codigo }, {}],
            [{ tipo: 'ajuda', codigo }, {}],
            [{ tipo: 'assunto', codigo, modulo: MODULO }, { modulo: MODULO }],
            [{ tipo: 'artigo', codigo, artigo: ARTIGO }, { entrada: ENTRADA, modulo: MODULO }],
            [{ tipo: 'suporte', codigo }, {}],
        ]) {
            const c = cabecaDaPagina({ t, pagina, dados });
            assert.ok(c.titulo && !c.titulo.includes('{{'), `${codigo} ${pagina.tipo}: título`);
            assert.ok(c.descricao && !c.descricao.includes('{{'), `${codigo} ${pagina.tipo}: descrição`);
            assert.equal(c.url, `${SITE}${caminhoDaPagina(pagina)}`);
            assert.ok(c.alternativos.some((a) => a.hreflang === codigo && a.href === c.url));
            if (pagina.tipo === 'inicio') vistos.add(c.titulo);
        }
    }
    // As variantes têm as palavras de cada país (site diary, bitácora, aplicação...).
    assert.match(tradutor('en-GB')('seo.inicio.titulo'), /site diary/);
    assert.match(tradutor('es-MX')('seo.inicio.titulo'), /bitácora/);
    assert.match(tradutor('pt-PT')('seo.inicio.titulo'), /aplicação/);
    assert.match(tradutor('es-ES')('seo.inicio.titulo'), /parte diario/);
    assert.match(tradutor('pt-BR')('seo.inicio.titulo'), /aplicativo de gestão de obras/);
    assert.match(tradutor('en-US')('seo.inicio.titulo'), /construction management app/);
    assert.ok(vistos.size >= 6, 'títulos da página inicial escritos para cada idioma');
});

test('dados estruturados: aplicativo com os preços reais do país, perguntas frequentes e trilha nos artigos', () => {
    for (const { codigo } of IDIOMAS) {
        const t = tradutor(codigo);
        const c = cabecaDaPagina({ t, pagina: { tipo: 'inicio', codigo } });
        const grafo = JSON.parse(JSON.stringify(c.jsonld))['@graph'];
        const app = grafo.find((n) => [].concat(n['@type']).includes('SoftwareApplication'));
        assert.equal(app.applicationCategory, 'BusinessApplication');
        assert.equal(app.operatingSystem, 'Android, iOS, Windows, Web');
        const precos = precosDoIdioma(codigo);
        assert.deepEqual(app.offers.map((o) => [o.price, o.priceCurrency]), [['0', precos.moeda], [precos.mensal, precos.moeda], [precos.anual, precos.moeda]]);
        assert.match(app.offers[1].price, /^\d+(\.\d{2})?$/);
        const faq = grafo.find((n) => n['@type'] === 'FAQPage');
        assert.equal(faq.mainEntity.length, 10);
        assert.ok(faq.mainEntity.every((q) => q.name && q.acceptedAnswer.text));
        assert.ok(grafo.some((n) => n['@type'] === 'Organization'));
        assert.ok(grafo.some((n) => n['@type'] === 'WebSite'));
    }
    const c = cabecaDaPagina({ t: tradutor('pt-BR'), pagina: { tipo: 'artigo', codigo: 'pt-BR', artigo: ARTIGO }, dados: { entrada: ENTRADA, modulo: MODULO } });
    const trilha = c.jsonld['@graph'].find((n) => n['@type'] === 'BreadcrumbList');
    assert.deepEqual(trilha.itemListElement.map((i) => i.item), [
        `${SITE}/pt-br/ajuda`, `${SITE}/pt-br/ajuda/assunto/diario-de-obra-rdo`, `${SITE}/pt-br/ajuda/criar-rdo`,
    ]);
    assert.equal(precosDoIdioma('pt-BR').moeda, 'BRL');
    assert.equal(precosDoIdioma('pt-BR').mensal, '99.90');
});

test('página montada: cabeça trocada, conteúdo pronto no #root e JSON que não fecha o <script> antes da hora', () => {
    const modelo = '<!doctype html><html lang="pt-BR"><head><title>ObraFácil</title><meta name="description" content="x" /></head><body><div id="root"></div></body></html>';
    const c = cabecaDaPagina({ t: tradutor('en-GB'), pagina: { tipo: 'artigo', codigo: 'en-GB', artigo: ARTIGO }, dados: { entrada: ENTRADA, modulo: MODULO } });
    const html = montarPagina(modelo, {
        cabeca: c,
        html: '<link rel="preload" as="image" href="/a.png"/><!--$--><main><h1>Oi</h1></main><!--/$-->',
        dadosIniciais: { texto: '</script><script>alert(1)</script>' },
    });
    assert.match(html, /<html lang="en-GB" dir="ltr">/);
    assert.match(html, /<title>Como criar um RDO · ObraFácil<\/title>/);
    assert.match(html, /<meta name="description" content="Registre o dia da obra &amp; fotos\." \/>/);
    assert.match(html, /<link rel="preload" as="image" href="\/a.png"\/>\s*<link rel="canonical"/);
    assert.match(html, /<div id="root" data-pronta><!--\$--><main><h1>Oi<\/h1><\/main><!--\/\$--><\/div>/);
    assert.ok(!html.includes('</script><script>alert'), 'o JSON escapou o </script>');
    const dados = /<script type="application\/json" id="dados-iniciais">(.*?)<\/script>/.exec(html)[1];
    assert.equal(JSON.parse(dados).texto, '</script><script>alert(1)</script>');
    assert.equal(etiquetasDaCabeca(c).filter((e) => e.includes('rel="canonical"')).length, 1);
    assert.deepEqual(separarPreloads('<main></main>'), { corpo: '<main></main>', preloads: [] });
    assert.equal(jsonNoHtml({ a: '<&>' }), '{"a":"\\u003c\\u0026\\u003e"}');
    assert.ok(etiquetasDaCabeca(cabecaDaPagina({ t: tradutor('pt-BR'), pagina: { tipo: 'perfil', codigo: 'pt-BR' } })).some((e) => e.includes('noindex')));
});

test('sitemap: XML com hreflang e x-default, data válida, & escapado e sem endereço repetido', () => {
    const entradas = IDIOMAS.map(({ codigo }) => {
        const c = cabecaDaPagina({ t: tradutor(codigo), pagina: { tipo: 'inicio', codigo } });
        return { url: c.url, lastmod: '2026-10-20T12:00:00Z', alternativos: c.alternativos };
    });
    const xml = gerarSitemap(entradas);
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.equal((xml.match(/<url>/g) ?? []).length, IDIOMAS.length);
    assert.equal((xml.match(/hreflang="x-default"/g) ?? []).length, IDIOMAS.length);
    assert.match(xml, /<lastmod>2026-10-20T12:00:00\.000Z<\/lastmod>/);
    assert.match(gerarSitemap([{ url: `${SITE}/a?b=1&c=2`, alternativos: [] }]), /a\?b=1&amp;c=2/);
    assert.throws(() => gerarSitemap([entradas[0], entradas[0]]), /repetido/);
    assert.ok(!gerarSitemap([{ url: `${SITE}/x`, lastmod: 'não é data', alternativos: [] }]).includes('<lastmod>'));
});

test('robots.txt: libera Google, Bing e os buscadores com IA, aponta o sitemap absoluto e não bloqueia nada', () => {
    const robots = gerarRobots();
    for (const robo of ['Googlebot', 'Google-Extended', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Bingbot']) {
        assert.ok(ROBOS.includes(robo));
        assert.match(robots, new RegExp(`User-agent: ${robo}\\nAllow: /\\n`));
    }
    assert.match(robots, new RegExp(`Sitemap: ${SITE}/sitemap.xml`));
    assert.doesNotMatch(robots, /Disallow/);
});

test('llms.txt: título, resumo, inglês e português, preços de cada idioma e links absolutos', () => {
    const indice = { modulos: [MODULO], artigos: [{ ...ENTRADA, prioritario: true }] };
    const texto = gerarLlms({ tradutor, indices: { 'en-US': { ...indice, artigos: [{ ...ENTRADA, slug: 'create-daily-report', prioritario: true }] }, 'pt-BR': indice } });
    const linhas = texto.split('\n');
    assert.equal(linhas[0], '# ObraFácil');
    assert.ok(linhas.some((l) => l.startsWith('> Construction management app')));
    assert.equal(linhas.filter((l) => l.startsWith('# ')).length, 1);
    assert.ok(texto.includes('## What ObraFácil is (English (US))'));
    assert.ok(texto.includes('## O que é o ObraFácil (Português (Brasil))'));
    assert.ok(texto.includes('## Optional'));
    assert.match(texto, /BRL\s99,90/, 'preço em real com o código');
    for (const { codigo, nome } of IDIOMAS) {
        const { moeda } = precosDoIdioma(codigo);
        const linha = texto.split('\n').find((l) => l.startsWith(`- [${nome}](`) && l.includes('#'));
        assert.ok(linha && (linha.match(new RegExp(moeda, 'g')) ?? []).length === 2, `${codigo}: ${linha}`);
    }
    assert.ok(texto.includes(`${SITE}/pt-br/ajuda/criar-rdo`) && texto.includes(`${SITE}/en-us/help/create-daily-report`));
    assert.doesNotMatch(texto, /\{\{|\*\*\*/);
    for (const m of texto.matchAll(/\]\(([^)]+)\)/g)) assert.match(m[1], /^https:\/\//);
    for (const { codigo } of IDIOMAS) assert.ok(texto.includes(`${SITE}/${codigo.toLowerCase()}/`), codigo);
});

// Endereço na escrita do idioma (decisão do Francis, 26/10/2026): um artigo de exemplo só de teste, com o slug em
// japonês no pt-BR e em árabe no en-US (e na x-default), e um assunto com nome em japonês.
const JAPONES = '写真を追加';
const ARABE = 'إضافة-صورة';
const ARTIGO_OUTRAS = { id: 'exemplo-outras-escritas', slugs: { ...ARTIGO.slugs, 'pt-BR': JAPONES, 'en-US': ARABE, 'en-GB': ARABE } };
const MODULO_OUTRAS = { ...MODULO, nomes: { ...MODULO.nomes, 'pt-BR': 'デイリーレポート' } };
const enc = encodeURIComponent;

test('outras escritas: endereço com as letras, arquivo da página pronta em UTF-8 e %XX no Google (canonical, hreflang, sitemap)', () => {
    assert.equal(caminhoDaPagina({ tipo: 'artigo', codigo: 'pt-BR', artigo: ARTIGO_OUTRAS }), `/pt-br/ajuda/${JAPONES}`);
    assert.equal(arquivoDaPagina(`/pt-br/ajuda/${JAPONES}`), `pt-br/ajuda/${JAPONES}.html`);
    assert.equal(arquivoDaPagina(`/en-us/help/topic/${ARABE}`), `en-us/help/topic/${ARABE}.html`);
    assert.equal(absoluto(`/pt-br/ajuda/${JAPONES}`), `${SITE}/pt-br/ajuda/${enc(JAPONES)}`);

    const c = cabecaDaPagina({ t: tradutor('pt-BR'), pagina: { tipo: 'artigo', codigo: 'pt-BR', artigo: ARTIGO_OUTRAS }, dados: { entrada: { ...ENTRADA, slug: JAPONES }, modulo: MODULO_OUTRAS } });
    assert.equal(c.caminho, `/pt-br/ajuda/${JAPONES}`);
    assert.equal(c.url, `${SITE}/pt-br/ajuda/${enc(JAPONES)}`);
    assert.equal(c.alternativos.find((a) => a.hreflang === 'en-US').href, `${SITE}/en-us/help/${enc(ARABE)}`);
    assert.equal(c.alternativos.find((a) => a.hreflang === 'x-default').href, `${SITE}/en-us/help/${enc(ARABE)}`);
    assert.equal(c.alternativos.find((a) => a.hreflang === 'es-MX').href, `${SITE}/es-mx/ayuda/crear-reporte`);
    // Na cabeça da página e nos dados estruturados, só ASCII nos endereços (o padrão das URLs).
    for (const e of etiquetasDaCabeca(c).filter((x) => x.startsWith('<link'))) assert.match(e, /^[\x20-\x7e]+$/, e);
    const trilha = c.jsonld['@graph'].find((n) => n['@type'] === 'BreadcrumbList');
    assert.deepEqual(trilha.itemListElement.map((i) => i.item), [
        `${SITE}/pt-br/ajuda`, `${SITE}/pt-br/ajuda/assunto/${enc('デイリーレポート')}`, `${SITE}/pt-br/ajuda/${enc(JAPONES)}`,
    ]);
    // O endereço volta ao texto certo.
    assert.equal(decodeURIComponent(new URL(c.url).pathname), `/pt-br/ajuda/${JAPONES}`);

    const xml = gerarSitemap([{ url: c.url, lastmod: null, alternativos: c.alternativos }]);
    assert.ok(xml.includes(`<loc>${SITE}/pt-br/ajuda/${enc(JAPONES)}</loc>`));
    assert.ok(xml.includes(`hreflang="en-US" href="${SITE}/en-us/help/${enc(ARABE)}"`));
    assert.match(xml, /^[\n\x20-\x7e]+$/, 'sitemap só com ASCII');
});

test('outras escritas: llms.txt com o link do artigo e do assunto em %XX', () => {
    const indice = { modulos: [MODULO_OUTRAS], artigos: [{ ...ENTRADA, slug: JAPONES, prioritario: true }] };
    const texto = gerarLlms({ tradutor, indices: { 'pt-BR': indice } });
    assert.ok(texto.includes(`](${SITE}/pt-br/ajuda/${enc(JAPONES)})`));
    assert.ok(texto.includes(`](${SITE}/pt-br/ajuda/assunto/${enc('デイリーレポート')})`));
});
