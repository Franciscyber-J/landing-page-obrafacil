// Leitura da Central no formato novo (um documento por idioma): o site lê só o idioma da página. O cabeçalho do
// idioma decide se o índice é baixado de novo; o artigo vem só no idioma, com o endereço dele nos outros idiomas.
// Firestore e navegador falsos (fetch e localStorage na memória).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artigoParaPagina, artigoDaPaginaValido, artigoDoIdiomaValido, caminhoDoArtigo, indiceValido } from './formato.js';

// ---------- Navegador e Firestore falsos ----------

const memoria = new Map();
globalThis.window = {
    localStorage: {
        get length() { return memoria.size; },
        key: (i) => [...memoria.keys()][i] ?? null,
        getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
        setItem: (k, v) => { memoria.set(k, String(v)); },
        removeItem: (k) => { memoria.delete(k); },
    },
};

// Valor no formato da API REST do Firestore.
function valor(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(valor) } };
    return { mapValue: { fields: campos(v) } };
}
const campos = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, valor(v)]));

const publicado = new Map(); // caminho -> dados
const pedidos = [];
globalThis.fetch = async (url) => {
    const caminho = decodeURIComponent(String(url).split('/documents/')[1] ?? '');
    pedidos.push(caminho);
    if (!publicado.has(caminho)) return { status: 404, ok: false, json: async () => ({}) };
    return { status: 200, ok: true, json: async () => ({ fields: campos(publicado.get(caminho)) }) };
};

const dados = await import('./dados.js');

function indice(idioma, hash, versao, artigos) {
    return { formato: 2, idioma, hash, versao, total: artigos.length, modulos: [{ id: 'diario', nome: 'Diário', nomes: { [idioma]: 'Diário' }, total: 1 }], artigos };
}

function artigo(idioma, id, hash, titulo = 'Criar um RDO') {
    return {
        formato: 2, id, idioma, modulo: 'diario', ordem: 1, tipo: 'funcao', publico: ['gestor'], prioritario: true,
        pre_requisitos: [], relacionados: ['outro'], requer: [], tutorial: null,
        conteudo: { slug: `${id}-${idioma.toLowerCase()}`, titulo, resumo: 'Resumo', tags: ['rdo'], passos: [{ titulo: 'Abra', texto: 'Toque em **Novo**.' }] },
        slugs: { 'pt-BR': `${id}-pt-br`, 'en-US': `${id}-en-us`, 'es-ES': `${id}-es-es` },
        busca: 'Abra Toque em Novo.', hash, hash_documento: `doc-${hash}`,
    };
}

function publicar(idioma, hash, versao, docs) {
    publicado.set(`ajuda_idiomas/${idioma}`, { formato: 2, idioma, hash, versao, total: docs.length });
    publicado.set(`ajuda_idiomas/${idioma}/partes/indice`, indice(idioma, hash, versao, docs.map((d) => ({ id: d.id, slug: d.conteudo.slug, titulo: d.conteudo.titulo, modulo: d.modulo, hash: d.hash }))));
    for (const d of docs) publicado.set(caminhoDoArtigo(idioma, d.id), d);
}

// ---------- Testes ----------

test('formato: do documento do idioma para o formato das páginas, sem os campos do publicador', () => {
    const doc = artigo('pt-BR', 'criar-rdo', 'a1');
    assert.ok(artigoDoIdiomaValido(doc, 'criar-rdo', 'pt-BR'));
    assert.ok(!artigoDoIdiomaValido(doc, 'criar-rdo', 'en-US'), 'outro idioma');
    assert.ok(!artigoDoIdiomaValido({ ...doc, conteudo: [] }, 'criar-rdo', 'pt-BR'));
    const pagina = artigoParaPagina(doc);
    assert.deepEqual(pagina.conteudo['pt-BR'], doc.conteudo, 'o texto inteiro no idioma do artigo');
    assert.deepEqual(pagina.conteudo['en-US'], { slug: 'criar-rdo-en-us' }, 'só o endereço nos outros');
    assert.deepEqual(pagina.conteudo['es-ES'], { slug: 'criar-rdo-es-es' });
    for (const campo of ['formato', 'idioma', 'slugs', 'busca', 'hash_documento']) assert.equal(campo in pagina, false, campo);
    assert.equal(pagina.hash, 'a1');
    assert.deepEqual(pagina.relacionados, ['outro']);
    assert.ok(artigoDaPaginaValido(pagina, 'criar-rdo', 'pt-BR'));
    assert.ok(!artigoDaPaginaValido(pagina, 'criar-rdo', 'en-US'), 'en-US só tem o endereço');
    assert.ok(indiceValido(indice('pt-BR', 'h', 1, []), 'pt-BR'));
    assert.ok(!indiceValido(indice('pt-BR', 'h', 1, []), 'en-US'));
});

