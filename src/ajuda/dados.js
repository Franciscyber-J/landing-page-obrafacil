// Leitura do conteúdo da Central de Ajuda.
//
// Produção: lê o Firestore pela API REST pública (as regras liberam só a leitura de
// ajuda_artigos e ajuda_indices). Sem SDK do Firebase e sem chave: o site só lê.
// Desenvolvimento: com AJUDA_SAIDA definido ao rodar "npm run dev", lê os documentos que o
// publicador gravou com --saida (ver vite.config.js), sem tocar no Firestore.
//
// Cache: o índice de cada idioma e cada artigo ficam guardados no navegador. O índice é
// mostrado na hora a partir do cache e conferido em segundo plano; o artigo só é baixado de
// novo quando o hash dele no índice muda.

import { ehIdiomaDaAjuda } from './idiomas.js';
import { lerMarcacao } from './marcacao.js';

export const PROJETO = 'gestao-obras-app-8342c';
export const BUCKET = 'gestao-obras-app-8342c.firebasestorage.app';
const BASE_FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents`;
const LOCAL = import.meta.env.DEV && import.meta.env.VITE_AJUDA_LOCAL === 'sim';
const PRINTS_LOCAIS = import.meta.env.DEV && import.meta.env.VITE_AJUDA_PRINTS_LOCAIS === 'sim';
const ID_ARTIGO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PREFIXO_CACHE = 'ajuda:v1:';

// ---------- Conversão do formato da API REST do Firestore ----------

export function lerValor(valor) {
    if (!valor || typeof valor !== 'object') return null;
    if ('stringValue' in valor) return valor.stringValue;
    if ('integerValue' in valor) return Number(valor.integerValue);
    if ('doubleValue' in valor) return Number(valor.doubleValue);
    if ('booleanValue' in valor) return Boolean(valor.booleanValue);
    if ('nullValue' in valor) return null;
    if ('timestampValue' in valor) return valor.timestampValue;
    if ('arrayValue' in valor) return (valor.arrayValue.values ?? []).map(lerValor);
    if ('mapValue' in valor) return lerCampos(valor.mapValue.fields ?? {});
    return null;
}

export function lerCampos(campos) {
    const saida = {};
    for (const [chave, valor] of Object.entries(campos ?? {})) saida[chave] = lerValor(valor);
    return saida;
}

// ---------- Cache no navegador (pode não existir: aba anônima, bloqueio etc.) ----------

function lerCache(chave) {
    try {
        const bruto = window.localStorage.getItem(PREFIXO_CACHE + chave);
        return bruto ? JSON.parse(bruto) : null;
    } catch {
        return null;
    }
}

function gravarCache(chave, valor) {
    try {
        window.localStorage.setItem(PREFIXO_CACHE + chave, JSON.stringify(valor));
    } catch {
        // Sem espaço ou sem permissão: segue sem cache.
    }
}

function apagarCache(chave) {
    try {
        window.localStorage.removeItem(PREFIXO_CACHE + chave);
    } catch {
        // nada a fazer
    }
}

// ---------- Busca de documentos ----------

class NaoPublicado extends Error {}

async function buscarDocumento(colecao, id) {
    const url = LOCAL
        ? `/__ajuda/${colecao}/${encodeURIComponent(id)}.json`
        : `${BASE_FIRESTORE}/${colecao}/${encodeURIComponent(id)}`;
    const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
    if (resposta.status === 404) throw new NaoPublicado(`${colecao}/${id}`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao ler ${colecao}/${id}`);
    const corpo = await resposta.json();
    return LOCAL ? corpo : lerCampos(corpo.fields);
}

// Confere o mínimo para a tela não quebrar com um documento estranho.
function indiceValido(doc, idioma) {
    return doc && doc.idioma === idioma && Array.isArray(doc.artigos) && Array.isArray(doc.modulos);
}

function artigoValido(doc, id) {
    return doc && doc.id === id && doc.conteudo && typeof doc.conteudo === 'object';
}

