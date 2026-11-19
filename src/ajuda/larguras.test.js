// Prints da Central por largura da tela (src/ajuda/larguras.js): o passo devolve o print de cada largura com as
// larguras em que ele aparece (o de celular cobre as que não têm o próprio), e o CSS mostra cada um nos mesmos limites
// do app (600 e 1024 px).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { printsDoPasso, printDoPasso } from './dados.js';
import { APARELHO_DA_FAIXA, FAIXAS, INICIO_DA_FAIXA, PROPORCAO_DA_FAIXA } from './larguras.js';

const base = 'ajuda/prints/pt-BR/criar-rdo';
const marcacao = (x) => ({ x, y: 0.5, largura: 0.2, altura: 0.1, efeitos: ['escurecer', 'circulo'] });
const passo = (larguras) => ({
    titulo: 'Toque em NOVO RDO',
    texto: 'O botão fica embaixo.',
    print: `${base}/passo-1-aaaaaaaaaa.webp`,
    marcacao: marcacao(0.1),
    ...(larguras ? { larguras } : {}),
});
const media = { print: `${base}/passo-1-media-bbbbbbbbbb.webp`, print_tamanho: 9, marcacao: marcacao(0.3) };
const computador = { print: `${base}/passo-1-computador-cccccccccc.webp`, print_tamanho: 9, marcacao: marcacao(0.6) };

test('as faixas e os limites são os do app', () => {
    assert.deepEqual([...FAIXAS], ['celular', 'media', 'computador']);
    assert.deepEqual({ ...INICIO_DA_FAIXA }, { media: 600, computador: 1024 });
    assert.deepEqual({ ...APARELHO_DA_FAIXA }, { celular: 'celular', media: 'dobravel', computador: 'computador' });
    assert.ok(PROPORCAO_DA_FAIXA.celular < PROPORCAO_DA_FAIXA.media && PROPORCAO_DA_FAIXA.media < 1 && PROPORCAO_DA_FAIXA.computador > 1);
});

test('passo só com o print de celular: um print, em todas as larguras (como antes)', () => {
    const lista = printsDoPasso(passo());
    assert.equal(lista.length, 1);
    assert.deepEqual(lista[0].faixas, ['celular', 'media', 'computador']);
    assert.equal(lista[0].endereco, printDoPasso(passo()).endereco);
    assert.equal(lista[0].marcacao.x, 0.1);
});

test('com as duas larguras: cada print com a marcação dele e as larguras em que aparece', () => {
    const lista = printsDoPasso(passo({ media, computador }));
    assert.deepEqual(lista.map((p) => [p.faixa, p.faixas]), [
        ['celular', ['celular']],
        ['media', ['media']],
        ['computador', ['computador']],
    ]);
    assert.match(lista[1].endereco, /passo-1-media-bbbbbbbbbb\.webp/);
    assert.equal(lista[1].marcacao.x, 0.3);
    assert.equal(lista[2].marcacao.x, 0.6);
    // Toda largura tem exatamente um print.
    for (const f of FAIXAS) assert.equal(lista.filter((p) => p.faixas.includes(f)).length, 1, f);
});

test('sem a do computador: o de celular aparece no computador (não o da largura média)', () => {
    const lista = printsDoPasso(passo({ media }));
    assert.deepEqual(lista.map((p) => [p.faixa, p.faixas]), [['celular', ['celular', 'computador']], ['media', ['media']]]);
});

test('leitura tolerante: largura desconhecida, endereço inválido e passo sem print', () => {
    const estranho = printsDoPasso(passo({ tablet: media, media: { print: 'https://outro.site/x.webp' }, computador: 'x' }));
    assert.deepEqual(estranho.map((p) => p.faixa), ['celular']);
    assert.deepEqual(estranho[0].faixas, ['celular', 'media', 'computador']);
    assert.deepEqual(printsDoPasso({ titulo: 'x', texto: 'y', larguras: { media } }), []);
    assert.deepEqual(printsDoPasso(null), []);
    // Marcação fora do formato: o print da largura sai limpo.
    assert.equal(printsDoPasso(passo({ media: { ...media, marcacao: { x: 9 } } }))[1].marcacao, null);
});

test('o CSS mostra cada print nos limites do app, e o escondido fica sem caixa', () => {
    const css = fs.readFileSync(new URL('../components/ajuda/Ajuda.module.css', import.meta.url), 'utf8');
    const regra = (cabecalho, faixa) => new RegExp(`@media ${cabecalho.replace(/[()]/g, '\\$&')} \\{\\s*\\.printNaFaixa\\[data-${faixa}\\] \\{\\s*display: block;`);
    assert.match(css, regra(`(max-width: ${INICIO_DA_FAIXA.media - 0.02}px)`, 'celular'));
    assert.match(css, regra(`(min-width: ${INICIO_DA_FAIXA.media}px) and (max-width: ${INICIO_DA_FAIXA.computador - 0.02}px)`, 'media'));
    assert.match(css, regra(`(min-width: ${INICIO_DA_FAIXA.computador}px)`, 'computador'));
    assert.match(css, /\.printNaFaixa \{\s*display: none;/);
});

test('o artigo usa os prints por largura, e as imagens continuam preguiçosas', () => {
    const artigo = fs.readFileSync(new URL('../components/ajuda/AjudaArtigo.jsx', import.meta.url), 'utf8');
    assert.match(artigo, /printsDoPasso\(p\)/);
    assert.match(artigo, /<PrintDoPasso versoes=\{prints\}/);
    const print = fs.readFileSync(new URL('../components/ajuda/PrintComMarcacao.jsx', import.meta.url), 'utf8');
    assert.match(print, /loading="lazy"/);
    // O primeiro desenho não depende do navegador: nada de window nem de matchMedia na escolha.
    const doPasso = fs.readFileSync(new URL('../components/ajuda/PrintDoPasso.jsx', import.meta.url), 'utf8');
    assert.doesNotMatch(doPasso.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n'), /window|matchMedia|useMontado|useEffect/);
});
