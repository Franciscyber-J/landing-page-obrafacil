// Conferência das páginas prontas, do sitemap.xml, do robots.txt e do llms.txt gravados em dist/. Roda no fim
// do "npm run build" (o build para se algo estiver errado) e nos testes (ferramentas/paginas/paginas.test.mjs).
//   node ferramentas/paginas/conferir.mjs       confere o dist/ atual

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { IDIOMAS } from '../../src/i18n/idiomas.js';
import { SITE } from '../../src/seo/paginas.js';
import { ROBOS } from '../../src/seo/sitemap.js';

const decodificar = (texto) => texto
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function atributo(etiqueta, nome) {
    const m = new RegExp(`\\s${nome}="([^"]*)"`).exec(etiqueta);
    return m ? decodificar(m[1]) : null;
}

// Texto visível do #root (sem etiquetas, scripts e estilos).
function textoVisivel(html) {
    const raiz = html.indexOf('<div id="root" data-pronta>');
    if (raiz < 0) return '';
    const fim = html.indexOf('<script type="application/json" id="dados-iniciais"', raiz);
    return decodificar(html.slice(raiz, fim > 0 ? fim : undefined)
        .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
        .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

// Lê o que importa da página pronta.
export function lerPagina(html) {
    const cabeca = html.slice(0, html.indexOf('</head>'));
    const links = [...cabeca.matchAll(/<link [^>]*>/g)].map((m) => m[0]);
    const canonicais = links.filter((l) => atributo(l, 'rel') === 'canonical').map((l) => atributo(l, 'href'));
    const alternativos = links.filter((l) => atributo(l, 'rel') === 'alternate').map((l) => ({ hreflang: atributo(l, 'hreflang'), href: atributo(l, 'href') }));
    const jsonld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    return {
        lang: /<html lang="([^"]+)"/.exec(html)?.[1] ?? null,
        titulo: decodificar(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? ''),
        descricao: decodificar(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? ''),
        canonicais,
        alternativos,
        noindex: /<meta name="robots" content="noindex/.test(cabeca),
        jsonld,
        h1: /<h1[\s>]/.test(html.slice(html.indexOf('<div id="root"'))),
        texto: textoVisivel(html),
    };
}

// Problemas de uma página pronta servida no endereço url (absoluto). Lista vazia = tudo certo.
export function conferirPagina(html, url) {
    const p = lerPagina(html);
    const problemas = [];
    if (!p.lang || !IDIOMAS.some((i) => i.codigo === p.lang)) problemas.push(`<html lang> inválido (${p.lang})`);
    if (!p.titulo || p.titulo === 'ObraFácil') problemas.push('sem título próprio');
    if (!p.descricao) problemas.push('sem descrição');
    if (p.canonicais.length !== 1) problemas.push(`${p.canonicais.length} canonical`);
    else if (p.canonicais[0] !== url) problemas.push(`canonical ${p.canonicais[0]} diferente do endereço ${url}`);
    if (!p.alternativos.some((a) => a.hreflang === 'x-default')) problemas.push('sem hreflang x-default');
    if (!p.alternativos.some((a) => a.hreflang === p.lang && a.href === url)) problemas.push('hreflang não inclui a própria página');
    for (const a of p.alternativos) if (!a.href?.startsWith(`${SITE}/`)) problemas.push(`hreflang não absoluto: ${a.href}`);
    if (!p.jsonld.length) problemas.push('sem dados estruturados');
    for (const bloco of p.jsonld) {
        try {
            const dados = JSON.parse(bloco);
            if (dados['@context'] !== 'https://schema.org' || !Array.isArray(dados['@graph'])) problemas.push('JSON-LD sem @context/@graph');
        } catch (e) {
            problemas.push(`JSON-LD inválido (${e.message})`);
        }
    }
    if (!p.h1) problemas.push('sem <h1>');
    if (p.texto.length < 200) problemas.push(`pouco texto visível (${p.texto.length} letras)`);
    return problemas;
}

// Lê o sitemap: [{ loc, lastmod, alternativos: [{ hreflang, href }] }]
export function lerSitemap(xml) {
    return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
        loc: decodificar(/<loc>([^<]+)<\/loc>/.exec(m[1])?.[1] ?? ''),
        lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(m[1])?.[1] ?? null,
        alternativos: [...m[1].matchAll(/<xhtml:link [^>]*>/g)].map((l) => ({ hreflang: atributo(l[0], 'hreflang'), href: atributo(l[0], 'href') })),
    }));
}

export function conferirSitemap(xml) {
    const problemas = [];
    if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) problemas.push('sitemap sem a declaração XML');
    if (!/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9" xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml">/.test(xml)) problemas.push('sitemap sem os namespaces');
    const abertas = (xml.match(/<url>/g) ?? []).length;
    const fechadas = (xml.match(/<\/url>/g) ?? []).length;
    if (abertas !== fechadas) problemas.push('sitemap com <url> sem fechar');
    if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml)) problemas.push('sitemap com & sem escape');
    const entradas = lerSitemap(xml);
    const porLoc = new Map();
    for (const e of entradas) {
        if (porLoc.has(e.loc)) problemas.push(`endereço repetido: ${e.loc}`);
        porLoc.set(e.loc, e);
        if (!e.loc.startsWith(`${SITE}/`)) problemas.push(`endereço não absoluto: ${e.loc}`);
        if (e.lastmod && Number.isNaN(Date.parse(e.lastmod))) problemas.push(`lastmod inválido em ${e.loc}`);
        if (!e.alternativos.some((a) => a.href === e.loc)) problemas.push(`${e.loc}: hreflang não inclui a própria página`);
        if (!e.alternativos.some((a) => a.hreflang === 'x-default')) problemas.push(`${e.loc}: sem x-default`);
    }
    // hreflang recíproco: se A aponta B, B aponta A (o Google ignora o par que não é recíproco).
    for (const e of entradas) {
        for (const a of e.alternativos) {
            if (a.hreflang === 'x-default') continue;
            const outra = porLoc.get(a.href);
            if (!outra) problemas.push(`${e.loc}: hreflang ${a.hreflang} aponta ${a.href}, que não está no sitemap`);
            else if (!outra.alternativos.some((b) => b.href === e.loc)) problemas.push(`${a.href} não aponta de volta para ${e.loc}`);
        }
    }
    return { problemas, entradas };
}

