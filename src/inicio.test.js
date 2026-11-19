// Listas da página inicial (src/inicio.js): cada recurso tem os textos e uma tela que existe, e cada pergunta tem a
// pergunta e a resposta, no pt-BR (referência) e nos idiomas-base.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PERGUNTAS, RECURSOS } from './inicio.js';
import { TELAS, TELAS_NOVAS } from './telas.js';
import { IDIOMAS } from './i18n/idiomas.js';

const PASTA = new URL('./i18n/textos/', import.meta.url);
const ler = (codigo) => JSON.parse(fs.readFileSync(new URL(`${codigo}.json`, PASTA), 'utf8'));
const pegar = (objeto, chave) => chave.split('.').reduce((o, k) => o?.[k], objeto);
// Idiomas com o arquivo completo (os outros são variantes regionais, só com o que muda).
const BASES = IDIOMAS.filter((i) => !i.base).map((i) => i.codigo);

test('recursos: ids sem repetir, tela conhecida e textos no pt-BR e nos idiomas-base', () => {
    assert.equal(new Set(RECURSOS.map((r) => r.id)).size, RECURSOS.length);
    for (const codigo of BASES) {
        const textos = ler(codigo);
        for (const { id, tela, alt } of RECURSOS) {
            assert.ok(TELAS.includes(tela) || tela in TELAS_NOVAS, `${id}: tela ${tela} não existe`);
            assert.ok(pegar(textos, `recursos.itens.${id}.titulo`), `${codigo}: recursos.itens.${id}.titulo`);
            assert.ok(pegar(textos, `recursos.itens.${id}.texto`), `${codigo}: recursos.itens.${id}.texto`);
            assert.ok(pegar(textos, alt), `${codigo}: ${alt}`);
        }
        for (const { noLugar } of Object.values(TELAS_NOVAS)) assert.ok(pegar(textos, noLugar.alt), `${codigo}: ${noLugar.alt}`);
    }
});

test('perguntas: números sem repetir, cada uma com pergunta e resposta, e nenhuma esquecida fora da lista', () => {
    assert.equal(new Set(PERGUNTAS).size, PERGUNTAS.length);
    for (const codigo of BASES) {
        const faq = ler(codigo).faq;
        for (const n of PERGUNTAS) {
            assert.ok(faq[`q${n}`] && faq[`a${n}`], `${codigo}: faq.q${n}/a${n}`);
        }
        const noArquivo = Object.keys(faq).filter((k) => /^q\d+$/.test(k)).map((k) => Number(k.slice(1)));
        assert.deepEqual([...noArquivo].sort((a, b) => a - b), [...PERGUNTAS].sort((a, b) => a - b), `${codigo}: perguntas fora da lista`);
    }
});

// A variante regional (pt-PT, es-MX...) que repete uma lista (itens dos planos, pontos do cliente) repete a lista
// inteira: item novo na base que não entrar nela some só naquele país.
test('lista que a variante repete tem o mesmo número de itens da base', () => {
    const listas = (objeto, prefixo = '') => Object.entries(objeto).flatMap(([k, v]) => {
        if (Array.isArray(v)) return [[`${prefixo}${k}`, v]];
        return v && typeof v === 'object' ? listas(v, `${prefixo}${k}.`) : [];
    });
    for (const { codigo, base } of IDIOMAS.filter((i) => i.base)) {
        const daBase = ler(base);
        for (const [chave, lista] of listas(ler(codigo))) {
            assert.equal(lista.length, pegar(daBase, chave)?.length, `${codigo}: ${chave} com número de itens diferente de ${base}`);
        }
    }
});
