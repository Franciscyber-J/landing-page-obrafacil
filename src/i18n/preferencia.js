// Idioma escolhido pela pessoa no menu (fica guardado no navegador) e idioma inicial do site.

import { escolherIdioma, idioma, analisarCaminho } from './idiomas.js';

const CHAVE = 'obrafacil:idioma';
const CHAVE_ANTIGA = 'i18nextLng'; // gravada pelo detector usado antes (valores pt, en, es, pt-PT...)

function ler(chave) {
    try {
        return window.localStorage.getItem(chave);
    } catch {
        return null;
    }
}

export function gravarPreferencia(codigo) {
    try {
        window.localStorage.setItem(CHAVE, codigo);
    } catch {
        // aba anônima ou bloqueio: segue sem guardar
    }
}

// Idioma para quem chega sem idioma no endereço: o que a pessoa escolheu antes; senão, o do navegador.
export function idiomaPreferido() {
    const guardado = ler(CHAVE) ?? ler(CHAVE_ANTIGA);
    const pedidos = [];
    if (guardado) pedidos.push(guardado);
    if (typeof navigator !== 'undefined') pedidos.push(...(navigator.languages ?? []), navigator.language);
    const escolhido = escolherIdioma(pedidos.filter(Boolean));
    return idioma(escolhido)?.codigo ?? escolhido;
}

// Idioma com que o site abre: o do endereço; sem idioma no endereço, o preferido.
export function idiomaInicial() {
    const lido = analisarCaminho(window.location.pathname);
    if (lido.tipo === 'pagina') return lido.codigo;
    if (lido.tipo === 'antigo' && lido.codigo) return lido.codigo;
    return idiomaPreferido();
}