export function conferirRobots(texto) {
    const problemas = [];
    if (!texto.includes(`Sitemap: ${SITE}/sitemap.xml`)) problemas.push('robots.txt sem o sitemap absoluto');
    for (const robo of ROBOS) if (!new RegExp(`User-agent: ${robo}\\nAllow: /\\n`).test(texto)) problemas.push(`robots.txt não libera ${robo}`);
    if (/^Disallow:\s*\/\s*$/m.test(texto)) problemas.push('robots.txt bloqueia o site inteiro');
    return problemas;
}

export function conferirLlms(texto) {
    const problemas = [];
    const linhas = texto.split('\n');
    if (linhas[0] !== '# ObraFácil') problemas.push('llms.txt não começa com "# ObraFácil"');
    if (!linhas.some((l) => l.startsWith('> '))) problemas.push('llms.txt sem o resumo (> ...)');
    if (linhas.filter((l) => l.startsWith('# ')).length !== 1) problemas.push('llms.txt com mais de um título #');
    if (/\{\{|\}\}/.test(texto)) problemas.push('llms.txt com {{...}} sem trocar');
    for (const m of texto.matchAll(/\]\(([^)]+)\)/g)) if (!/^https:\/\//.test(m[1])) problemas.push(`llms.txt com link não absoluto: ${m[1]}`);
    for (const i of IDIOMAS) if (!texto.includes(`${SITE}/${i.codigo.toLowerCase()}/`)) problemas.push(`llms.txt sem a página de ${i.codigo}`);
    return problemas;
}

// Endereço de cada arquivo .html de dist/ (o inverso de arquivoDaPagina).
function enderecoDoArquivo(relativo) {
    const partes = relativo.split(path.sep);
    const nome = partes.pop();
    if (nome === 'index.html') return `${SITE}/${partes.map(encodeURIComponent).join('/')}/`;
    return `${SITE}/${[...partes, nome.replace(/\.html$/, '')].map(encodeURIComponent).join('/')}`;
}

function htmls(pasta, base = pasta) {
    const lista = [];
    for (const e of fs.readdirSync(pasta, { withFileTypes: true })) {
        const p = path.join(pasta, e.name);
        if (e.isDirectory()) lista.push(...htmls(p, base));
        else if (e.name.endsWith('.html')) lista.push(path.relative(base, p));
    }
    return lista;
}

// Tudo o que o build gravou. Devolve a lista de problemas (vazia = tudo certo) e quantas páginas conferiu.
export function conferirDist(dist) {
    const problemas = [];
    const paginas = new Map();
    for (const idioma of IDIOMAS) {
        const pasta = path.join(dist, idioma.codigo.toLowerCase());
        if (!fs.existsSync(pasta)) {
            problemas.push(`sem as páginas de ${idioma.codigo}`);
            continue;
        }
        for (const relativo of htmls(pasta, dist)) {
            const url = enderecoDoArquivo(relativo);
            const html = fs.readFileSync(path.join(dist, relativo), 'utf8');
            for (const p of conferirPagina(html, url)) problemas.push(`${relativo}: ${p}`);
            paginas.set(url, lerPagina(html));
        }
    }
    const { problemas: doSitemap, entradas } = conferirSitemap(fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8'));
    problemas.push(...doSitemap);
    for (const e of entradas) {
        const pagina = paginas.get(e.loc);
        if (!pagina) problemas.push(`sitemap: ${e.loc} não tem página pronta`);
        else if (pagina.noindex) problemas.push(`sitemap: ${e.loc} tem noindex`);
        else if (JSON.stringify(pagina.alternativos) !== JSON.stringify(e.alternativos)) problemas.push(`sitemap: hreflang de ${e.loc} diferente do da página`);
    }
    const noSitemap = new Set(entradas.map((e) => e.loc));
    for (const [url, p] of paginas) if (!p.noindex && !noSitemap.has(url)) problemas.push(`${url} pode ir para o Google mas não está no sitemap`);
    problemas.push(...conferirRobots(fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8')));
    problemas.push(...conferirLlms(fs.readFileSync(path.join(dist, 'llms.txt'), 'utf8')));
    return { problemas, paginas: paginas.size, noSitemap: entradas.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
    const { problemas, paginas, noSitemap } = conferirDist(dist);
    for (const p of problemas.slice(0, 50)) console.error(`  ${p}`);
    if (problemas.length) {
        console.error(`Páginas prontas: ${problemas.length} problema(s).`);
        process.exit(1);
    }
    console.log(`Páginas prontas conferidas: ${paginas} página(s), ${noSitemap} no sitemap, robots.txt e llms.txt em ordem.`);
}
