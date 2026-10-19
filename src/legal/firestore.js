// Leitura dos Termos e da Política no Firestore pela API REST pública (as regras liberam só a
// leitura de documentos_legais). Sem SDK e sem chave. Funciona no navegador e no Node (build),
// porque só usa fetch.

import { escolherVersao, versaoValida } from './escolha.js';

// Formato da API REST do Firestore → valores comuns (o mesmo de src/ajuda/dados.js, aqui sem
// depender do Vite, porque o build também usa este arquivo no Node).
function lerValor(valor) {
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

export const PROJETO = 'gestao-obras-app-8342c';
// Em "npm run dev" com LEGAL_PASTA, lê a pasta legal/ do gestao_obras (ver vite.config.js).
const LOCAL = import.meta.env?.DEV && import.meta.env?.VITE_LEGAL_LOCAL === 'sim';
const BASE = LOCAL ? '/__legal' : `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents`;
export const DOCUMENTOS = ['termos', 'privacidade'];

class NaoPublicado extends Error {}

// Campo com hífen (pt-BR) vai entre crases no caminho da máscara.
function mascara(campos) {
    return campos.map((c) => `mask.fieldPaths=${encodeURIComponent(c)}`).join('&');
}

async function buscar(url, fetchFn) {
    const resposta = await fetchFn(url, { headers: { Accept: 'application/json' } });
    if (resposta.status === 404) throw new NaoPublicado(url);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao ler os textos legais`);
    return resposta.json();
}

// Lista das versões liberadas (documento raiz). null quando o documento ainda não existe.
async function lerLiberadas(documento, fetchFn) {
    try {
        const corpo = await buscar(`${BASE}/documentos_legais/${documento}?${mascara(['versoes'])}`, fetchFn);
        return lerCampos(corpo.fields).versoes ?? [];
    } catch (erro) {
        if (erro instanceof NaoPublicado) return null;
        throw erro;
    }
}

// Ids das versões existentes (só quando nada foi liberado ainda).
async function lerExistentes(documento, fetchFn) {
    const corpo = await buscar(`${BASE}/documentos_legais/${documento}/versoes?pageSize=100&${mascara(['versao'])}`, fetchFn);
    return (corpo.documents ?? []).map((d) => d.name.split('/').pop()).filter(versaoValida);
}

// Qual versão mostrar: { atual, proxima } (ver escolha.js) ou null se nada existe.
export async function versoesDoDocumento(documento, { fetchFn = fetch, agora = Date.now() } = {}) {
    if (!DOCUMENTOS.includes(documento)) throw new Error(`Documento desconhecido: ${documento}`);
    const liberadas = await lerLiberadas(documento, fetchFn);
    const existentes = liberadas && liberadas.length ? [] : await lerExistentes(documento, fetchFn).catch((e) => {
        if (e instanceof NaoPublicado) return [];
        throw e;
    });
    return escolherVersao(liberadas, existentes, agora);
}

// Texto de uma versão num idioma: { versao, texto, hash, vigenteDesde|null }. Só baixa o idioma
// pedido (máscara), não os oito.
export async function textoDaVersao(documento, versao, idioma, { fetchFn = fetch } = {}) {
    if (!DOCUMENTOS.includes(documento) || !versaoValida(versao) || !/^[a-z]{2}-[A-Z]{2}$/.test(idioma)) {
        throw new Error('Pedido de texto legal inválido');
    }
    const campos = ['versao', 'estado', 'vigente_desde', `textos.\`${idioma}\``, `hashes.\`${idioma}\``];
    let corpo;
    try {
        corpo = await buscar(`${BASE}/documentos_legais/${documento}/versoes/${encodeURIComponent(versao)}?${mascara(campos)}`, fetchFn);
    } catch (erro) {
        if (erro instanceof NaoPublicado) return null;
        throw erro;
    }
    const doc = lerCampos(corpo.fields);
    const texto = doc.textos?.[idioma];
    if (typeof texto !== 'string' || !texto.startsWith('# ')) return null;
    return {
        versao,
        texto,
        hash: doc.hashes?.[idioma] ?? null,
        vigenteDesde: doc.estado === 'preparada' ? null : (doc.vigente_desde ? Date.parse(doc.vigente_desde) : null),
    };
}