test('índice sem nada guardado: lê o cabeçalho e o índice do idioma da página, e guarda', async () => {
    publicar('pt-BR', 'h1', 3, [artigo('pt-BR', 'criar-rdo', 'a1')]);
    pedidos.length = 0;
    let recebido;
    const novo = await dados.conferirIndice('pt-BR', (i) => { recebido = i; });
    assert.deepEqual(pedidos, ['ajuda_idiomas/pt-BR', 'ajuda_idiomas/pt-BR/partes/indice']);
    assert.equal(novo.hash, 'h1');
    assert.equal(recebido.hash, 'h1');
    assert.equal(dados.indiceGuardado('pt-BR').versao, 3);
});

test('índice da página pronta com o mesmo hash do cabeçalho: só o cabeçalho é lido (~0,3 KB)', async () => {
    publicar('en-US', 'h2', 5, [artigo('en-US', 'criar-rdo', 'b1')]);
    const daPaginaPronta = indice('en-US', 'h2', 5, [{ id: 'criar-rdo', slug: 'criar-rdo-en-us', titulo: 'Create', modulo: 'diario', hash: 'b1' }]);
    pedidos.length = 0;
    let chamado = false;
    const novo = await dados.conferirIndice('en-US', () => { chamado = true; }, daPaginaPronta);
    assert.deepEqual(pedidos, ['ajuda_idiomas/en-US']);
    assert.equal(chamado, false, 'nada mudou na tela');
    assert.equal(novo, daPaginaPronta);
    assert.equal(dados.indiceGuardado('en-US').hash, 'h2', 'passa a valer nas próximas visitas');
});

test('cabeçalho com outro hash: baixa o índice novo e avisa a tela', async () => {
    publicar('es-ES', 'h3', 1, [artigo('es-ES', 'criar-rdo', 'c1')]);
    const antigo = indice('es-ES', 'velho', 0, []);
    pedidos.length = 0;
    let recebido;
    await dados.conferirIndice('es-ES', (i) => { recebido = i; }, antigo);
    assert.deepEqual(pedidos, ['ajuda_idiomas/es-ES', 'ajuda_idiomas/es-ES/partes/indice']);
    assert.equal(recebido.hash, 'h3');
});

test('idioma sem nada publicado: a tela recebe null', async () => {
    let recebido = 'nada';
    await dados.conferirIndice('pt-PT', (i) => { recebido = i; });
    assert.equal(recebido, null);
});

test('artigo: só o do idioma, no formato das páginas; o guardado vale enquanto o hash for o mesmo', async () => {
    publicar('en-GB', 'h4', 1, [artigo('en-GB', 'criar-rdo', 'd1', 'Create a daily report')]);
    pedidos.length = 0;
    const entrada = { id: 'criar-rdo', hash: 'd1' };
    const doc = await dados.carregarArtigo(entrada, 'en-GB');
    assert.deepEqual(pedidos, ['ajuda_idiomas/en-GB/artigos/criar-rdo']);
    assert.equal(doc.conteudo['en-GB'].titulo, 'Create a daily report');
    assert.deepEqual(doc.conteudo['pt-BR'], { slug: 'criar-rdo-pt-br' });
    assert.equal('slugs' in doc, false);

    // Mesmo hash: do navegador, sem pedir nada.
    pedidos.length = 0;
    assert.deepEqual(await dados.carregarArtigo(entrada, 'en-GB'), doc);
    assert.deepEqual(pedidos, []);

    // Hash novo no índice: baixa de novo.
    publicar('en-GB', 'h5', 2, [artigo('en-GB', 'criar-rdo', 'd2', 'Create a daily report (revised)')]);
    const novo = await dados.carregarArtigo({ id: 'criar-rdo', hash: 'd2' }, 'en-GB');
    assert.deepEqual(pedidos, ['ajuda_idiomas/en-GB/artigos/criar-rdo']);
    assert.match(novo.conteudo['en-GB'].titulo, /revised/);
});

test('artigo que não está publicado no idioma: null; fora do formato: erro', async () => {
    assert.equal(await dados.carregarArtigo({ id: 'nao-existe', hash: 'x' }, 'en-CA'), null);
    publicado.set(caminhoDoArtigo('en-AU', 'criar-rdo'), { ...artigo('en-AU', 'criar-rdo', 'e1'), idioma: 'en-US' });
    await assert.rejects(dados.carregarArtigo({ id: 'criar-rdo', hash: 'e1' }, 'en-AU'), /formato inesperado/);
    await assert.rejects(dados.carregarArtigo({ id: '../x', hash: 'e1' }, 'en-AU'), /inválido/);
});

test('o que o formato antigo guardou no navegador é apagado', async () => {
    const outra = await import('./dados.js?limpeza');
    memoria.set('ajuda:v1:artigo:criar-rdo', '{"porIdioma":{},"doc":{}}');
    memoria.set('ajuda:v1:indice:pt-BR', '{}');
    memoria.set('outra:coisa', 'fica');
    outra.indiceGuardado('pt-BR');
    assert.equal(memoria.has('ajuda:v1:artigo:criar-rdo'), false);
    assert.equal(memoria.has('ajuda:v1:indice:pt-BR'), false);
    assert.equal(memoria.get('outra:coisa'), 'fica');
});
