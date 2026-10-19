// Testes dos Termos e da Política no site: qual versão mostrar, leitura do texto e do Firestore.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compararVersoes, escolherVersao } from './escolha.js';
import { blocosEmHtml, lerTexto, sumario, tituloDoTexto, trechos } from './markdown.js';
import { textoDaVersao, versoesDoDocumento } from './firestore.js';

const DIA = 24 * 60 * 60 * 1000;
const AGORA = Date.parse('2026-11-20T12:00:00Z');

test('versões em ordem de número, não de texto', () => {
    assert.equal(compararVersoes('2.10', '2.9'), 1);
    assert.equal(compararVersoes('2.0', '2'), 0);
    assert.equal(compararVersoes('1.9', '2.0'), -1);
});

test('nada liberado: mostra a versão mais nova que existe, sem data', () => {
    assert.deepEqual(escolherVersao(null, ['1.5', '2.0', 'x'], AGORA), { atual: { versao: '2.0', vigenteDesde: null }, proxima: null });
    assert.equal(escolherVersao([], [], AGORA), null);
});

test('liberada em vigor e próxima com aviso', () => {
    const lista = [
        { versao: '2.0', vigente_desde: new Date(AGORA - 40 * DIA).toISOString() },
        { versao: '2.1', vigente_desde: new Date(AGORA + 10 * DIA).toISOString() },
    ];
    const r = escolherVersao(lista, ['9.9'], AGORA);
    assert.equal(r.atual.versao, '2.0');
    assert.equal(r.proxima.versao, '2.1');
});

test('depois da primeira liberação, versão só preparada nunca aparece', () => {
    const lista = [{ versao: '2.0', vigente_desde: new Date(AGORA - DIA).toISOString() }];
    assert.equal(escolherVersao(lista, ['3.0'], AGORA).atual.versao, '2.0');
});

test('primeira liberação ainda no prazo de aviso: mostra a versão com a data em que vale', () => {
    const lista = [{ versao: '2.0', vigente_desde: new Date(AGORA + 5 * DIA).toISOString() }];
    const r = escolherVersao(lista, [], AGORA);
    assert.equal(r.atual.versao, '2.0');
    assert.equal(r.atual.vigenteDesde, AGORA + 5 * DIA);
    assert.equal(r.proxima, null);
});

test('a versão em vigor é a maior com data já chegada', () => {
    const lista = [
        { versao: '2.1', vigente_desde: new Date(AGORA - DIA).toISOString() },
        { versao: '2.0', vigente_desde: new Date(AGORA - 60 * DIA).toISOString() },
        { versao: 'abc', vigente_desde: new Date(AGORA - DIA).toISOString() },
        { versao: '2.2' },
    ];
    assert.equal(escolherVersao(lista, [], AGORA).atual.versao, '2.1');
});

test('texto: título, seções com âncora, listas e negrito; nada vira HTML', () => {
    const blocos = lerTexto('# Termos de Uso\n\nTexto **forte** <b>x</b>.\n\n## 1. O que é\n\n- um\n- **dois**\n\n### Detalhe\n\nFim\ncontinua.');
    assert.equal(tituloDoTexto(blocos), 'Termos de Uso');
    assert.deepEqual(sumario(blocos), [{ id: 's1', texto: '1. O que é' }]);
    assert.deepEqual(blocos[1].trechos, [{ texto: 'Texto ', negrito: false }, { texto: 'forte', negrito: true }, { texto: ' <b>x</b>.', negrito: false }]);
    assert.equal(blocos[3].tipo, 'lista');
    assert.equal(blocos[3].itens.length, 2);
    assert.equal(blocos[5].trechos[0].texto, 'Fim continua.');
    const html = blocosEmHtml(blocos);
    assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
    assert.ok(!html.includes('<b>'));
    assert.ok(html.includes('<h2 id="s1">'));
});

test('trechos com negrito no começo', () => {
    assert.deepEqual(trechos('**A** b'), [{ texto: 'A', negrito: true }, { texto: ' b', negrito: false }]);
});

function respostas(mapa) {
    const pedidos = [];
    const fetchFn = async (url) => {
        pedidos.push(url);
        const chave = Object.keys(mapa).find((k) => url.includes(k));
        if (!chave) return { status: 404, ok: false, json: async () => ({}) };
        return { status: 200, ok: true, json: async () => mapa[chave] };
    };
    return { fetchFn, pedidos };
}

test('Firestore: sem nada liberado lista as versões; o texto vem só no idioma pedido', async () => {
    const { fetchFn, pedidos } = respostas({
        'documentos_legais/termos/versoes?': { documents: [{ name: 'x/versoes/2.0' }, { name: 'x/versoes/1.0' }] },
        'documentos_legais/termos/versoes/2.0?': {
            fields: {
                versao: { stringValue: '2.0' }, estado: { stringValue: 'preparada' },
                textos: { mapValue: { fields: { 'pt-BR': { stringValue: '# Termos de Uso\n\nOi.' } } } },
                hashes: { mapValue: { fields: { 'pt-BR': { stringValue: 'abc' } } } },
            },
        },
    });
    const v = await versoesDoDocumento('termos', { fetchFn, agora: AGORA });
    assert.equal(v.atual.versao, '2.0');
    const t = await textoDaVersao('termos', '2.0', 'pt-BR', { fetchFn });
    assert.equal(t.hash, 'abc');
    assert.equal(t.vigenteDesde, null);
    assert.ok(pedidos.some((p) => p.includes(encodeURIComponent('textos.`pt-BR`'))));
});

test('Firestore: pedido inválido é recusado antes de ir à rede', async () => {
    await assert.rejects(() => textoDaVersao('termos', '../x', 'pt-BR', { fetchFn: async () => { throw new Error('não devia'); } }));
    await assert.rejects(() => versoesDoDocumento('outro'));
});
