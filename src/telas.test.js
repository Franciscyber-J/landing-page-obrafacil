// Telas do app no site (src/telas.js): a lista dos idiomas com telas bate com as pastas, e idioma sem telas mostra
// as do primeiro da cadeia que tiver.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IDIOMAS_COM_TELAS, TELAS, idiomaDasTelas } from './telas.js';

const PASTA = new URL('../public/telas/', import.meta.url);

test('IDIOMAS_COM_TELAS = as pastas de public/telas, cada uma com as 7 telas', () => {
    const pastas = fs.readdirSync(PASTA).filter((n) => fs.statSync(new URL(n, PASTA)).isDirectory()).sort();
    assert.deepEqual([...IDIOMAS_COM_TELAS].sort(), pastas);
    for (const codigo of IDIOMAS_COM_TELAS) {
        for (const tela of TELAS) assert.ok(fs.existsSync(new URL(`${codigo}/${tela}.webp`, PASTA)), `${codigo}/${tela}`);
    }
});

test('idioma sem telas usa as do primeiro idioma da cadeia que tiver', () => {
    assert.equal(idiomaDasTelas('pt-BR'), 'pt-BR');
    assert.equal(idiomaDasTelas('es-MX'), 'es-MX');
    assert.equal(idiomaDasTelas('fr-FR'), 'en-US');
    assert.equal(idiomaDasTelas('ar-SA'), 'en-US');
});
