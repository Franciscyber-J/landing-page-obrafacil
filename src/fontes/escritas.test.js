// Testes das fontes das escritas (checklist de idiomas, A4 do site): quais escritas entram no build, o CSS de cada
// uma e os pacotes do npm que ele usa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDIOMAS } from '../i18n/registro.js';
import { ESCRITAS, LATINA, escritasDoCadastro, moduloDasFontes } from './escritas.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../..');
const ler = (...partes) => fs.readFileSync(path.join(...partes), 'utf8');

test('cadastro de hoje: cada idioma de outra escrita com a dele; os latinos sem fonte a mais', () => {
    assert.deepEqual(escritasDoCadastro(IDIOMAS), {
        'ar-SA': 'arabe', 'he-IL': 'hebraica', 'hi-IN': 'devanagari', 'ja-JP': 'japonesa', 'ko-KR': 'coreana',
        'th-TH': 'tailandesa', 'zh-TW': 'chinesaTradicional',
    });
    const latinos = IDIOMAS.filter((i) => !['ar', 'he', 'hi', 'ja', 'ko', 'th', 'zh'].includes(i.codigo.slice(0, 2)));
    for (const i of latinos) assert.ok(i.escrita === undefined || i.escrita === LATINA, i.codigo);
    // Só os latinos: o módulo do build é uma função vazia (nada a mais no site).
    assert.equal(moduloDasFontes(latinos), 'export function usarEscritaDoIdioma() {}\n');
});

test('idioma de outra escrita: só as escritas usadas entram, e a variante herda a da base', () => {
    const cadastro = [
        { codigo: 'pt-BR' },
        { codigo: 'ja-JP', escrita: 'japonesa' },
        { codigo: 'ar-SA', escrita: 'arabe' },
        { codigo: 'ar-EG', base: 'ar-SA' },
        { codigo: 'ru-KZ', escrita: 'latina' },
    ];
    assert.deepEqual(escritasDoCadastro(cadastro), { 'ja-JP': 'japonesa', 'ar-SA': 'arabe', 'ar-EG': 'arabe' });
    const modulo = moduloDasFontes(cadastro);
    assert.match(modulo, /"arabe": \(\) => import\("\/src\/fontes\/arabe\.css"\)/);
    assert.match(modulo, /"japonesa": \(\) => import\("\/src\/fontes\/japonesa\.css"\)/);
    assert.doesNotMatch(modulo, /coreana|tailandesa/);
    assert.match(modulo, /document\.documentElement\.dataset\.escrita = escrita;/);
});

test('escrita que não existe no cadastro: o build para com o idioma e o valor', () => {
    assert.throws(() => escritasDoCadastro([{ codigo: 'xx-YY', escrita: 'klingon' }]), /xx-YY.*"klingon"/);
});

test('cada escrita tem o CSS com o pacote, a fonte e as variáveis --fonte-*', () => {
    const pacoteDoSite = JSON.parse(ler(RAIZ, 'package.json'));
    for (const [escrita, { pacote, familia }] of Object.entries(ESCRITAS)) {
        const css = ler(AQUI, `${escrita}.css`);
        assert.ok(css.includes(`@import '${pacote}';`), escrita);
        assert.ok(css.includes(`:root[data-escrita='${escrita}'] {`), escrita);
        assert.ok(css.includes(`--fonte-texto: 'Manrope', '${familia}', system-ui, sans-serif;`), escrita);
        assert.ok(css.includes(`--fonte-titulo: 'Bricolage Grotesque', 'Manrope', '${familia}', system-ui, sans-serif;`), escrita);
        // Versão exata, como as outras fontes do site.
        assert.match(pacoteDoSite.dependencies[pacote] ?? '', /^\d+\.\d+\.\d+$/, pacote);
    }
});

test('os pacotes servem a fonte do próprio site, em pedaços por unicode-range', () => {
    for (const { pacote, familia } of Object.values(ESCRITAS)) {
        const pasta = path.join(RAIZ, 'node_modules', pacote);
        const css = ler(pasta, 'index.css');
        const blocos = css.split('@font-face').slice(1);
        assert.ok(blocos.length > 0, pacote);
        for (const bloco of blocos) {
            assert.ok(bloco.includes(`font-family: '${familia}'`), pacote);
            assert.match(bloco, /unicode-range: U\+/, pacote);
            const url = bloco.match(/url\(([^)]+)\)/)[1];
            assert.ok(!/^(https?:)?\/\//.test(url), `${pacote}: ${url} (nada de terceiros)`);
            assert.ok(fs.existsSync(path.join(pasta, url)), `${pacote}: ${url}`);
        }
    }
});

test('a tipografia dos idiomas de hoje não muda (Manrope e Bricolage, sem Noto)', () => {
    const tokens = ler(RAIZ, 'src/styles/design-tokens.css');
    assert.ok(tokens.includes("--fonte-titulo: 'Bricolage Grotesque', 'Manrope', system-ui, sans-serif;"));
    assert.ok(tokens.includes("--fonte-texto: 'Manrope', system-ui, sans-serif;"));
    assert.doesNotMatch(tokens, /Noto/);
    assert.doesNotMatch(ler(RAIZ, 'src/main.jsx'), /noto-sans/);
});
