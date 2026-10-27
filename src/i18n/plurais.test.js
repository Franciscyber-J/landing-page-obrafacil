// Testes dos plurais: a forma sai pela regra de cada idioma (Intl.PluralRules, pelo i18next), inclusive na variante
// que herda o texto da base, e nos 8 idiomas de hoje nada muda na tela.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import i18next from 'i18next';
import { CODIGOS, cadeia, idioma } from './idiomas.js';
import { comPluraisDaBase, gruposDePlural } from './plurais.js';

const PASTA = path.join(path.dirname(fileURLToPath(import.meta.url)), 'textos');
const TEXTOS = new Map(CODIGOS.map((c) => [c, JSON.parse(fs.readFileSync(path.join(PASTA, `${c}.json`), 'utf8'))]));

// i18next como o do build (src/ssr/i18n.js); comPlurais = false é como era antes (variante sem os plurais da base).
function tradutor(comPlurais) {
    const resources = {};
    for (const [codigo, textos] of TEXTOS) {
        const base = idioma(codigo).base;
        resources[codigo] = { translation: comPlurais && base ? comPluraisDaBase(textos, TEXTOS.get(base)) : textos };
    }
    const i18n = i18next.createInstance();
    i18n.init({
        resources, lng: 'pt-BR', supportedLngs: CODIGOS, fallbackLng: (c) => cadeia(c).slice(1), load: 'currentOnly',
        returnEmptyString: false, interpolation: { escapeValue: false }, showSupportNotice: false, initAsync: false,
    });
    return i18n;
}

test('comPluraisDaBase: a variante recebe só as formas de plural que não reescreveu', () => {
    const base = { a: { itens_one: '{{count}} item', itens_other: '{{count}} itens', titulo: 'Título', tipo_x: 'sem plural' } };
    const variante = { a: { itens_one: '{{count}} item (PT)' } };
    const junto = comPluraisDaBase(variante, base);
    assert.deepEqual(junto, { a: { itens_one: '{{count}} item (PT)', itens_other: '{{count}} itens' } });
    assert.deepEqual(variante, { a: { itens_one: '{{count}} item (PT)' } }, 'não altera o original');
    assert.deepEqual([...gruposDePlural(base).keys()], ['a.itens']);
});

test('plural: a variante usa a regra dela no texto herdado (pt-PT: 0 artigos; pt-BR: 0 artigo)', () => {
    const t = tradutor(true);
    assert.equal(t.t('ajuda.artigos', { lng: 'pt-BR', count: 0 }), '0 artigo');
    assert.equal(t.t('ajuda.artigos', { lng: 'pt-PT', count: 0 }), '0 artigos');
    assert.equal(t.t('ajuda.artigos', { lng: 'pt-PT', count: 1 }), '1 artigo');
    assert.equal(t.t('ajuda.passos', { lng: 'en-GB', count: 1 }), t.t('ajuda.passos', { lng: 'en-US', count: 1 }));
});

// O que o site deve mostrar: na cadeia do idioma, o primeiro que tem a forma que a regra DELE escolhe para o número; a
// variante tem também as formas herdadas da base (escolhidas pela regra da variante).
function esperado(codigo, grupo, n) {
    for (const c of cadeia(codigo)) {
        const formas = new Map(gruposDePlural(TEXTOS.get(c)).get(grupo) ?? []);
        const base = idioma(c).base;
        if (c === codigo && base) for (const [k, v] of gruposDePlural(TEXTOS.get(base)).get(grupo) ?? []) if (!formas.has(k)) formas.set(k, v);
        const forma = n === 0 && formas.has('zero') ? 'zero' : new Intl.PluralRules(c).select(n);
        if (formas.has(forma)) return formas.get(forma).replace('{{count}}', String(n));
    }
    return null;
}

test('plural: cada idioma escolhe a forma pela própria regra (Intl.PluralRules)', () => {
    const t = tradutor(true);
    for (const codigo of CODIGOS) {
        for (const grupo of gruposDePlural(TEXTOS.get('pt-BR')).keys()) {
            for (let n = 0; n <= 120; n += 1) assert.equal(t.t(grupo, { lng: codigo, count: n }), esperado(codigo, grupo, n), `${codigo} ${grupo} ${n}`);
        }
    }
});

test('plural: nos 8 idiomas de hoje nada muda na tela (contagens de 1 a 1000)', () => {
    const antes = tradutor(false);
    const depois = tradutor(true);
    for (const codigo of CODIGOS) {
        for (const grupo of ['ajuda.artigos', 'ajuda.passos']) {
            for (let n = 1; n <= 1000; n += 1) {
                assert.equal(depois.t(grupo, { lng: codigo, count: n }), antes.t(grupo, { lng: codigo, count: n }), `${codigo} ${grupo} ${n}`);
            }
        }
    }
});
