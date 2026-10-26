// Sentido da escrita para o movimento horizontal (árabe e hebraico se leem da direita para a esquerda).
// Vem do cadastro do idioma da página (registro.js, campo direcao), nunca do navegador: o build desenha cada idioma
// com o mesmo valor que o navegador usa, então nada muda na hidratação. Sem React e sem GSAP: os testes rodam no Node.
//
// Regra das animações: deslocamento em X (x, xPercent) e giro em Y e em Z (rotationY, rotationZ) são multiplicados
// pelo sentido; giro em X e deslocamento em Y não mudam. No CSS, o mesmo papel é das variáveis --sentido, --inicio e
// --fim (src/styles/design-tokens.css). O que segue o ponteiro (inclinarComPonteiro, magnetico) é físico de propósito.
import { idioma } from '../i18n/idiomas.js';

// 1 na escrita da esquerda para a direita ('ltr'); -1 na da direita para a esquerda ('rtl').
export function sentidoDaDirecao(direcao) {
    return direcao === 'rtl' ? -1 : 1;
}

export function sentidoDoIdioma(codigo) {
    return sentidoDaDirecao(idioma(codigo)?.direcao);
}

// Lado físico em que a linha começa ('left' ou 'right'), para transformOrigin.
export function inicioDoIdioma(codigo) {
    return sentidoDoIdioma(codigo) === 1 ? 'left' : 'right';
}

// Tecla de seta horizontal → passo na ordem de leitura (+1 avança, -1 volta, 0 não é seta horizontal).
// Na escrita da direita para a esquerda (sentido -1), a seta para a esquerda avança.
export function passoDaSeta(tecla, sentido) {
    if (tecla === 'ArrowRight') return sentido;
    if (tecla === 'ArrowLeft') return -sentido;
    return 0;
}
