// Termos e Política no navegador: guarda no navegador o texto já lido e confere no Firestore
// uma vez por visita (duas leituras: a lista de versões e, só se mudou, o texto do idioma).
// A página gerada no build já traz o texto (legal-inicial): quem abre direto não espera.

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

// Texto que a página gerada no build trouxe, se for deste documento e idioma.
function textoDoBuild(documento, idioma) {
    try {
        const el = document.getElementById('legal-inicial');
        if (!el) return null;
        const dados = JSON.parse(el.textContent);
        if (dados?.documento !== documento || dados?.idioma !== idioma || !valido(dados.atual)) return null;
        return { atual: dados.atual, proxima: dados.proxima ?? null };
    } catch {
        return null;
    }
}

// O que já dá para mostrar sem rede (build ou navegador). null se nada.
export function textoGuardado(documento, idioma) {
    const doCache = lerCache(`${documento}:${idioma}`);
    if (doCache && valido(doCache.atual)) return { atual: doCache.atual, proxima: doCache.proxima ?? null };
    return textoDoBuild(documento, idioma);
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
