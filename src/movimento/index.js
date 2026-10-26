// Movimento do site (GSAP, empacotado com o site: o visitante não instala nada).
// Regra: tudo que se mexe passa por COM_MOVIMENTO. Quem pede "menos movimento" no sistema vê o site
// parado e completo. Os elementos começam visíveis no CSS; a animação só parte do estado escondido
// quando roda (gsap.from), então sem JavaScript ou sem movimento nada fica invisível.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP);
gsap.defaults({ ease: 'expo.out', duration: 0.8 });

export { gsap, ScrollTrigger, SplitText, useGSAP };
// Direção da escrita (árabe, hebraico): o movimento em X espelha (ver sentido.js).
export { inicioDoIdioma, passoDaSeta, sentidoDaDirecao, sentidoDoIdioma } from './sentido.js';

export const COM_MOVIMENTO = '(prefers-reduced-motion: no-preference)';
// Página que chegou pronta do build (texto já no HTML) e já apareceu na tela antes de o JavaScript carregar:
// o que a pessoa já está vendo não pode sumir para "entrar" de novo (seria um piscar). Vale só no primeiro
// desenho; navegar para outra página ou trocar de idioma anima como sempre.
let chegouPronta = false;

export function marcarChegadaPronta(valor) {
    chegouPronta = Boolean(valor);
}

export function encerrarChegada() {
    chegouPronta = false;
}

// true se o elemento já está (ou já passou) na tela de uma página que chegou pronta: pular a entrada dele.
export function jaApareceu(elemento) {
    if (!chegouPronta || !elemento || typeof window === 'undefined') return false;
    return elemento.getBoundingClientRect().top < window.innerHeight;
}

// Inclinação 3D que segue o ponteiro: só com mouse de verdade (no toque não há "passar por cima").
export const COM_MOUSE = '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)';
// Recursos com o celular parado e a tela trocando: só quando cabem lado a lado.
export const LARGO = '(prefers-reduced-motion: no-preference) and (min-width: 1021px)';

// Título que sobe linha por linha, saindo de trás de uma máscara. A máscara tem folga em cima
// (.linha-mask em index.css) para o acento (Ó, Á) não ser cortado. Com autoSplit, se a fonte terminar
// de carregar ou a largura mudar, o SplitText refaz as linhas e mantém o ponto da animação.
export function tituloSobe(alvo, vars = {}) {
    if (!alvo) return null;
    const { scrollTrigger, delay = 0, stagger = 0.09 } = vars;
    return SplitText.create(alvo, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'linha',
        autoSplit: true,
        onSplit(divisao) {
            return gsap.from(divisao.lines, {
                yPercent: 115,
                duration: 1,
                stagger,
                delay,
                scrollTrigger,
            });
        },
    });
}

// Inclinação 3D de um elemento seguindo o ponteiro dentro de uma área. Devolve a limpeza.
// Lado físico de propósito (também na escrita da direita para a esquerda): o elemento vira para onde o ponteiro está.
export function inclinarComPonteiro(area, alvo, { graus = 8 } = {}) {
    if (!area || !alvo) return () => {};
    // Os quickTo só nascem no primeiro movimento do ponteiro: criados antes, eles interrompem a animação de
    // entrada do mesmo elemento (o GSAP desliga a propriedade na outra animação) e o elemento fica parado no meio.
    let girarY = null;
    let girarX = null;
    const criar = () => {
        if (girarY) return;
        girarY = gsap.quickTo(alvo, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        girarX = gsap.quickTo(alvo, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    };
    const mover = (e) => {
        criar();
        const r = area.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        girarY(x * graus * 2);
        girarX(-y * graus * 2);
    };
    const sair = () => {
        if (!girarY) return;
        girarY(0);
        girarX(0);
    };
    area.addEventListener('pointermove', mover);
    area.addEventListener('pointerleave', sair);
    return () => {
        area.removeEventListener('pointermove', mover);
        area.removeEventListener('pointerleave', sair);
    };
}

// Botão "magnético": puxa um pouco em direção ao ponteiro. Devolve a limpeza. Lado físico de propósito (segue o ponteiro).
export function magnetico(botao, { forca = 0.25 } = {}) {
    if (!botao) return () => {};
    // Criados só no primeiro movimento (ver inclinarComPonteiro): antes, eles paravam a entrada do botão no meio,
    // 18 px abaixo do lugar, até alguém passar o mouse.
    let irX = null;
    let irY = null;
    const mover = (e) => {
        if (!irX) {
            irX = gsap.quickTo(botao, 'x', { duration: 0.4, ease: 'power3.out' });
            irY = gsap.quickTo(botao, 'y', { duration: 0.4, ease: 'power3.out' });
        }
        const r = botao.getBoundingClientRect();
        irX((e.clientX - (r.left + r.width / 2)) * forca);
        irY((e.clientY - (r.top + r.height / 2)) * forca);
    };
    const sair = () => {
        if (!irX) return;
        irX(0);
        irY(0);
    };
    botao.addEventListener('pointermove', mover);
    botao.addEventListener('pointerleave', sair);
    return () => {
        botao.removeEventListener('pointermove', mover);
        botao.removeEventListener('pointerleave', sair);
    };
}

// Entrada em grupo (linhas, cartões) quando a área aparece na tela.
export function entrarEmGrupo(alvos, vars = {}) {
    const lista = gsap.utils.toArray(alvos);
    if (!lista.length) return null;
    const { gatilho = lista[0], de = { y: 40, autoAlpha: 0 }, stagger = 0.08, start = 'top 85%' } = vars;
    if (jaApareceu(gatilho)) return null;
    return gsap.from(lista, {
        ...de,
        stagger,
        duration: 0.9,
        scrollTrigger: { trigger: gatilho, start, once: true },
    });
}
