// Texto da tradução com **trecho em destaque**: nos títulos grandes o trecho vira <span class="destaque">
// (gradiente laranja); no texto corrido, <strong> (nomes de botões e telas do app). Sem HTML: só divide o texto.
import { Fragment } from 'react';

export function comDestaque(texto) {
    return String(texto).split('**').map((parte, i) => (
        i % 2 === 1 ? <span key={i} className="destaque">{parte}</span> : <Fragment key={i}>{parte}</Fragment>
    ));
}

export function comNegrito(texto) {
    return String(texto).split('**').map((parte, i) => (
        i % 2 === 1 ? <strong key={i}>{parte}</strong> : <Fragment key={i}>{parte}</Fragment>
    ));
}
