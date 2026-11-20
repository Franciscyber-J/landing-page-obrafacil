// O que o Google e os buscadores com IA leem do site da ExpertBR: cabeça de cada página (título, descrição,
// canonical, hreflang, Open Graph), dados estruturados (schema.org), sitemap.xml, robots.txt e llms.txt.
// Tudo sai dos mesmos textos e dados da página (src/textos, src/produtos.js). Nada inventado: a empresa ainda não
// existe formalmente, então os dados estruturados não têm CNPJ, razão social, endereço, telefone, data de fundação,
// número de pessoas nem nota de avaliação; o app que ainda não foi lançado (Orbit) não entra neles.
// Sem React e sem navegador (o build e os testes usam no Node). t: tradutor do idioma (src/i18n.js).

import { escaparHtml, jsonNoHtml } from '../../../src/seo/cabeca.js';
import { ROBOS, gerarSitemap } from '../../../src/seo/sitemap.js';
import { caminhoAjuda } from '../../../src/i18n/idiomas.js';
import { EMAIL_SUPORTE } from '../../../src/links.js';
import { IDIOMAS, INTERNACIONAL, NOME, REFERENCIA, SITE, absoluto, caminhoInicio, idioma } from './idiomas.js';
import { NO_AR, PRODUTOS, paginaDoProduto } from './produtos.js';
import { lista } from './i18n.js';

export { escaparHtml };

// Imagens da marca (geradas por ferramentas/imagens.mjs; ver LEIAME.md, "Imagens").
export const IMAGEM = { caminho: '/og.png', largura: 1200, altura: 630 };
export const LOGO = { caminho: '/logo.png', largura: 1200, altura: 300 };

