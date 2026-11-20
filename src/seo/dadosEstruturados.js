// Dados estruturados (JSON-LD, schema.org) das páginas prontas: dizem ao Google e aos buscadores com IA, sem
// precisar interpretar o visual, o que é o ObraFácil, quem publica, quanto custa em cada país e onde a página
// fica no site. Tudo sai dos mesmos textos e preços que a página mostra (nada inventado: sem nota de avaliação).

import { idiomaDasTelas } from '../telas.js';
import { PERGUNTAS, RECURSOS } from '../inicio.js';
import { IDIOMAS, caminhoAjuda, caminhoInicio, caminhoSuporte } from '../i18n/idiomas.js';
import { precosDoIdioma } from '../i18n/pricing.js';
import { EMAIL_SUPORTE, WINDOWS, appStore, googlePlay } from '../links.js';
import { NOME, SITE, absoluto, caminhoDaPagina } from './paginas.js';
import { caminhoDoPdf } from '../modelos/modelos.js';

const ORGANIZACAO = `${SITE}/#organizacao`;
const SITE_ID = `${SITE}/#site`;
export const IMAGEM = { caminho: '/logo.png', largura: 1298, altura: 708 };

function organizacao(codigo) {
    return {
        '@type': 'Organization',
        '@id': ORGANIZACAO,
        name: NOME,
        url: `${SITE}/`,
        logo: { '@type': 'ImageObject', url: absoluto(IMAGEM.caminho), width: IMAGEM.largura, height: IMAGEM.altura },
        email: EMAIL_SUPORTE,
        contactPoint: [{
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: EMAIL_SUPORTE,
            url: absoluto(caminhoSuporte(codigo)),
            availableLanguage: IDIOMAS.map((i) => i.codigo),
        }],
    };
}

function site() {
    return {
        '@type': 'WebSite',
        '@id': SITE_ID,
        url: `${SITE}/`,
        name: NOME,
        inLanguage: IDIOMAS.map((i) => i.codigo),
        publisher: { '@id': ORGANIZACAO },
    };
}

function pagina(tipo, { url, titulo, descricao, codigo }) {
    return {
        '@type': tipo,
        '@id': `${url}#pagina`,
        url,
        name: titulo,
        description: descricao,
        inLanguage: codigo,
        isPartOf: { '@id': SITE_ID },
    };
}

// Preço como o Google pede: número com ponto e moeda ISO 4217; a duração da cobrança em ISO 8601.
function oferta(nome, preco, moeda, url, duracao) {
    const base = { '@type': 'Offer', name: nome, price: preco, priceCurrency: moeda, url };
    if (!duracao) return base;
    return {
        ...base,
        category: 'subscription',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: preco, priceCurrency: moeda, billingDuration: duracao },
    };
}

function aplicativo(t, codigo) {
    const precos = precosDoIdioma(codigo);
    const urlPrecos = absoluto(caminhoInicio(codigo, 'precos'));
    return {
        '@type': ['SoftwareApplication', 'MobileApplication'],
        '@id': `${absoluto(caminhoInicio(codigo))}#app`,
        name: NOME,
        description: t('seo.app.descricao'),
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: t('seo.app.categoria'),
        operatingSystem: 'Android, iOS, Windows, Web',
        url: absoluto(caminhoInicio(codigo)),
        inLanguage: codigo,
        image: absoluto(IMAGEM.caminho),
        screenshot: ['etapas', 'rdo', 'financeiro', 'portal'].map((tela) => absoluto(`/telas/${idiomaDasTelas(codigo)}/${tela}.webp`)),
        downloadUrl: [googlePlay(codigo), appStore(), WINDOWS],
        featureList: RECURSOS.map(({ id }) => t(`recursos.itens.${id}.titulo`)),
        offers: [
            oferta(t('pricing.gratis.nome'), '0', precos.moeda, urlPrecos, null),
            oferta(t('pricing.pro.nomeMensal'), precos.mensal, precos.moeda, urlPrecos, 'P1M'),
            oferta(t('pricing.pro.nomeAnual'), precos.anual, precos.moeda, urlPrecos, 'P1Y'),
        ],
        publisher: { '@id': ORGANIZACAO },
    };
}

function perguntas(t, base) {
    return {
        ...base,
        '@type': 'FAQPage',
        mainEntity: PERGUNTAS.map((n) => ({
            '@type': 'Question',
            name: t(`faq.q${n}`),
            acceptedAnswer: { '@type': 'Answer', text: t(`faq.a${n}`) },
        })),
    };
}

// Trilha "Central de Ajuda › Assunto › Artigo" (itens: [{ nome, url }], o último é a própria página).
function trilha(url, itens) {
    return {
        '@type': 'BreadcrumbList',
        '@id': `${url}#trilha`,
        itemListElement: itens.map((item, n) => ({ '@type': 'ListItem', position: n + 1, name: item.nome, item: item.url })),
    };
}

