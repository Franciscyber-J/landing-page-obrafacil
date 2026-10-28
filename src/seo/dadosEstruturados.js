// Dados estruturados (JSON-LD, schema.org) das páginas prontas: dizem ao Google e aos buscadores com IA, sem
// precisar interpretar o visual, o que é o ObraFácil, quem publica, quanto custa em cada país e onde a página
// fica no site. Tudo sai dos mesmos textos e preços que a página mostra (nada inventado: sem nota de avaliação).

import { idiomaDasTelas } from '../telas.js';
import { IDIOMAS, caminhoAjuda, caminhoInicio, caminhoSuporte } from '../i18n/idiomas.js';
import { precosDoIdioma } from '../i18n/pricing.js';
import { EMAIL_SUPORTE, WINDOWS, appStore, googlePlay } from '../links.js';
import { NOME, SITE, absoluto, caminhoDaPagina } from './paginas.js';

const ORGANIZACAO = `${SITE}/#organizacao`;
const SITE_ID = `${SITE}/#site`;
export const IMAGEM = { caminho: '/logo.png', largura: 1298, altura: 708 };
const RECURSOS = ['cronograma', 'diario', 'financeiro', 'equipe', 'compras', 'marca', 'offline', 'aparelhos'];
const PERGUNTAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
        featureList: RECURSOS.map((id) => t(`recursos.itens.${id}.titulo`)),
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

// Tudo o que vai no <script type="application/ld+json"> da página, num único @graph.
// dados: { modulo } (assunto), { modulo, entrada } (artigo).
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
    } else {
        grafo.push(base);
    }
    return { '@context': 'https://schema.org', '@graph': grafo };
}
