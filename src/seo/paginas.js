// As páginas do site como o Google as vê: endereço certo (canonical) de cada uma e o endereço dela nos outros
// idiomas (hreflang). Sem React e sem navegador: o build (páginas prontas, sitemap, llms.txt) e os testes usam.
//
// Uma página é descrita por { tipo, codigo, ... }:
//   inicio | ajuda | suporte | perfil
//   legal      + documento ('termos' | 'privacidade')
//   pagamento  + compra (null = texto geral)
//   assunto    + modulo (o módulo do índice da Central, com "nomes" em todos os idiomas)
//   artigo     + artigo ({ id, slugs: { <idioma dos artigos>: slug } })

import {
    IDIOMAS, INTERNACIONAL, caminhoAjuda, caminhoArtigo, caminhoAssunto, caminhoInicio, caminhoLegal,
    caminhoPagamento, caminhoPerfil, caminhoSuporte,
} from '../i18n/idiomas.js';
import { idiomaDoConteudo } from '../ajuda/idiomas.js';
import { slugDoModulo } from '../ajuda/enderecos.js';

// Endereço do site no ar. Os endereços do Google (canonical, hreflang, sitemap) são sempre absolutos.
export const SITE = 'https://appobrafacil.expertbr.com';
export const NOME = 'ObraFácil';

export function absoluto(caminho) {
    return new URL(caminho, SITE).href;
}

// Páginas que não vão para o Google: a volta do pagamento e o Perfil (servem a quem já é cliente).
const SEM_INDEXAR = new Set(['perfil', 'pagamento']);

export function indexavel(pagina) {
    return !SEM_INDEXAR.has(pagina.tipo);
}

// Endereço da página no idioma pedido (null se ela não existir nesse idioma).
export function caminhoDaPagina(pagina, codigo = pagina.codigo) {
    switch (pagina.tipo) {
        case 'inicio': return caminhoInicio(codigo);
        case 'ajuda': return caminhoAjuda(codigo);
        case 'suporte': return caminhoSuporte(codigo);
        case 'perfil': return caminhoPerfil(codigo);
        case 'legal': return caminhoLegal(codigo, pagina.documento);
        case 'pagamento': return caminhoPagamento(codigo, pagina.compra ?? null);
        case 'assunto': return caminhoAssunto(codigo, slugDoModulo(pagina.modulo, idiomaDoConteudo(codigo)));
        case 'artigo': {
            const slug = pagina.artigo.slugs?.[idiomaDoConteudo(codigo)];
            return slug ? caminhoArtigo(codigo, slug) : null;
        }
        default: throw new Error(`Tipo de página desconhecido: ${pagina.tipo}`);
    }
}

// Versões da página em cada idioma, mais a x-default: a raiz "/" na página inicial (ela leva cada pessoa ao
// idioma dela) e a versão em inglês (internacional) nas outras. Mesma regra de src/i18n/RotaDoIdioma.jsx.
export function alternativosDaPagina(pagina) {
    const lista = [];
    for (const i of IDIOMAS) {
        const caminho = caminhoDaPagina(pagina, i.codigo);
        if (caminho) lista.push({ hreflang: i.codigo, href: absoluto(caminho) });
    }
    const padrao = pagina.tipo === 'inicio' ? '/' : caminhoDaPagina(pagina, INTERNACIONAL);
    if (padrao) lista.push({ hreflang: 'x-default', href: absoluto(padrao) });
    return lista;
}

// Arquivo da página pronta dentro de dist/: endereço terminado em "/" vira <pasta>/index.html; os outros,
// <endereço>.html (o .htaccess entrega /pt-br/ajuda a partir de pt-br/ajuda.html, sem barra no fim).
export function arquivoDaPagina(caminho) {
    const partes = caminho.split('/').filter(Boolean);
    if (caminho.endsWith('/')) return [...partes, 'index.html'].join('/');
    const nome = partes.pop();
    return [...partes, `${nome}.html`].join('/');
}
