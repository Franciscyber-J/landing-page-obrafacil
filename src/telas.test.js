// Telas do app no site (src/telas.js): a lista dos idiomas com telas bate com as pastas e com o cadastro dos idiomas,
// cada tela tem o tamanho que as molduras de celular usam, e idioma sem telas mostra as do primeiro da cadeia que tiver.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    ALTURA_DA_TELA, IDIOMAS_COM_TELAS, LARGURA_DA_TELA, TELAS, TELAS_NOVAS, idiomaDasTelas, telaDoIdioma,
} from './telas.js';
import { CODIGOS } from './i18n/idiomas.js';

const PASTA = new URL('../public/telas/', import.meta.url);

// Largura e altura de um .webp, lidas do cabeçalho (VP8, VP8L ou VP8X), sem biblioteca.
function tamanhoDoWebp(arquivo) {
    const b = fs.readFileSync(arquivo);
    assert.equal(b.toString('ascii', 0, 4), 'RIFF', `${arquivo}: não é RIFF`);
    assert.equal(b.toString('ascii', 8, 12), 'WEBP', `${arquivo}: não é WEBP`);
    const tipo = b.toString('ascii', 12, 16);
    if (tipo === 'VP8 ') return { largura: b.readUInt16LE(26) & 0x3fff, altura: b.readUInt16LE(28) & 0x3fff };
    if (tipo === 'VP8L') {
        const v = b.readUInt32LE(21);
        return { largura: (v & 0x3fff) + 1, altura: ((v >> 14) & 0x3fff) + 1 };
    }
    if (tipo === 'VP8X') return { largura: b.readUIntLE(24, 3) + 1, altura: b.readUIntLE(27, 3) + 1 };
    throw new Error(`${arquivo}: formato ${tipo} desconhecido`);
}

test('IDIOMAS_COM_TELAS = as pastas de public/telas, cada uma com todas as telas, no tamanho das molduras', () => {
    const pastas = fs.readdirSync(PASTA).filter((n) => fs.statSync(new URL(n, PASTA)).isDirectory()).sort();
    assert.deepEqual([...IDIOMAS_COM_TELAS].sort(), pastas);
    for (const codigo of IDIOMAS_COM_TELAS) {
        for (const tela of TELAS) {
            const arquivo = new URL(`${codigo}/${tela}.webp`, PASTA);
            assert.ok(fs.existsSync(arquivo), `${codigo}/${tela}`);
            assert.deepEqual(tamanhoDoWebp(arquivo), { largura: LARGURA_DA_TELA, altura: ALTURA_DA_TELA }, `${codigo}/${tela}`);
        }
    }
});

test('todo idioma do cadastro tem as telas no próprio idioma', () => {
    assert.deepEqual([...IDIOMAS_COM_TELAS].sort(), [...CODIGOS].sort());
    for (const codigo of CODIGOS) assert.equal(idiomaDasTelas(codigo), codigo);
});

test('molduras de celular com a proporção das telas (CSS e width/height das imagens)', () => {
    const proporcao = `aspect-ratio: ${LARGURA_DA_TELA} / ${ALTURA_DA_TELA};`;
    for (const css of ['index.css', 'components/Placa.module.css']) {
        const texto = fs.readFileSync(new URL(css, import.meta.url), 'utf8');
        const achadas = texto.match(/aspect-ratio:\s*720\s*\/\s*\d+;/g) ?? [];
        assert.ok(achadas.length > 0, `${css}: sem a moldura`);
        for (const a of achadas) assert.equal(a, proporcao, css);
    }
    for (const jsx of ['components/Placa.jsx', 'components/inicio/Recursos.jsx', 'components/inicio/Equipe.jsx',
        'components/inicio/Cliente.jsx']) {
        const texto = fs.readFileSync(new URL(jsx, import.meta.url), 'utf8');
        const alturas = [...texto.matchAll(/height="(\d+)"/g)].map((m) => Number(m[1]));
        assert.ok(alturas.length > 0, `${jsx}: sem imagem de tela`);
        for (const a of alturas) assert.equal(a, ALTURA_DA_TELA, jsx);
    }
});

test('idioma sem telas usa as do primeiro idioma da cadeia que tiver', () => {
    assert.equal(idiomaDasTelas('pt-BR'), 'pt-BR');
    assert.equal(idiomaDasTelas('es-MX'), 'es-MX');
    assert.equal(idiomaDasTelas('fr-FR'), 'fr-FR');
    assert.equal(idiomaDasTelas('ar-SA'), 'ar-SA');
    // Código fora do cadastro: a cadeia termina no inglês internacional.
    assert.equal(idiomaDasTelas('xx-XX'), 'en-US');
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

test('telaDoIdioma: tela de TELAS fica como está, em todos os idiomas (a checklist também)', () => {
    for (const codigo of ['pt-BR', 'en-US', 'fr-FR', 'ar-SA', 'ja-JP']) {
        assert.deepEqual(telaDoIdioma(codigo, 'rdo', 'hero.telas.diario'), { tela: 'rdo', alt: 'hero.telas.diario' });
        assert.deepEqual(
            telaDoIdioma(codigo, 'checklist', 'recursos.itens.checklists.tela'),
            { tela: 'checklist', alt: 'recursos.itens.checklists.tela' },
        );
    }
});

test('telaDoIdioma: tela nova sem print no idioma mostra a do lugar', async (t) => {
    // Simula uma tela nova só no pt-BR (o objeto é o mesmo que telas.js usa).
    TELAS_NOVAS.teste = { idiomas: ['pt-BR'], noLugar: { tela: 'obra', alt: 'recursos.tela' } };
    t.after(() => { delete TELAS_NOVAS.teste; });
    assert.deepEqual(telaDoIdioma('pt-BR', 'teste', 'x'), { tela: 'teste', alt: 'x' });
    assert.deepEqual(telaDoIdioma('ja-JP', 'teste', 'x'), { tela: 'obra', alt: 'recursos.tela' });
});