// Modelos grátis. Página com todos: coleção com a lista dos modelos (dados.lista: [{ nome, url }]). Página de um
// modelo: o passo a passo de uso no papel (HowTo, com os mesmos passos da página), os itens do checklist (ItemList,
// o texto do app) e o PDF da página (MediaObject). Nada de nota, número de downloads ou avaliação.
function modelos(t, { url, codigo, base, dados }) {
    const inicio = { nome: NOME, url: absoluto(caminhoInicio(codigo)) };
    return [
        { ...base, '@type': 'CollectionPage', breadcrumb: { '@id': `${url}#trilha` }, mainEntity: { '@id': `${url}#lista` } },
        trilha(url, [inicio, { nome: t('modelos.nav'), url }]),
        {
            '@type': 'ItemList',
            '@id': `${url}#lista`,
            name: t('modelos.indice.metaTitulo'),
            numberOfItems: dados.lista.length,
            itemListElement: dados.lista.map((m, n) => ({ '@type': 'ListItem', position: n + 1, name: m.nome, url: m.url })),
        },
    ];
}

function modelo(t, { url, descricao, codigo, base, dados }) {
    const diario = dados.modelo.tipo === 'diario';
    const inicio = { nome: NOME, url: absoluto(caminhoInicio(codigo)) };
    const lista = absoluto(caminhoDaPagina({ tipo: 'modelos', codigo }));
    const passos = t(`modelos.usar.${diario ? 'diario' : 'checklist'}`, { returnObjects: true });
    const pdf = {
        '@type': 'MediaObject',
        '@id': `${url}#pdf`,
        name: dados.nome,
        contentUrl: absoluto(caminhoDoPdf(codigo, dados.modelo.slug)),
        encodingFormat: 'application/pdf',
        inLanguage: codigo,
        isAccessibleForFree: true,
    };
    const grafo = [
        { ...base, breadcrumb: { '@id': `${url}#trilha` }, mainEntity: { '@id': `${url}#comoUsar` }, associatedMedia: { '@id': `${url}#pdf` } },
        trilha(url, [inicio, { nome: t('modelos.nav'), url: lista }, { nome: dados.nome, url }]),
        {
            '@type': 'HowTo',
            '@id': `${url}#comoUsar`,
            name: `${t('modelos.usar.titulo')}: ${dados.nome}`,
            description: descricao,
            inLanguage: codigo,
            step: (Array.isArray(passos) ? passos : []).map((texto, n) => ({ '@type': 'HowToStep', position: n + 1, text: texto })),
        },
        pdf,
    ];
    if (!diario) {
        grafo.push({
            '@type': 'ItemList',
            '@id': `${url}#itens`,
            name: `${dados.modelo.nome}: ${t('modelos.checklist.itensTitulo')}`,
            numberOfItems: dados.modelo.itens.length,
            itemListElement: dados.modelo.itens.map((item, n) => ({ '@type': 'ListItem', position: n + 1, name: item.texto })),
        });
    }
    return grafo;
}

// Tudo o que vai no <script type="application/ld+json"> da página, num único @graph.
// dados: { modulo } (assunto), { modulo, entrada } (artigo), { lista } (modelos), { modelo, nome } (modelo).
export function dadosEstruturados({ t, pagina: p, url, titulo, descricao, dados = {} }) {
    const codigo = p.codigo;
    const grafo = [organizacao(codigo), site()];
    const base = pagina('WebPage', { url, titulo, descricao, codigo });
    if (p.tipo === 'inicio') {
        grafo.push(aplicativo(t, codigo), { ...perguntas(t, base), about: { '@id': `${url}#app` } });
    } else if (p.tipo === 'assunto' || p.tipo === 'artigo') {
        const itens = [{ nome: t('ajuda.titulo'), url: absoluto(caminhoAjuda(codigo)) }];
        if (p.tipo === 'artigo' && dados.modulo) {
            itens.push({ nome: dados.modulo.nome, url: absoluto(caminhoDaPagina({ tipo: 'assunto', codigo, modulo: dados.modulo })) });
        }
        itens.push({ nome: p.tipo === 'artigo' ? dados.entrada.titulo : dados.modulo.nome, url });
        grafo.push({ ...base, breadcrumb: { '@id': `${url}#trilha` } }, trilha(url, itens));
    } else if (p.tipo === 'modelos') {
        grafo.push(...modelos(t, { url, codigo, base, dados }));
    } else if (p.tipo === 'modelo') {
        grafo.push(...modelo(t, { url, descricao, codigo, base, dados }));
    } else {
        grafo.push(base);
    }
    return { '@context': 'https://schema.org', '@graph': grafo };
}
