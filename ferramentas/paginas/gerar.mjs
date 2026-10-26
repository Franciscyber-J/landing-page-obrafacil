#!/usr/bin/env node
// Páginas prontas do site (roda sozinho no fim do "npm run build", depois do vite build e do build SSR).
//
// Para cada idioma, grava em dist/ uma página de verdade, com o texto já dentro do HTML, título, descrição,
// canonical, hreflang, Open Graph e dados estruturados: página inicial, Central de Ajuda (início, assuntos e
// artigos), Termos, Política, Suporte, Perfil e volta do pagamento. Robôs (Google, buscadores com IA) e
// navegadores sem JavaScript leem tudo; o site, ao abrir, "hidrata" a página (liga os botões) sem redesenhar.
// Grava também sitemap.xml, robots.txt, llms.txt e o índice da Central de cada idioma em dados/ajuda/.
//
// O conteúdo da Central e dos Termos vem do Firestore (leitura pública, sem chave).
//
// Sem ler a Central ou os Termos, o build para com erro (nada é gravado). Testes no computador (nunca para publicar):
//   node ferramentas/paginas/gerar.mjs --ajuda-local <saída do publicador> --legal-local <gestao_obras/legal>
//   node ferramentas/paginas/gerar.mjs --sem-firestore   (sem internet: só as páginas que não dependem do Firestore)

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { COMPRAS, DOCUMENTOS_LEGAIS, IDIOMAS } from '../../src/i18n/idiomas.js';
import { idiomaDoConteudo } from '../../src/ajuda/idiomas.js';
import { lerTexto, tituloDoTexto } from '../../src/legal/markdown.js';
import { arquivoDaPagina, indexavel } from '../../src/seo/paginas.js';
import { cabecaDaPagina, montarPagina } from '../../src/seo/cabeca.js';
import { gerarRobots, gerarSitemap } from '../../src/seo/sitemap.js';
import { gerarLlms } from '../../src/seo/llms.js';
import { conferirFontes, lerAjuda, lerLegal } from './fontes.mjs';
import { conferirDist } from './conferir.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = path.join(RAIZ, 'dist');
const SSR = path.join(RAIZ, 'dist-ssr', 'entrada.js');

function opcao(nome) {
    const i = process.argv.indexOf(nome);
    return i >= 0 ? path.resolve(process.argv[i + 1]) : null;
}

// Data da última mudança no código do site (página inicial e Suporte no sitemap). Sem git: sem data.
function dataDoCodigo() {
    try {
        return execFileSync('git', ['log', '-1', '--format=%cI', '--', 'src', 'public', 'index.html'], { cwd: RAIZ, encoding: 'utf8' }).trim() || null;
    } catch {
        return null;
    }
}

// Artigo como a página precisa dele: o conteúdo inteiro no idioma da página e só o endereço (slug) nos outros.
function artigoResumido(doc, idiomaConteudo) {
    const conteudo = {};
    for (const [idioma, c] of Object.entries(doc.conteudo ?? {})) conteudo[idioma] = idioma === idiomaConteudo ? c : { slug: c.slug };
    return {
        id: doc.id, modulo: doc.modulo, publico: doc.publico ?? [], pre_requisitos: doc.pre_requisitos ?? [],
        relacionados: doc.relacionados ?? [], hash: doc.hash, conteudo,
    };
}

function slugsDoArtigo(doc) {
    return Object.fromEntries(Object.entries(doc.conteudo ?? {}).filter(([, c]) => c?.slug).map(([idioma, c]) => [idioma, c.slug]));
}

function maisRecente(datas) {
    const ms = datas.map((d) => Date.parse(d ?? '')).filter(Number.isFinite);
    return ms.length ? new Date(Math.max(...ms)).toISOString() : null;
}