const ORGANIZACAO = `${SITE}/#organizacao`;
const SITE_ID = `${SITE}/#site`;
const localeOg = (codigo) => codigo.replace('-', '_');
const limpo = (texto) => String(texto ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

// Versões da página em cada idioma, mais a x-default: a raiz "/", que leva cada pessoa ao idioma dela.
export function alternativos() {
    return [
        ...IDIOMAS.map((i) => ({ hreflang: i.codigo, href: absoluto(caminhoInicio(i.codigo)) })),
        { hreflang: 'x-default', href: absoluto('/') },
    ];
}

function organizacao(t) {
    return {
        '@type': 'Organization',
        '@id': ORGANIZACAO,
        name: NOME,
        url: `${SITE}/`,
        description: t('seo.organizacao'),
        logo: { '@type': 'ImageObject', url: absoluto(LOGO.caminho), width: LOGO.largura, height: LOGO.altura },
        email: EMAIL_SUPORTE,
        contactPoint: [{
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: EMAIL_SUPORTE,
            availableLanguage: IDIOMAS.map((i) => i.codigo),
        }],
    };
}

function aplicativo(t, codigo, produto) {
    const app = {
        '@type': 'SoftwareApplication',
        '@id': `${SITE}/#app-${produto.id}`,
        name: produto.nome,
        description: t(produto.seo.descricao),
        applicationCategory: produto.seo.categoria,
        operatingSystem: produto.seo.sistemas,
        url: paginaDoProduto(produto, codigo),
        inLanguage: codigo,
        featureList: lista(t, produto.textos.destaques),
        publisher: { '@id': ORGANIZACAO },
    };
    if (produto.seo.subcategoria) app.applicationSubCategory = t(produto.seo.subcategoria);
    const baixar = (produto.lojas ?? []).map((l) => l.url(codigo));
    if (baixar.length) app.downloadUrl = baixar;
    return app;
}

export function dadosEstruturados(t, codigo, { url, titulo, descricao }) {
    const apps = NO_AR.map((p) => aplicativo(t, codigo, p));
    return {
        '@context': 'https://schema.org',
        '@graph': [
            organizacao(t),
            { '@type': 'WebSite', '@id': SITE_ID, url: `${SITE}/`, name: NOME, inLanguage: IDIOMAS.map((i) => i.codigo), publisher: { '@id': ORGANIZACAO } },
            {
                '@type': 'WebPage',
                '@id': `${url}#pagina`,
                url,
                name: titulo,
                description: descricao,
                inLanguage: codigo,
                isPartOf: { '@id': SITE_ID },
                about: { '@id': ORGANIZACAO },
                mentions: apps.map((a) => ({ '@id': a['@id'] })),
            },
            ...apps,
        ],
    };
}

// Tudo o que a cabeça da página do idioma precisa, em dados (os testes conferem daqui).
export function cabecaDaPagina(t, codigo) {
    const caminho = caminhoInicio(codigo);
    const url = absoluto(caminho);
    const titulo = t('seo.titulo');
    const descricao = t('seo.descricao');
    return {
        codigo,
        direcao: idioma(codigo).direcao,
        caminho,
        url,
        titulo,
        descricao,
        alternativos: alternativos(),
        imagemAlt: t('seo.imagemAlt'),
        jsonld: dadosEstruturados(t, codigo, { url, titulo, descricao }),
    };
}

export function etiquetasDaCabeca(c) {
    const e = escaparHtml;
    const linhas = [`<link rel="canonical" href="${e(c.url)}" />`];
    for (const a of c.alternativos) linhas.push(`<link rel="alternate" hreflang="${e(a.hreflang)}" href="${e(a.href)}" />`);
    const og = [
        ['og:type', 'website'],
        ['og:site_name', NOME],
        ['og:title', c.titulo],
        ['og:description', c.descricao],
        ['og:url', c.url],
        ['og:locale', localeOg(c.codigo)],
        ...IDIOMAS.filter((i) => i.codigo !== c.codigo).map((i) => ['og:locale:alternate', localeOg(i.codigo)]),
        ['og:image', absoluto(IMAGEM.caminho)],
        ['og:image:width', String(IMAGEM.largura)],
        ['og:image:height', String(IMAGEM.altura)],
        ['og:image:alt', c.imagemAlt],
    ];
    for (const [nome, valor] of og) linhas.push(`<meta property="${nome}" content="${e(valor)}" />`);
    for (const [nome, valor] of [
        ['twitter:card', 'summary_large_image'],
        ['twitter:title', c.titulo],
        ['twitter:description', c.descricao],
        ['twitter:image', absoluto(IMAGEM.caminho)],
        ['twitter:image:alt', c.imagemAlt],
    ]) linhas.push(`<meta name="${nome}" content="${e(valor)}" />`);
    linhas.push(`<script type="application/ld+json">${jsonNoHtml(c.jsonld)}</script>`);
    return linhas;
}

// Uma entrada por idioma, cada uma com as 29 versões (hreflang). São poucas páginas: um sitemap só.
export function sitemap(lastmod) {
    return gerarSitemap(IDIOMAS.map((i) => ({ url: absoluto(caminhoInicio(i.codigo)), lastmod, alternativos: alternativos() })));
}

// Todos os robôs de busca e de IA podem ler tudo (o site é todo público e não tem página fora do Google).
export function robots() {
    const linhas = [`# ${SITE}`, '# Gerado no build (sites/expertbr/ferramentas/gerar.mjs). Todo o site pode ser lido e citado.', ''];
    for (const robo of ROBOS) linhas.push(`User-agent: ${robo}`, 'Allow: /', '');
    linhas.push('User-agent: *', 'Allow: /', '', `Sitemap: ${absoluto('/sitemap.xml')}`, '');
    return linhas.join('\n');
}

function secaoDoIdioma(t, codigo) {
    const s = [];
    const titulo = (texto) => s.push('', `## ${limpo(texto)}`, '');
    titulo(`${t('seo.llms.sobre')} (${idioma(codigo).nome})`);
    for (const p of lista(t, 'sobre.paragrafos')) s.push(limpo(p), '');
    s.push(`- ${absoluto(caminhoInicio(codigo))}`);
    titulo(t('seo.llms.aplicativos'));
    for (const p of PRODUTOS) {
        const pagina = paginaDoProduto(p, codigo);
        const nome = pagina ? `[${p.nome}](${pagina})` : `${p.nome} (${limpo(t('seo.llms.emBreve'))})`;
        s.push(`- **${nome}**: ${limpo(t(p.textos.linha))} ${limpo(t(p.textos.descricao))}`);
        if (p.estado === 'no-ar') {
            s.push(`  - ${lista(t, p.textos.destaques).map(limpo).join('; ')}`);
            if (p.textos.plataformas) s.push(`  - ${limpo(t(p.textos.plataformas))}`);
            for (const l of p.lojas ?? []) s.push(`  - ${l.rotulo.includes('.') ? limpo(t(l.rotulo)) : l.rotulo}: ${l.url(codigo)}`);
        }
    }
    titulo(t('seo.llms.contato'));
    s.push(`- ${limpo(t('contato.email'))}: ${EMAIL_SUPORTE}`);
    s.push(`- ${limpo(t('obrafacil:footer.help'))} (ObraFácil): https://appobrafacil.expertbr.com${caminhoAjuda(codigo)}`);
    return s;
}

// llms.txt (https://llmstxt.org): inglês primeiro (o idioma internacional) e depois português (o de referência).
export function llms(tradutor) {
    const en = tradutor(INTERNACIONAL);
    const linhas = [`# ${NOME}`, '', `> ${limpo(en('seo.organizacao'))}`, '', `${limpo(en('seo.llms.idiomas'))}:`, ''];
    for (const i of IDIOMAS) linhas.push(`- [${i.nome}](${absoluto(caminhoInicio(i.codigo))})`);
    for (const codigo of [INTERNACIONAL, REFERENCIA]) linhas.push(...secaoDoIdioma(tradutor(codigo), codigo));
    linhas.push('');
    return linhas.join('\n');
}
