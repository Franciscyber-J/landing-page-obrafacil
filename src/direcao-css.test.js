// Conferência do CSS para a escrita da direita para a esquerda (árabe, hebraico): nenhum lado fixo (left/right) sem
// motivo. Use as propriedades lógicas (margin-inline-start, padding-inline, inset-inline-end, text-align: start,
// border-end-start-radius...) e, para o que não tem versão lógica, as variáveis --sentido, --inicio e --fim
// (src/styles/design-tokens.css). Lado físico de propósito leva o comentário "lado físico" logo antes da regra (ou
// dentro dela), com o motivo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.dirname(fileURLToPath(import.meta.url));

function arquivosCss(pasta, lista = []) {
    for (const e of fs.readdirSync(pasta, { withFileTypes: true })) {
        const p = path.join(pasta, e.name);
        if (e.isDirectory()) arquivosCss(p, lista);
        else if (e.name.endsWith('.css')) lista.push(p);
    }
    return lista;
}

// Valores de um atalho (margin: a b c d), sem quebrar dentro de calc(), var() ou max().
function valores(texto) {
    const lista = [];
    let atual = '';
    let nivel = 0;
    for (const c of texto.replace(/!important/, '').trim()) {
        if (c === '(') nivel += 1;
        if (c === ')') nivel -= 1;
        if (c === ' ' && nivel === 0) {
            if (atual) lista.push(atual);
            atual = '';
        } else atual += c;
    }
    if (atual) lista.push(atual);
    return lista;
}

const PROIBIDAS = [
    [/^(margin|padding|border|scroll-margin|scroll-padding)-(left|right)(-|$)/, 'use a versão -inline-start/-inline-end'],
    [/^(left|right)$/, 'use inset-inline-start/inset-inline-end (ou inset-inline com os dois lados iguais)'],
    [/^border-(top|bottom)-(left|right)-radius$/, 'use border-start-start-radius, border-end-end-radius...'],
];
const VALOR_PROIBIDO = [
    [/^(text-align|float|clear)$/, /^(left|right)\b/, 'use start/end (float e clear: inline-start/inline-end)'],
    [/^transform-origin$/, /\b(left|right)\b/, 'use var(--inicio) ou var(--fim)'],
    [/^(transform|translate)$/, /translateX\((?![^)]*--sentido)|translate3d\(/, 'multiplique o X por var(--sentido)'],
];

function problemas(arquivo) {
    const css = fs.readFileSync(arquivo, 'utf8');
    const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    const achados = [];
    for (const m of semComentarios.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)) {
        const [, prop, valor] = m;
        let motivo = null;
        for (const [re, msg] of PROIBIDAS) if (re.test(prop)) motivo = msg;
        for (const [reProp, reValor, msg] of VALOR_PROIBIDO) if (reProp.test(prop) && reValor.test(valor.trim())) motivo = msg;
        if (/^(margin|padding|scroll-margin|scroll-padding|border-width|border-style|border-color|inset)$/.test(prop)) {
            const v = valores(valor);
            if (v.length === 4 && v[1] !== v[3]) motivo = `atalho com os lados diferentes: use ${prop}-block e ${prop}-inline`;
        }
        if (prop === 'border-radius') {
            const v = valores(valor.split('/')[0]);
            if (v.length >= 2) {
                const [a, b, c = a, d = b] = v;
                if (a !== b || c !== d) motivo = 'cantos diferentes de um lado e do outro: use border-start-start-radius...';
            }
        }
        if (!motivo) continue;
        // Exceção: comentário "lado físico" entre o fim da regra anterior e a declaração.
        const abre = css.lastIndexOf('{', m.index);
        const contexto = css.slice(css.lastIndexOf('}', abre) + 1, m.index);
        if (/lado físico/i.test(contexto)) continue;
        const linha = css.slice(0, m.index).split('\n').length;
        achados.push(`${path.relative(SRC, arquivo)}:${linha} ${prop}: ${valor.trim()} → ${motivo}`);
    }
    return achados;
}

test('CSS: sem lado fixo (left/right) fora das exceções comentadas', () => {
    const achados = arquivosCss(SRC).flatMap(problemas);
    assert.deepEqual(achados, []);
});

test('CSS: as variáveis de direção existem e viram no dir="rtl"', () => {
    const tokens = fs.readFileSync(path.join(SRC, 'styles', 'design-tokens.css'), 'utf8');
    assert.match(tokens, /--sentido:\s*1;/);
    assert.match(tokens, /:root\[dir='rtl'\]\s*\{[^}]*--sentido:\s*-1;[^}]*--inicio:\s*right;[^}]*--fim:\s*left;/);
    const index = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
    assert.match(index, /:root\[dir='rtl'\] \.seta\s*\{\s*scale:\s*-1 1;/);
});
