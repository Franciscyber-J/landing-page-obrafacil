// Formato da Central de Ajuda no Firestore que o site lê: um documento por idioma (ajuda-por-idioma, 26/10/2026),
// gravado pelo publicador do gestao_obras (ferramentas/ajuda/src/publicacao.mjs):
//
//   ajuda_idiomas/{idioma}                  cabeçalho (~0,3 KB): hash e versão do índice do idioma
//   ajuda_idiomas/{idioma}/partes/indice    índice completo (busca, assuntos, artigos), igual ao ajuda_indices antigo
//   ajuda_idiomas/{idioma}/artigos/{id}     o artigo só neste idioma, com o endereço (slug) dele em todos os idiomas
//
// O site lê só o idioma da página. Puro (sem navegador): usado pelo site (dados.js) e pelas páginas prontas do
// build (ferramentas/paginas/fontes.mjs).

export const COLECAO_IDIOMAS = 'ajuda_idiomas';

export const caminhoDoCabecalho = (idioma) => `${COLECAO_IDIOMAS}/${idioma}`;
export const caminhoDoIndice = (idioma) => `${COLECAO_IDIOMAS}/${idioma}/partes/indice`;
export const caminhoDosArtigos = (idioma) => `${COLECAO_IDIOMAS}/${idioma}/artigos`;
export const caminhoDoArtigo = (idioma, id) => `${caminhoDosArtigos(idioma)}/${id}`;

// O mínimo para a tela não quebrar com um documento estranho.
export function indiceValido(doc, idioma) {
    return Boolean(doc) && doc.idioma === idioma && Array.isArray(doc.artigos) && Array.isArray(doc.modulos);
}

// Documento ajuda_idiomas/{idioma}/artigos/{id}.
export function artigoDoIdiomaValido(doc, id, idioma) {
    return Boolean(doc) && doc.id === id && doc.idioma === idioma
        && Boolean(doc.conteudo) && typeof doc.conteudo === 'object' && !Array.isArray(doc.conteudo);
}

// Artigo no formato das páginas (o mesmo do build e do site de antes): o conteúdo inteiro (com os passos) no idioma
// da página; nos outros idiomas ele só traz o endereço.
export function artigoDaPaginaValido(doc, id, idioma) {
    return Boolean(doc) && doc.id === id && Array.isArray(doc.conteudo?.[idioma]?.passos);
}

// Campos que só existem no documento do idioma.
const SO_DO_DOCUMENTO = new Set(['formato', 'idioma', 'conteudo', 'slugs', 'busca', 'hash_documento', 'publicado_em']);

// Do documento do idioma para o formato das páginas: "conteudo" com o texto inteiro no idioma do artigo e só o
// endereço (slug) nos outros idiomas, para o menu de idiomas, o hreflang e "Em outros idiomas".
export function artigoParaPagina(doc) {
    const resto = Object.fromEntries(Object.entries(doc).filter(([chave]) => !SO_DO_DOCUMENTO.has(chave)));
    const conteudo = {};
    for (const [idioma, slug] of Object.entries(doc.slugs ?? {})) {
        if (typeof slug === 'string' && slug) conteudo[idioma] = { slug };
    }
    conteudo[doc.idioma] = doc.conteudo;
    return { ...resto, conteudo };
}