// ---------- Índice ----------

// Uma conferência por idioma por visita: navegar entre páginas não baixa o índice de novo.
const conferidos = new Map();

// Índice guardado no navegador, para mostrar na hora (null se não houver).
export function indiceGuardado(idioma) {
    if (!ehIdiomaDaAjuda(idioma)) return null;
    const guardado = lerCache(`indice:${idioma}`);
    return guardado && indiceValido(guardado, idioma) ? guardado : null;
}

// Confere o índice no servidor (uma vez por visita) e chama aoAtualizar(indice | null) quando
// vier algo diferente do que estava guardado (null = nada publicado neste idioma).
// Devolve a promessa da conferência.
export function conferirIndice(idioma, aoAtualizar) {
    if (!ehIdiomaDaAjuda(idioma)) throw new Error(`Idioma inválido: ${idioma}`);
    const atual = indiceGuardado(idioma);

    let conferencia = conferidos.get(idioma);
    if (!conferencia) {
        conferencia = buscarDocumento('ajuda_indices', idioma)
            .then((doc) => {
                if (!indiceValido(doc, idioma)) throw new Error('Índice da Central em formato inesperado');
                gravarCache(`indice:${idioma}`, doc);
                return doc;
            })
            .catch((erro) => {
                if (erro instanceof NaoPublicado) {
                    apagarCache(`indice:${idioma}`);
                    return null;
                }
                conferidos.delete(idioma); // tenta de novo na próxima vez
                throw erro;
            });
        conferidos.set(idioma, conferencia);
    }

    return conferencia.then((novo) => {
        const mudou = !atual || !novo || novo.hash !== atual.hash || novo.versao !== atual.versao;
        if (mudou && aoAtualizar) aoAtualizar(novo);
        return novo;
    });
}

// ---------- Artigo ----------

// entrada: o item do artigo no índice do idioma (traz o hash daquele idioma).
export async function carregarArtigo(entrada, idioma) {
    if (!entrada || !ID_ARTIGO.test(entrada.id)) throw new Error('Artigo inválido');
    const chave = `artigo:${entrada.id}`;
    const guardado = lerCache(chave);
    if (guardado && guardado.porIdioma?.[idioma] === entrada.hash && artigoValido(guardado.doc, entrada.id)) {
        return guardado.doc;
    }
    let doc;
    try {
        doc = await buscarDocumento('ajuda_artigos', entrada.id);
    } catch (erro) {
        if (erro instanceof NaoPublicado) return null;
        throw erro;
    }
    if (!artigoValido(doc, entrada.id) || !doc.conteudo[idioma]) throw new Error('Artigo em formato inesperado');
    const porIdioma = guardado && guardado.doc?.hash === doc.hash ? { ...guardado.porIdioma } : {};
    porIdioma[idioma] = entrada.hash;
    gravarCache(chave, { porIdioma, doc });
    return doc;
}

// ---------- Prints ----------

const CAMINHO_PRINT = /^ajuda\/prints\/([a-z]{2}-[A-Z]{2})\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9][a-z0-9-]{0,60}\.(?:png|webp|jpg))$/;

// Endereço público do print (o Storage libera só a leitura de ajuda/). null se o caminho
// não for de um print da Central.
export function enderecoDoPrint(caminho) {
    const m = CAMINHO_PRINT.exec(caminho ?? '');
    if (!m || !ehIdiomaDaAjuda(m[1])) return null;
    if (PRINTS_LOCAIS) return `/__ajuda/prints/${m[1]}/${m[2]}/${m[3]}`;
    return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(caminho)}?alt=media`;
}

// Print do passo e a marcação desenhada por cima (Fase 12). null se o passo não tiver print válido.
// Marcação só existe com print; valor fora do formato vira null (print limpo). Ver src/ajuda/marcacao.js.
export function printDoPasso(passo) {
    const endereco = enderecoDoPrint(passo?.print);
    if (!endereco) return null;
    return { endereco, marcacao: lerMarcacao(passo.marcacao) };
}
