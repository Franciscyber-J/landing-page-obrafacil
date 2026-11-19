// Leitura da Central no formato novo (um documento por idioma): o site lê só o idioma da página. O cabeçalho do
// idioma decide se o índice é baixado de novo; o artigo vem só no idioma, com o endereço dele nos outros idiomas.
// Firestore e navegador falsos (fetch e localStorage na memória).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import {
    artigoParaPagina, artigoDaPaginaValido, artigoDoIdiomaValido, caminhoDoArtigo, indiceValido, juntarPartesDoIndice,
    partesDoIndiceDoCabecalho,
} from './formato.js';

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

// Como o publicador grava (ajuda-indice-em-partes): o cabeçalho com a lista das partes, as partes e, enquanto couber,
// o índice inteiro. [emPartes]: false = como antes desta mudança (cabeçalho sem lista, só o índice inteiro).
// O publicador usa as 16 primeiras letras do hash (hexadecimal); aqui o hash de teste vira hexadecimal.
const nomeDaParte = (hash, n) => `indice-${Buffer.from(hash).toString('hex').padEnd(16, '0').slice(0, 16)}-${n}`;
function publicar(idioma, hash, versao, docs, { emPartes = true, inteiro = true } = {}) {
    const completo = indice(idioma, hash, versao, docs.map((d) => ({ id: d.id, slug: d.conteudo.slug, titulo: d.conteudo.titulo, modulo: d.modulo, hash: d.hash })));
    const cabecalho = { formato: 2, idioma, hash, versao, total: docs.length };
    if (emPartes) {
        // Um artigo por parte (o publicador junta até o teto; aqui, para ter mais de uma).
        const grupos = completo.artigos.length ? completo.artigos.map((a) => [a]) : [[]];
        cabecalho.partes_do_indice = grupos.map((_, k) => nomeDaParte(hash, k + 1));
        grupos.forEach((artigos, k) => publicado.set(`ajuda_idiomas/${idioma}/partes/${nomeDaParte(hash, k + 1)}`, {
            formato: 2, idioma, hash_indice: hash, parte: k + 1, partes: grupos.length,
            ...(k === 0 ? { total: completo.total, modulos: completo.modulos } : {}), artigos,
        }));
    }
    publicado.set(`ajuda_idiomas/${idioma}`, cabecalho);
    if (inteiro) publicado.set(`ajuda_idiomas/${idioma}/partes/indice`, completo);
    else publicado.delete(`ajuda_idiomas/${idioma}/partes/indice`);
    for (const d of docs) publicado.set(caminhoDoArtigo(idioma, d.id), d);
    return completo;
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

test('juntar as partes: faltando, de outro índice, fora de ordem ou de outro idioma não vale', () => {
    const cab = { idioma: 'th-TH', hash: 'h', versao: 2, partes_do_indice: ['indice-0123456789abcdef-1', 'indice-0123456789abcdef-2'] };
    const p1 = { idioma: 'th-TH', hash_indice: 'h', parte: 1, partes: 2, total: 2, modulos: [], artigos: [{ id: 'a' }] };
    const p2 = { idioma: 'th-TH', hash_indice: 'h', parte: 2, partes: 2, artigos: [{ id: 'b' }] };
    assert.deepEqual(juntarPartesDoIndice(cab, [p1, p2]), { formato: 2, idioma: 'th-TH', total: 2, modulos: [], artigos: [{ id: 'a' }, { id: 'b' }], hash: 'h', versao: 2 });
    assert.equal(juntarPartesDoIndice(cab, [p1, null]), null);
    assert.equal(juntarPartesDoIndice(cab, [p2, p1]), null);
    assert.equal(juntarPartesDoIndice(cab, [p1]), null);
    assert.equal(juntarPartesDoIndice(cab, [p1, { ...p2, hash_indice: 'outro' }]), null);
    assert.equal(juntarPartesDoIndice({ ...cab, idioma: 'pt-BR' }, [p1, p2]), null);
    for (const lista of [[], ['indice'], ['../x'], 'indice-0123456789abcdef-1']) assert.equal(partesDoIndiceDoCabecalho({ partes_do_indice: lista }), null);
});

test('índice sem nada guardado: lê o cabeçalho e as partes do índice do idioma da página, e guarda', async () => {
    publicar('pt-BR', 'h1', 3, [artigo('pt-BR', 'criar-rdo', 'a1')]);
    pedidos.length = 0;
    let recebido;
    const novo = await dados.conferirIndice('pt-BR', (i) => { recebido = i; });
    assert.deepEqual(pedidos, ['ajuda_idiomas/pt-BR', `ajuda_idiomas/pt-BR/partes/${nomeDaParte('h1', 1)}`]);
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
    assert.deepEqual(pedidos, ['ajuda_idiomas/es-ES', `ajuda_idiomas/es-ES/partes/${nomeDaParte('h3', 1)}`]);
    assert.equal(recebido.hash, 'h3');
});

// Índice em partes (ajuda-indice-em-partes): as partes juntas são o índice inteiro de antes.
test('índice em várias partes: junta na ordem e fica igual ao índice inteiro, sem ler o inteiro', async () => {
    const docs = ['criar-rdo', 'editar-rdo', 'excluir-rdo'].map((id, k) => artigo('it-IT', id, `i${k}`));
    const completo = publicar('it-IT', 'abc', 2, docs, { inteiro: false });
    pedidos.length = 0;
    const novo = await dados.conferirIndice('it-IT', () => {});
    assert.deepEqual(pedidos, ['ajuda_idiomas/it-IT', ...[1, 2, 3].map((n) => `ajuda_idiomas/it-IT/partes/${nomeDaParte('abc', n)}`)]);
    assert.deepEqual(novo, completo);
    assert.deepEqual(dados.indiceGuardado('it-IT'), completo);
});

test('cabeçalho sem partes (publicado antes desta mudança): lê o índice inteiro, como antes', async () => {
    publicar('de-DE', 'h6', 1, [artigo('de-DE', 'criar-rdo', 'f1')], { emPartes: false });
    pedidos.length = 0;
    const novo = await dados.conferirIndice('de-DE', () => {});
    assert.deepEqual(pedidos, ['ajuda_idiomas/de-DE', 'ajuda_idiomas/de-DE/partes/indice']);
    assert.equal(novo.hash, 'h6');
});

test('partes trocadas no meio da leitura (publicação acontecendo): lê o cabeçalho de novo e acerta', async () => {
    publicar('fr-FR', 'novo', 4, [artigo('fr-FR', 'criar-rdo', 'g2')], { inteiro: false });
    // O cabeçalho que o site leu primeiro ainda era o de antes, e as partes dele já saíram.
    const cabecalhoNovo = publicado.get('ajuda_idiomas/fr-FR');
    let primeira = true;
    const fetchDeVerdade = globalThis.fetch;
    globalThis.fetch = async (url) => {
        if (primeira && String(url).endsWith('/documents/ajuda_idiomas/fr-FR')) {
            primeira = false;
            return { status: 200, ok: true, json: async () => ({ fields: campos({ ...cabecalhoNovo, hash: 'velho', partes_do_indice: [nomeDaParte('velho', 1)] }) }) };
        }
        return fetchDeVerdade(url);
    };
    try {
        pedidos.length = 0;
        const novo = await dados.conferirIndice('fr-FR', () => {});
        assert.equal(novo.hash, 'novo');
        assert.deepEqual(pedidos, [`ajuda_idiomas/fr-FR/partes/${nomeDaParte('velho', 1)}`, 'ajuda_idiomas/fr-FR', `ajuda_idiomas/fr-FR/partes/${nomeDaParte('novo', 1)}`]);
    } finally {
        globalThis.fetch = fetchDeVerdade;
    }
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
