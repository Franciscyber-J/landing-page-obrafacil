// Texto da tradução com **trecho em destaque**: o trecho vira <span class="destaque"> (gradiente
// laranja nos títulos grandes). Sem HTML: só divide o texto.
import { Fragment } from 'react';

export function comDestaque(texto) {
    return String(texto).split('**').map((parte, i) => (
        i % 2 === 1 ? <span key={i} className="destaque">{parte}</span> : <Fragment key={i}>{parte}</Fragment>
    ));
}
