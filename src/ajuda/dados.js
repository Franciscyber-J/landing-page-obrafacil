// Leitura do conteúdo da Central de Ajuda.
//
// Produção: lê o Firestore pela API REST pública (as regras liberam só a leitura da Central). Sem SDK do Firebase e
// sem chave: o site só lê. Formato novo, um documento por idioma (src/ajuda/formato.js): o site lê só o idioma da
// página (o cabeçalho, o índice quando ele muda e o artigo aberto).
// Desenvolvimento: com AJUDA_SAIDA definido ao rodar "npm run dev", lê os documentos que o
// publicador gravou com --saida (ver vite.config.js), sem tocar no Firestore.
//
// Cache: o índice de cada idioma e cada artigo ficam guardados no navegador. O índice é mostrado na hora (o da
// página pronta ou o guardado) e conferido em segundo plano pelo cabeçalho do idioma (~0,3 KB): o índice inteiro só
// é baixado de novo quando o hash muda. O artigo só é baixado de novo quando o hash dele no índice muda.

import { ehIdiomaDaAjuda } from './idiomas.js';
import { lerMarcacao } from './marcacao.js';
import {
    artigoDaPaginaValido, artigoDoIdiomaValido, artigoParaPagina, caminhoDoArtigo, caminhoDoCabecalho, caminhoDoIndice,
    indiceValido,
} from './formato.js';

export const PROJETO = 'gestao-obras-app-8342c';
export const BUCKET = 'gestao-obras-app-8342c.firebasestorage.app';
const BASE_FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents`;
// Fora do Vite (os testes no Node) não existe import.meta.env. As expressões ficam inteiras de propósito: o Vite troca
// "import.meta.env.VITE_AJUDA_LOCAL" pelo valor (vite.config.js).
const VITE = typeof import.meta.env !== 'undefined';
const LOCAL = VITE && import.meta.env.DEV && import.meta.env.VITE_AJUDA_LOCAL === 'sim';
const PRINTS_LOCAIS = VITE && import.meta.env.DEV && import.meta.env.VITE_AJUDA_PRINTS_LOCAIS === 'sim';
const ID_ARTIGO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// v2: formato novo (um documento por idioma). O que o formato antigo guardou (ajuda:v1:, com os 8 idiomas em cada
// artigo) é apagado na primeira leitura, para não ocupar o espaço do navegador.
const PREFIXO_CACHE = 'ajuda:v2:';
const PREFIXOS_ANTIGOS = ['ajuda:v1:'];

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

let antigosApagados = false;

function apagarCacheAntigo() {
    if (antigosApagados) return;
    antigosApagados = true;
    try {
        const armazenamento = window.localStorage;
        const chaves = [];
        for (let i = 0; i < armazenamento.length; i++) {
            const chave = armazenamento.key(i);
            if (chave && PREFIXOS_ANTIGOS.some((p) => chave.startsWith(p))) chaves.push(chave);
        }
        for (const chave of chaves) armazenamento.removeItem(chave);
    } catch {
        // Sem acesso ao armazenamento: nada a apagar.
    }
}

function lerCache(chave) {
    apagarCacheAntigo();
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

// caminho: "ajuda_idiomas/pt-BR", "ajuda_idiomas/pt-BR/partes/indice"... (formato.js; idioma e id já conferidos).
async function buscarDocumento(caminho) {
    const partes = caminho.split('/').map(encodeURIComponent).join('/');
    const url = LOCAL ? `/__ajuda/${partes}.json` : `${BASE_FIRESTORE}/${partes}`;
    const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
    if (resposta.status === 404) throw new NaoPublicado(caminho);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao ler ${caminho}`);
    const corpo = await resposta.json();
    return LOCAL ? corpo : lerCampos(corpo.fields);
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
// [conhecido]: o índice que já está na tela (o da página pronta), quando o navegador não tem um guardado.
// Lê primeiro o cabeçalho do idioma; o índice inteiro só quando o hash dele mudou.
// Devolve a promessa da conferência.
export function conferirIndice(idioma, aoAtualizar, conhecido = null) {
    if (!ehIdiomaDaAjuda(idioma)) throw new Error(`Idioma inválido: ${idioma}`);
    const atual = indiceGuardado(idioma) ?? (indiceValido(conhecido, idioma) ? conhecido : null);

    let conferencia = conferidos.get(idioma);
    if (!conferencia) {
        conferencia = buscarDocumento(caminhoDoCabecalho(idioma))
            .then(async (cabecalho) => {
                const igual = atual && cabecalho?.hash && cabecalho.hash === atual.hash
                    && (cabecalho.versao ?? atual.versao) === atual.versao;
                if (igual) {
                    gravarCache(`indice:${idioma}`, atual); // o da página pronta passa a valer nas próximas visitas
                    return atual;
                }
                const doc = await buscarDocumento(caminhoDoIndice(idioma));
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
// Devolve o artigo no formato das páginas (formato.js, artigoParaPagina), ou null se não estiver publicado.
export async function carregarArtigo(entrada, idioma) {
    if (!entrada || !ID_ARTIGO.test(entrada.id)) throw new Error('Artigo inválido');
    if (!ehIdiomaDaAjuda(idioma)) throw new Error(`Idioma inválido: ${idioma}`);
    const chave = `artigo:${idioma}:${entrada.id}`;
    const guardado = lerCache(chave);
    if (guardado && guardado.hash === entrada.hash && artigoDaPaginaValido(guardado.doc, entrada.id, idioma)) {
        return guardado.doc;
    }
    let bruto;
    try {
        bruto = await buscarDocumento(caminhoDoArtigo(idioma, entrada.id));
    } catch (erro) {
        if (erro instanceof NaoPublicado) return null;
        throw erro;
    }
    if (!artigoDoIdiomaValido(bruto, entrada.id, idioma)) throw new Error('Artigo em formato inesperado');
    const doc = artigoParaPagina(bruto);
    gravarCache(chave, { hash: bruto.hash, doc });
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
