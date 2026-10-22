// Cabeça (<head>) das páginas prontas do build: título, descrição, canonical, hreflang, robots, Open Graph
// (prévia do link no WhatsApp, Facebook, LinkedIn), Twitter e os dados estruturados.
// Cada etiqueta leva data-build: o site, ao abrir, mantém estas etiquetas na primeira página e só as troca
// quando a pessoa navega para outra (src/i18n/RotaDoIdioma.jsx).

import { IDIOMAS, idioma } from '../i18n/idiomas.js';
import { IMAGEM, dadosEstruturados } from './dadosEstruturados.js';
import { NOME, absoluto, alternativosDaPagina, caminhoDaPagina, indexavel } from './paginas.js';
import { descricaoDaPagina, tituloDaPagina } from './textos.js';

export function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// JSON dentro de <script>: "<", ">" e "&" escapados para nunca fechar a etiqueta antes da hora.
export function jsonNoHtml(valor) {
    return JSON.stringify(valor).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

const localeOg = (codigo) => codigo.replace('-', '_');

// Tudo o que a cabeça da página precisa, em dados (os testes conferem daqui).
export function cabecaDaPagina({ t, pagina, dados = {} }) {
    const caminho = caminhoDaPagina(pagina);
    const url = absoluto(caminho);
    const titulo = tituloDaPagina(t, pagina, dados);
    const descricao = descricaoDaPagina(t, pagina, dados);
    return {
        codigo: pagina.codigo,
        direcao: idioma(pagina.codigo)?.direcao ?? 'ltr',
        caminho,
        url,
        titulo,
        descricao,
        indexavel: indexavel(pagina),
        alternativos: alternativosDaPagina(pagina),
        og: {
            tipo: pagina.tipo === 'artigo' ? 'article' : 'website',
            imagem: absoluto(IMAGEM.caminho),
            imagemAlt: t('seo.imagemAlt'),
        },
        jsonld: dadosEstruturados({ t, pagina, url, titulo, descricao, dados }),
    };
}

// As etiquetas que entram antes de </head> (título e descrição são trocados no próprio modelo).
export function etiquetasDaCabeca(c) {
    const e = escaparHtml;
    const linhas = [`<link rel="canonical" href="${e(c.url)}" data-idiomas data-build />`];
    for (const a of c.alternativos) {
        linhas.push(`<link rel="alternate" hreflang="${e(a.hreflang)}" href="${e(a.href)}" data-idiomas data-build />`);
    }
    if (!c.indexavel) linhas.push('<meta name="robots" content="noindex, follow" data-build />');
    const og = [
        ['og:type', c.og.tipo],
        ['og:site_name', NOME],
        ['og:title', c.titulo],
        ['og:description', c.descricao],
        ['og:url', c.url],
        ['og:locale', localeOg(c.codigo)],
        ...IDIOMAS.filter((i) => i.codigo !== c.codigo).map((i) => ['og:locale:alternate', localeOg(i.codigo)]),
        ['og:image', c.og.imagem],
        ['og:image:width', String(IMAGEM.largura)],
        ['og:image:height', String(IMAGEM.altura)],
        ['og:image:alt', c.og.imagemAlt],
    ];
    for (const [nome, valor] of og) linhas.push(`<meta property="${nome}" content="${e(valor)}" data-build />`);
    const twitter = [
        ['twitter:card', 'summary_large_image'],
        ['twitter:title', c.titulo],
        ['twitter:description', c.descricao],
        ['twitter:image', c.og.imagem],
        ['twitter:image:alt', c.og.imagemAlt],
    ];
    for (const [nome, valor] of twitter) linhas.push(`<meta name="${nome}" content="${e(valor)}" data-build />`);
    linhas.push(`<script type="application/ld+json" data-build>${jsonNoHtml(c.jsonld)}</script>`);
    return linhas;
}

// O React 19 começa o HTML da página com os <link rel="preload"> das imagens principais (a da primeira dobra).
// Eles vão para a cabeça: dentro do #root atrapalhariam a hidratação.
export function separarPreloads(html) {
    const m = /^(?:<link [^>]*rel="preload"[^>]*\/?>)+/.exec(html);
    if (!m) return { corpo: html, preloads: [] };
    return { corpo: html.slice(m[0].length), preloads: m[0].match(/<link [^>]*>/g) };
}

// Página pronta: o index.html do build com a cabeça desta página, o conteúdo desenhado pelo React dentro do
// #root (data-pronta: o site "hidrata" em vez de desenhar de novo) e os dados que o site precisa para isso.
export function montarPagina(modelo, { cabeca, html, dadosIniciais = null }) {
    const e = escaparHtml;
    const { corpo, preloads } = separarPreloads(html);
    let pagina = modelo;
    const trocar = (regra, novo, nome) => {
        if (!regra.test(pagina)) throw new Error(`Modelo do index.html sem ${nome}`);
        pagina = pagina.replace(regra, () => novo);
    };
    trocar(/<html lang="[^"]*"[^>]*>/, `<html lang="${e(cabeca.codigo)}" dir="${e(cabeca.direcao)}">`, '<html lang>');
    trocar(/<title>[^<]*<\/title>/, `<title>${e(cabeca.titulo)}</title>`, '<title>');
    trocar(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${e(cabeca.descricao)}" />`, 'a descrição');
    trocar(/<\/head>/, `  ${[...preloads, ...etiquetasDaCabeca(cabeca)].join('\n    ')}\n  </head>`, '</head>');
    const dados = dadosIniciais ? `<script type="application/json" id="dados-iniciais">${jsonNoHtml(dadosIniciais)}</script>` : '';
    trocar(/<div id="root"><\/div>/, `<div id="root" data-pronta>${corpo}</div>${dados}`, '<div id="root"></div>');
    return pagina;
}
