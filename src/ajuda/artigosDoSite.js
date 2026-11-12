// Artigos da Central que as páginas do site apontam pelo id (Perfil, volta do pagamento e Suporte).
//
// O endereço de um artigo tem o nome dele no idioma (/fr-fr/aide/annuler-l-abonnement), e esse nome só existe na
// Central publicada. O build das páginas prontas (ferramentas/paginas/gerar.mjs) lê a Central e entrega a cada uma
// dessas páginas o endereço certo de cada artigo no idioma dela: o link já sai no HTML com o endereço final, sem
// passar por /fr-fr/aide/cancelar-assinatura (endereço pelo id, que o Google lia como cópia ou página vazia).
// O build para se um destes artigos não estiver publicado em algum idioma.
// Sem React e sem navegador: o build e os testes usam.

import { caminhoArtigo } from '../i18n/idiomas.js';
import { dadosIniciais } from '../dadosIniciais.js';
import { idiomaDoConteudo } from './idiomas.js';

// Todo id usado em caminhoDoArtigoDoSite(codigo, id) tem de estar aqui (src/ajuda/ajuda.test.js confere).
export const ARTIGOS_DO_SITE = [
    'abrir-chamado',
    'acesso-cliente',
    'ativar-pro-do-site',
    'cancelar-assinatura',
    'cartao-do-plano',
    'contratar-armazenamento',
    'downloads-extras',
    'pagamentos-e-reembolso',
];

// O que a página pronta recebe do build: { idioma: <idioma dos artigos>, slugs: { <id>: <slug> } }.
// faltando: ids que não estão no índice daquele idioma (o build para com eles).
export function enderecosDosArtigosDoSite(indice, idioma) {
    const porId = new Map((indice?.artigos ?? []).map((a) => [a.id, a.slug]));
    const slugs = {};
    const faltando = [];
    for (const id of ARTIGOS_DO_SITE) {
        const slug = porId.get(id);
        if (slug) slugs[id] = slug;
        else faltando.push(id);
    }
    return { enderecos: { idioma, slugs }, faltando };
}

// Endereço do artigo no idioma da página. Na página pronta (e enquanto a pessoa navega no mesmo idioma), o endereço
// final; fora disso (página desenhada no navegador sem os dados do build, ou depois de trocar de idioma), o endereço
// pelo id, que a Central troca sozinha pelo certo.
export function caminhoDoArtigoDoSite(codigo, id) {
    if (!ARTIGOS_DO_SITE.includes(id)) throw new Error(`Artigo fora da lista ARTIGOS_DO_SITE: ${id}`);
    const enderecos = dadosIniciais()?.ajuda?.enderecos;
    const slug = enderecos && enderecos.idioma === idiomaDoConteudo(codigo) ? enderecos.slugs?.[id] : null;
    return caminhoArtigo(codigo, typeof slug === 'string' && slug ? slug : id);
}
