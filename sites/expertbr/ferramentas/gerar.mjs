#!/usr/bin/env node
// Páginas prontas do site da ExpertBR (roda sozinho no fim do "npm run expertbr:build", depois dos dois vite build).
//
// Para cada idioma do cadastro grava dist/<idioma>/index.html: a página inteira em HTML (texto já no HTML, para o
// Google e os buscadores com IA), com título, descrição, canonical, hreflang, Open Graph, dados estruturados e a
// fonte da escrita do idioma (japonês, árabe...). Grava também a raiz (index.html, só para a prévia: no ar o
// .htaccess leva cada pessoa ao idioma dela), sitemap.xml, robots.txt e llms.txt, e no fim confere tudo
// (ferramentas/conferir.mjs): qualquer problema para o build.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { IDIOMAS, INTERNACIONAL, ESCRITAS } from '../src/idiomas.js';
import { conferirDist } from './conferir.mjs';

const PASTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.resolve(PASTA, '..', '..');
const DIST = path.join(PASTA, 'dist');
const SSR = path.join(PASTA, 'dist-ssr', 'servidor.js');

const e = (texto) => String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Data da última mudança no conteúdo do site (os textos daqui e os do ObraFácil que ele mostra). Sem git: sem data.
function dataDoConteudo() {
    try {
        return execFileSync('git', ['log', '-1', '--format=%cI', '--', 'sites/expertbr/src', 'sites/expertbr/public', 'src/i18n/textos'], { cwd: RAIZ, encoding: 'utf8' }).trim() || null;
    } catch {
        return null;
    }
}

// CSS da fonte de cada escrita (entradas "fonte-<escrita>" do vite.config.js), pelo manifesto do build.
function fontesDoManifesto(arquivo) {
    const manifesto = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    const fontes = {};
    for (const item of Object.values(manifesto)) {
        const m = /^fonte-(.+)$/.exec(item.name ?? '');
        if (!m) continue;
        const css = item.file?.endsWith('.css') ? item.file : item.css?.[0];
        if (!css) throw new Error(`Manifesto sem o CSS da fonte ${m[1]}`);
        fontes[m[1]] = `/${css}`;
    }
    return fontes;
}

function montar(modelo, { codigo, direcao, escrita, titulo, descricao, etiquetas, corpo }) {
    let pagina = modelo;
    const trocar = (regra, novo, nome) => {
        if (!regra.test(pagina)) throw new Error(`Modelo (index.html) sem ${nome}`);
        pagina = pagina.replace(regra, () => novo);
    };
    const atributoEscrita = escrita ? ` data-escrita="${e(escrita)}"` : '';
    trocar(/<html lang="[^"]*" dir="[^"]*">/, `<html lang="${e(codigo)}" dir="${e(direcao)}"${atributoEscrita}>`, '<html lang dir>');
    trocar(/<title>[^<]*<\/title>/, `<title>${e(titulo)}</title>`, '<title>');
    trocar(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${e(descricao)}" />`, 'a descrição');
    trocar(/<\/head>/, `  ${etiquetas.join('\n    ')}\n  </head>`, '</head>');
    trocar(/<div id="pagina"><\/div>/, corpo, '<div id="pagina"></div>');
    return pagina;
}

async function principal() {
    if (!fs.existsSync(SSR)) throw new Error('dist-ssr/servidor.js não existe: rode o build SSR antes (npm run expertbr:build faz tudo).');
    // O index.html do vite build (modelo das páginas) e o manifesto vão para dist-ssr na primeira vez: a raiz do dist
    // é regravada abaixo e o manifesto sai do dist, e assim este passo pode rodar de novo sem refazer o vite build.
    const modeloArquivo = path.join(DIST, 'index.html');
    const modeloGuardado = path.join(PASTA, 'dist-ssr', 'modelo.html');
    const manifestoGuardado = path.join(PASTA, 'dist-ssr', 'manifesto.json');
    if (fs.existsSync(path.join(DIST, '.vite', 'manifest.json'))) {
        fs.copyFileSync(modeloArquivo, modeloGuardado);
        fs.copyFileSync(path.join(DIST, '.vite', 'manifest.json'), manifestoGuardado);
        fs.rmSync(path.join(DIST, '.vite'), { recursive: true, force: true });
    }
    if (!fs.existsSync(modeloGuardado)) throw new Error('modelo das páginas não encontrado: rode npm run expertbr:build.');
    const modelo = fs.readFileSync(modeloGuardado, 'utf8');
    const ssr = await import(pathToFileURL(SSR).href);
    const fontes = fontesDoManifesto(manifestoGuardado);
    const lastmod = dataDoConteudo();

    for (const { codigo } of IDIOMAS) {
        const t = ssr.tradutor(codigo);
        const cabeca = ssr.cabecaDaPagina(t, codigo);
        const escrita = ESCRITAS[codigo] ?? null;
        const etiquetas = [...ssr.etiquetasDaCabeca(cabeca)];
        if (escrita) {
            if (!fontes[escrita]) throw new Error(`Fonte da escrita ${escrita} (${codigo}) não saiu no build`);
            etiquetas.unshift(`<link rel="stylesheet" href="${fontes[escrita]}" />`);
        }
        const html = montar(modelo, {
            codigo, direcao: cabeca.direcao, escrita, titulo: cabeca.titulo, descricao: cabeca.descricao, etiquetas,
            corpo: ssr.desenharPagina(codigo),
        });
        const destino = path.join(DIST, ...cabeca.caminho.split('/').filter(Boolean), 'index.html');
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.writeFileSync(destino, html);
    }

    // Raiz: lista dos idiomas (e o script escolhe pelo navegador). No ar, o .htaccess responde antes com 302.
    const en = ssr.tradutor(INTERNACIONAL);
    fs.writeFileSync(modeloArquivo, montar(modelo, {
        codigo: INTERNACIONAL, direcao: 'ltr', escrita: null, titulo: en('seo.titulo'), descricao: en('seo.descricao'),
        etiquetas: ['<meta name="robots" content="noindex, follow" />'],
        corpo: ssr.desenharRaiz(),
    }));

    fs.writeFileSync(path.join(DIST, 'sitemap.xml'), ssr.sitemap(lastmod));
    fs.writeFileSync(path.join(DIST, 'robots.txt'), ssr.robots());
    fs.writeFileSync(path.join(DIST, 'llms.txt'), ssr.llms(ssr.tradutor));

    const { paginas, problemas } = conferirDist(DIST);
    if (problemas.length) {
        for (const p of problemas.slice(0, 60)) console.error(`  ${p}`);
        throw new Error(`${problemas.length} problema(s) nas páginas prontas (lista acima)`);
    }
    console.log(`ExpertBR: ${paginas} página(s) pronta(s) (${IDIOMAS.length} idiomas), sitemap.xml, robots.txt e llms.txt; conferência sem problema.`);
}

principal().catch((erro) => {
    console.error(`\nERRO nas páginas prontas da ExpertBR: ${erro.message}`);
    process.exit(1);
});
