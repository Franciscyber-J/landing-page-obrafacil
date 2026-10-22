// Termos e Política no navegador: guarda no navegador o texto já lido e confere no Firestore
// uma vez por visita (duas leituras: a lista de versões e, só se mudou, o texto do idioma).
// A página pronta do build já traz o texto (src/dadosIniciais.js): quem abre direto não espera.

import { dadosIniciais } from '../dadosIniciais.js';
import { textoDaVersao, versoesDoDocumento } from './firestore.js';

const PREFIXO = 'legal:v1:';
const conferencias = new Map();

function lerCache(chave) {
    try {
        const bruto = window.localStorage.getItem(PREFIXO + chave);
        return bruto ? JSON.parse(bruto) : null;
    } catch {
        return null;
    }
}

function gravarCache(chave, valor) {
    try {
        window.localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
    } catch {
        // sem espaço ou sem permissão: segue sem guardar
    }
}

function valido(t) {
    return t && typeof t.versao === 'string' && typeof t.texto === 'string' && t.texto.startsWith('# ');
}

// Texto com que a página pronta do build foi desenhada (src/dadosIniciais.js), se for deste documento e idioma.
function textoDoBuild(documento, idioma) {
    const dados = dadosIniciais()?.legal;
    if (dados?.documento !== documento || dados?.idioma !== idioma || !valido(dados.atual)) return null;
    return { atual: dados.atual, proxima: dados.proxima ?? null };
}

// O que já dá para mostrar sem rede. null se nada. O texto do build vem antes do guardado no navegador: é o
// que já está na tela da página pronta (a conferência no Firestore troca se houver versão mais nova).
export function textoGuardado(documento, idioma) {
    const doBuild = textoDoBuild(documento, idioma);
    if (doBuild) return doBuild;
    const doCache = lerCache(`${documento}:${idioma}`);
    if (doCache && valido(doCache.atual)) return { atual: doCache.atual, proxima: doCache.proxima ?? null };
    return null;
}

// Confere no Firestore e devolve { atual: {versao, texto, vigenteDesde}, proxima: {versao, vigenteDesde}|null }
// ou null se nada foi publicado. Uma conferência por documento e idioma por visita.
export function conferirTexto(documento, idioma) {
    const chave = `${documento}:${idioma}`;
    let promessa = conferencias.get(chave);
    if (promessa) return promessa;
    promessa = (async () => {
        const escolha = await versoesDoDocumento(documento);
        if (!escolha) return null;
        const guardado = textoGuardado(documento, idioma);
        let atual;
        if (guardado && guardado.atual.versao === escolha.atual.versao) {
            atual = { ...guardado.atual, vigenteDesde: escolha.atual.vigenteDesde };
        } else {
            const lido = await textoDaVersao(documento, escolha.atual.versao, idioma);
            if (!lido) return null;
            atual = { versao: lido.versao, texto: lido.texto, vigenteDesde: escolha.atual.vigenteDesde };
        }
        const resultado = { atual, proxima: escolha.proxima };
        gravarCache(chave, resultado);
        return resultado;
    })().catch((erro) => {
        conferencias.delete(chave);
        throw erro;
    });
    conferencias.set(chave, promessa);
    return promessa;
}

// Texto da próxima versão (aviso de 30 dias), só quando a pessoa pede para ler.
export async function textoDaProxima(documento, idioma, proxima) {
    const lido = await textoDaVersao(documento, proxima.versao, idioma);
    return lido ? { versao: lido.versao, texto: lido.texto, vigenteDesde: proxima.vigenteDesde } : null;
}
