// Telas do app no site (src/telas.js): a lista dos idiomas com telas bate com as pastas, e idioma sem telas mostra
// as do primeiro da cadeia que tiver.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IDIOMAS_COM_TELAS, TELAS, TELAS_NOVAS, idiomaDasTelas, telaDoIdioma } from './telas.js';

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

test('TELAS_NOVAS: cada idioma da lista tem o print, e no lugar fica uma tela que todos têm', () => {
    for (const [nome, { idiomas, noLugar }] of Object.entries(TELAS_NOVAS)) {
        assert.ok(!TELAS.includes(nome), `${nome} já está em TELAS: tire de TELAS_NOVAS`);
        assert.ok(TELAS.includes(noLugar.tela), `${nome}: a tela do lugar (${noLugar.tela}) tem de estar em TELAS`);
        assert.ok(noLugar.alt, `${nome}: falta o texto alternativo da tela do lugar`);
        assert.equal(new Set(idiomas).size, idiomas.length, `${nome}: idioma repetido`);
        for (const codigo of idiomas) {
            assert.ok(IDIOMAS_COM_TELAS.includes(codigo), `${nome}: ${codigo} não está em IDIOMAS_COM_TELAS`);
            assert.ok(fs.existsSync(new URL(`${codigo}/${nome}.webp`, PASTA)), `${codigo}/${nome}.webp`);
        }
        assert.ok(idiomas.length < IDIOMAS_COM_TELAS.length, `${nome}: todos os idiomas têm o print; passe para TELAS`);
    }
});

test('telaDoIdioma: tela de TELAS fica como está; tela nova sem print no idioma mostra a do lugar', () => {
    assert.deepEqual(telaDoIdioma('pt-BR', 'rdo', 'hero.telas.diario'), { tela: 'rdo', alt: 'hero.telas.diario' });
    const { idiomas, noLugar } = TELAS_NOVAS.checklist;
    for (const codigo of ['pt-BR', 'en-US', 'fr-FR', 'ar-SA']) {
        const esperado = idiomas.includes(idiomaDasTelas(codigo))
            ? { tela: 'checklist', alt: 'recursos.itens.checklists.tela' }
            : noLugar;
        assert.deepEqual(telaDoIdioma(codigo, 'checklist', 'recursos.itens.checklists.tela'), esperado);
    }
});
