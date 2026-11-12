// Moldura de celular dos prints: o estilo sai do aparelho de quem abre.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESTILOS_DA_MOLDURA, HORA_DA_MOLDURA, estiloDaMoldura } from './moldura.js';

const nav = (userAgent, maxTouchPoints = 0) => ({ userAgent, maxTouchPoints });

test('estilo da moldura: pílula nos aparelhos da Apple, furo no Android e nos outros', () => {
    assert.equal(estiloDaMoldura(nav('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15')), 'pilula');
    assert.equal(estiloDaMoldura(nav('Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X)')), 'pilula');
    assert.equal(estiloDaMoldura(nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 5)), 'pilula');
    assert.equal(estiloDaMoldura(nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')), 'pilula');
    assert.equal(estiloDaMoldura(nav('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Mobile')), 'furo');
    assert.equal(estiloDaMoldura(nav('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')), 'furo');
    assert.equal(estiloDaMoldura(nav('Mozilla/5.0 (X11; Linux x86_64)')), 'furo');
    assert.equal(estiloDaMoldura(nav('')), 'furo');
    assert.equal(estiloDaMoldura(null), 'furo');
});

test('os dois estilos e a hora fixa (nunca 9:41, a hora que a Apple usa nas imagens dela)', () => {
    assert.deepEqual(ESTILOS_DA_MOLDURA, ['pilula', 'furo']);
    assert.match(HORA_DA_MOLDURA, /^\d{1,2}:\d{2}$/);
    assert.notEqual(HORA_DA_MOLDURA, '9:41');
});
