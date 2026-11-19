// Formato da Central de Ajuda no Firestore que o site lê: um documento por idioma (ajuda-por-idioma, 26/10/2026),
// gravado pelo publicador do gestao_obras (ferramentas/ajuda/src/publicacao.mjs):
//
//   ajuda_idiomas/{idioma}                          cabeçalho (~0,3 KB): hash e versão do índice do idioma e a lista
//                                                   das partes do índice (partes_do_indice)
//   ajuda_idiomas/{idioma}/partes/indice-<hash>-<n> o índice completo (busca, assuntos, artigos) em partes, na ordem
//                                                   da lista do cabeçalho (ajuda-indice-em-partes, 19/11/2026)
//   ajuda_idiomas/{idioma}/partes/indice            o índice completo num documento só, como antes; o publicador ainda
//                                                   grava enquanto couber (o site lê se o cabeçalho não listar partes)
//   ajuda_idiomas/{idioma}/artigos/{id}             o artigo só neste idioma, com o endereço (slug) dele em todos os
//                                                   idiomas
//
// Por que em partes: o índice inteiro do tailandês e do hindi chegou perto do limite de tamanho de um documento do
// Firestore (a busca leva o texto dos passos). As partes, juntas (juntarPartesDoIndice), são exatamente o índice
// inteiro de antes: o resto do site não muda.
//
// O site lê só o idioma da página. Puro (sem navegador): usado pelo site (dados.js) e pelas páginas prontas do
// build (ferramentas/paginas/fontes.mjs).

export const COLECAO_IDIOMAS = 'ajuda_idiomas';

export const caminhoDoCabecalho = (idioma) => `${COLECAO_IDIOMAS}/${idioma}`;
export const caminhoDoIndice = (idioma) => `${COLECAO_IDIOMAS}/${idioma}/partes/indice`;
export const caminhoDaParte = (idioma, nome) => `${COLECAO_IDIOMAS}/${idioma}/partes/${nome}`;
export const caminhoDosArtigos = (idioma) => `${COLECAO_IDIOMAS}/${idioma}/artigos`;
export const caminhoDoArtigo = (idioma, id) => `${caminhoDosArtigos(idioma)}/${id}`;

// O mínimo para a tela não quebrar com um documento estranho.
export function indiceValido(doc, idioma) {
    return Boolean(doc) && doc.idioma === idioma && Array.isArray(doc.artigos) && Array.isArray(doc.modulos);
}

// ---------- Índice em partes ----------

// O nome que o publicador dá a cada parte: indice-<16 letras do hash do índice>-<número>.
export const NOME_DA_PARTE = /^indice-[0-9a-f]{16}-[1-9][0-9]{0,3}$/;
const MAXIMO_DE_PARTES = 64;

// Os nomes das partes que o cabeçalho lista, ou null se ele não listar (publicado antes) ou vier fora do formato.
export function partesDoIndiceDoCabecalho(cabecalho) {
    const lista = cabecalho?.partes_do_indice;
    if (!Array.isArray(lista) || !lista.length || lista.length > MAXIMO_DE_PARTES) return null;
    if (!lista.every((n) => typeof n === 'string' && NOME_DA_PARTE.test(n))) return null;
    return lista;
}

// O índice de volta a partir do cabeçalho e das partes (na ordem da lista; null = não existe): o mesmo documento do
// índice inteiro, com a versão do cabeçalho. null se alguma parte faltar, for de outro índice (outra publicação) ou
// estiver fora de ordem. A mesma conta do publicador (gestao_obras, ferramentas/ajuda/src/publicacao.mjs).
export function juntarPartesDoIndice(cabecalho, partes) {
    const nomes = partesDoIndiceDoCabecalho(cabecalho);
    if (!nomes || typeof cabecalho.hash !== 'string' || !cabecalho.hash) return null;
    if (!Array.isArray(partes) || partes.length !== nomes.length) return null;
    const artigos = [];
    for (let k = 0; k < nomes.length; k++) {
        const p = partes[k];
        if (!p || p.idioma !== cabecalho.idioma || p.hash_indice !== cabecalho.hash || p.parte !== k + 1
            || p.partes !== nomes.length || !Array.isArray(p.artigos)) return null;
        artigos.push(...p.artigos);
    }
    if (!Array.isArray(partes[0].modulos)) return null;
    return {
        formato: 2,
        idioma: cabecalho.idioma,
        total: partes[0].total,
        modulos: partes[0].modulos,
        artigos,
        hash: cabecalho.hash,
        ...(cabecalho.versao !== undefined ? { versao: cabecalho.versao } : {}),
    };
}

// Lê o índice publicado de um idioma: as partes que o cabeçalho lista ou, se ele não listar, o índice inteiro.
// [lerDocumento(caminho)]: os dados do documento, ou null se não existir. [cabecalho]: o já lido.
// Se as partes não baterem com o cabeçalho (a publicação acabou de trocá-las), lê o cabeçalho de novo uma vez; sem
// acerto, fica com o índice inteiro. Devolve { indice (null = nada), caminhos: os documentos de onde ele veio }.
export async function lerIndicePublicado(idioma, lerDocumento, cabecalho) {
    let cab = cabecalho;
    for (let tentativa = 0; tentativa < 2; tentativa++) {
        const nomes = partesDoIndiceDoCabecalho(cab);
        if (!nomes) break;
        const caminhos = nomes.map((n) => caminhoDaParte(idioma, n));
        const indice = juntarPartesDoIndice(cab, await Promise.all(caminhos.map(lerDocumento)));
        if (indice) return { indice, caminhos };
        if (tentativa === 0) cab = await lerDocumento(caminhoDoCabecalho(idioma));
    }
    return { indice: await lerDocumento(caminhoDoIndice(idioma)), caminhos: [caminhoDoIndice(idioma)] };
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