async function principal() {
    const modeloArquivo = path.join(DIST, 'index.html');
    if (!fs.existsSync(modeloArquivo)) throw new Error('dist/index.html não existe: rode o vite build antes.');
    if (!fs.existsSync(SSR)) throw new Error('dist-ssr/entrada.js não existe: rode o build SSR antes (npm run build faz os dois).');
    const modelo = fs.readFileSync(modeloArquivo, 'utf8');
    const { renderizar, tradutor } = await import(pathToFileURL(SSR).href);

    const ajudaLocal = opcao('--ajuda-local');
    const legalLocal = opcao('--legal-local');
    if (ajudaLocal || legalLocal) console.warn('\nATENÇÃO: conteúdo de pastas locais (teste). Este dist NÃO é para publicar.\n');

    // Sem a Central ou sem os Termos o build para: publicar assim tiraria os artigos do sitemap e deixaria páginas
    // velhas no servidor. Só com --sem-firestore (teste sem internet) ele segue, avisando.
    const semFirestore = process.argv.includes('--sem-firestore');
    let ajuda = null;
    let erroAjuda = null;
    try {
        ajuda = await lerAjuda({ local: ajudaLocal });
    } catch (erro) {
        erroAjuda = erro;
    }
    let legal = {};
    let erroLegal = null;
    try {
        legal = await lerLegal({ local: legalLocal });
    } catch (erro) {
        erroLegal = erro;
    }
    const { erros, avisos } = conferirFontes({ ajuda, erroAjuda, legal, erroLegal, semFirestore });
    for (const aviso of avisos) console.warn(`AVISO: ${aviso}`);
    if (erros.length) {
        for (const erro of erros) console.error(`ERRO: ${erro}`);
        throw new Error('o conteúdo do Firestore não foi lido; confira a internet e rode o build de novo (nada foi gravado)');
    }

    // ---------- Lista das páginas ----------
    const dataCodigo = dataDoCodigo();
    const paginas = [];
    const indicesGravados = {};
    for (const { codigo } of IDIOMAS) {
        paginas.push({ pagina: { tipo: 'inicio', codigo }, lastmod: dataCodigo });
        paginas.push({ pagina: { tipo: 'suporte', codigo }, lastmod: dataCodigo });
        paginas.push({ pagina: { tipo: 'perfil', codigo } });
        for (const compra of [null, ...COMPRAS]) paginas.push({ pagina: { tipo: 'pagamento', codigo, compra } });

        for (const documento of DOCUMENTOS_LEGAIS) {
            const dados = legal[documento]?.[codigo];
            if (!dados) continue;
            const blocos = lerTexto(dados.atual.texto);
            paginas.push({
                pagina: { tipo: 'legal', codigo, documento },
                dadosCabeca: { titulo: tituloDoTexto(blocos), blocos },
                dados: { legal: dados },
                lastmod: dados.atual.vigenteDesde,
            });
        }

        const idiomaConteudo = idiomaDoConteudo(codigo);
        const indice = ajuda?.indices[idiomaConteudo];
        if (!indice) continue;
        const endereco = `/dados/ajuda/${idiomaConteudo}.${String(indice.hash ?? indice.versao).slice(0, 12)}.json`;
        indicesGravados[idiomaConteudo] = { endereco, indice };
        const doIndice = (extra = {}) => ({ ajuda: { indice: endereco, ...extra } });
        const paraRender = (extra = {}) => ({ ajuda: { indice, ...extra } });
        paginas.push({
            pagina: { tipo: 'ajuda', codigo },
            dados: doIndice(), dadosRender: paraRender(),
            lastmod: ajuda.indicesAtualizados[idiomaConteudo],
        });
        for (const modulo of indice.modulos) {
            const doModulo = indice.artigos.filter((a) => a.modulo === modulo.id);
            paginas.push({
                pagina: { tipo: 'assunto', codigo, modulo },
                dadosCabeca: { modulo },
                dados: doIndice(), dadosRender: paraRender(),
                lastmod: maisRecente(doModulo.map((a) => ajuda.atualizados[idiomaConteudo]?.get(a.id))),
            });
        }
        for (const entrada of indice.artigos) {
            const doc = ajuda.artigos[idiomaConteudo]?.get(entrada.id);
            if (!doc?.conteudo?.[idiomaConteudo]) {
                console.warn(`  artigo ${entrada.id} (${idiomaConteudo}) está no índice mas não foi publicado; página não gerada.`);
                continue;
            }
            const artigo = artigoResumido(doc, idiomaConteudo);
            const modulo = indice.modulos.find((m) => m.id === entrada.modulo) ?? null;
            paginas.push({
                pagina: { tipo: 'artigo', codigo, artigo: { id: doc.id, slugs: slugsDoArtigo(doc) } },
                dadosCabeca: { entrada, modulo },
                dados: doIndice({ artigo }), dadosRender: paraRender({ artigo }),
                lastmod: ajuda.atualizados[idiomaConteudo]?.get(doc.id),
            });
        }
    }

    // ---------- Cabeças (e hreflang só para as versões que existem de verdade) ----------
    for (const p of paginas) p.cabeca = cabecaDaPagina({ t: tradutor(p.pagina.codigo), pagina: p.pagina, dados: p.dadosCabeca });
    const existentes = new Set(paginas.map((p) => p.cabeca.url));
    for (const p of paginas) {
        p.cabeca.alternativos = p.cabeca.alternativos.filter((a) => existentes.has(a.href) || (a.hreflang === 'x-default' && p.pagina.tipo === 'inicio'));
        if (!p.cabeca.alternativos.some((a) => a.hreflang === 'x-default')) {
            // Sem a versão internacional: a x-default é a própria página.
            p.cabeca.alternativos.push({ hreflang: 'x-default', href: p.cabeca.url });
        }
    }

    // ---------- Gravação ----------
    const gravados = new Set();
    for (const p of paginas) {
        const arquivo = arquivoDaPagina(p.cabeca.caminho);
        if (gravados.has(arquivo)) throw new Error(`Duas páginas no mesmo arquivo: ${arquivo}`);
        gravados.add(arquivo);
        let html;
        try {
            html = renderizar({ caminho: p.cabeca.caminho, codigo: p.pagina.codigo, dados: p.dadosRender ?? p.dados ?? null });
        } catch (erro) {
            throw new Error(`Não foi possível desenhar ${p.cabeca.caminho}: ${erro.message}`, { cause: erro });
        }
        const destino = path.join(DIST, ...arquivo.split('/'));
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.writeFileSync(destino, montarPagina(modelo, { cabeca: p.cabeca, html, dadosIniciais: p.dados ?? null }));
    }
    for (const { endereco, indice } of Object.values(indicesGravados)) {
        const destino = path.join(DIST, ...endereco.split('/').filter(Boolean));
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.writeFileSync(destino, JSON.stringify(indice));
    }

    const noSitemap = paginas.filter((p) => indexavel(p.pagina));
    fs.writeFileSync(path.join(DIST, 'sitemap.xml'), gerarSitemap(noSitemap.map((p) => ({
        url: p.cabeca.url, lastmod: p.lastmod ?? null, alternativos: p.cabeca.alternativos,
    }))));
    fs.writeFileSync(path.join(DIST, 'robots.txt'), gerarRobots());
    fs.writeFileSync(path.join(DIST, 'llms.txt'), gerarLlms({ tradutor, indices: ajuda?.indices ?? {} }));

    const porTipo = {};
    for (const p of paginas) porTipo[p.pagina.tipo] = (porTipo[p.pagina.tipo] ?? 0) + 1;
    console.log(`Páginas prontas: ${paginas.length} (${Object.entries(porTipo).map(([k, v]) => `${k} ${v}`).join(', ')}).`);
    console.log(`sitemap.xml: ${noSitemap.length} endereço(s); robots.txt e llms.txt gravados.`);

    // Conferência de tudo o que foi gravado: título, descrição, canonical, hreflang recíproco, dados estruturados,
    // texto visível, sitemap, robots.txt e llms.txt. Qualquer problema para o build.
    const conferencia = conferirDist(DIST);
    if (conferencia.problemas.length) {
        for (const problema of conferencia.problemas.slice(0, 50)) console.error(`  ${problema}`);
        throw new Error(`${conferencia.problemas.length} problema(s) nas páginas prontas (lista acima)`);
    }
    console.log(`Conferência: ${conferencia.paginas} página(s) pronta(s) sem problema.`);
}

principal().catch((erro) => {
    console.error(`\nERRO nas páginas prontas: ${erro.message}`);
    if (erro.cause?.stack) console.error(erro.cause.stack);
    process.exit(1);
});
