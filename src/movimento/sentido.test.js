// Testes do sentido da escrita no movimento (árabe e hebraico se leem da direita para a esquerda).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDIOMAS } from '../i18n/idiomas.js';
import { inicioDoIdioma, passoDaSeta, sentidoDaDirecao, sentidoDoIdioma } from './sentido.js';

test('sentido: 1 da esquerda para a direita, -1 da direita para a esquerda', () => {
    assert.equal(sentidoDaDirecao('ltr'), 1);
    assert.equal(sentidoDaDirecao('rtl'), -1);
    assert.equal(sentidoDaDirecao(undefined), 1);
});

test('sentido: vem do cadastro do idioma (hoje nenhum idioma é da direita para a esquerda)', () => {
    for (const i of IDIOMAS) {
        assert.equal(sentidoDoIdioma(i.codigo), sentidoDaDirecao(i.direcao), i.codigo);
        assert.equal(inicioDoIdioma(i.codigo), i.direcao === 'rtl' ? 'right' : 'left', i.codigo);
    }
    assert.equal(sentidoDoIdioma('xx-YY'), 1);
});

test('setas do teclado: seguem a ordem de leitura', () => {
    assert.equal(passoDaSeta('ArrowRight', 1), 1);
    assert.equal(passoDaSeta('ArrowLeft', 1), -1);
    assert.equal(passoDaSeta('ArrowRight', -1), -1);
    assert.equal(passoDaSeta('ArrowLeft', -1), 1);
    assert.equal(passoDaSeta('ArrowDown', -1), 0);
});
