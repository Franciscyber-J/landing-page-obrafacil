// Testes da busca, do leitor de texto e dos idiomas da Central de Ajuda.
// Rodar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscar, normalizar, prepararBusca, termosDaConsulta } from './busca.js';
import { lerLinha, lerTexto } from './texto.js';
import { idiomaDaAjuda, idiomaDoSite, IDIOMAS_AJUDA } from './idiomas.js';

const ARTIGOS = [
    { id: 'cadastrar-colaborador', titulo: 'Como cadastrar um colaborador na sua equipe', resumo: 'Cadastre quem trabalha na obra.', tags: ['funcionário', 'pedreiro'], busca: 'Abra Equipe e toque em Novo colaborador.', prioritario: true },
    { id: 'criar-rdo', titulo: 'Como criar um Diário de Obra (RDO)', resumo: 'Registre o dia da obra.', tags: ['rdo', 'relatório diário', 'fotos'], busca: 'Em EQUIPE DA OBRA marque a presença de cada colaborador.', prioritario: true },
    { id: 'pdf-do-rdo', titulo: 'Como baixar e compartilhar o PDF do RDO', resumo: 'Envie o relatório pelo WhatsApp.', tags: ['pdf'], busca: 'Toque em Compartilhar.', prioritario: false },
];
const preparado = prepararBusca(ARTIGOS);
const ids = (lista) => lista.map((a) => a.id);

test('normaliza acento, maiúscula e pontuação', () => {
    assert.equal(normalizar('Relatório DIÁRIO (RDO)!'), 'relatorio diario rdo');
    assert.equal(normalizar('Ação e Pão'), 'acao e pao');
});

test('busca sem acento acha texto com acento', () => {
    assert.deepEqual(ids(buscar(preparado, 'relatorio diario')), ['criar-rdo']);
    assert.deepEqual(ids(buscar(preparado, 'funcionario')), ['cadastrar-colaborador']);
});

test('título pesa mais que o texto dos passos', () => {
    // "colaborador" está no título de um e só no texto do outro.
    assert.deepEqual(ids(buscar(preparado, 'colaborador')), ['cadastrar-colaborador', 'criar-rdo']);
});

test('todas as palavras importantes precisam aparecer; palavras vazias são ignoradas', () => {
    assert.deepEqual(ids(buscar(preparado, 'como baixar o pdf')), ['pdf-do-rdo']);
    assert.deepEqual(ids(buscar(preparado, 'pdf colaborador')), []);
    assert.deepEqual(termosDaConsulta('como fazer o RDO'), ['fazer', 'rdo']);
    assert.deepEqual(termosDaConsulta('como'), ['como']);
});

test('plural acha singular e pedaço de palavra também acha', () => {
    assert.deepEqual(ids(buscar(preparado, 'pdfs')), ['pdf-do-rdo']);
    assert.ok(ids(buscar(preparado, 'colab')).includes('cadastrar-colaborador'));
});

test('busca vazia não devolve nada e o limite é respeitado', () => {
    assert.deepEqual(buscar(preparado, '   '), []);
    assert.equal(buscar(preparado, 'rdo', { limite: 1 }).length, 1);
});

test('texto: negrito, link para artigo e lista', () => {
    const blocos = lerTexto('Toque em **Salvar**.\n- veja [o cadastro](artigo:cadastrar-colaborador)\n- fim');
    assert.equal(blocos.length, 2);
    assert.deepEqual(blocos[0], {
        tipo: 'paragrafo',
        pedacos: [
            { tipo: 'texto', texto: 'Toque em ', negrito: false },
            { tipo: 'texto', texto: 'Salvar', negrito: true },
            { tipo: 'texto', texto: '.', negrito: false },
        ],
    });
    assert.equal(blocos[1].tipo, 'lista');
    assert.equal(blocos[1].itens.length, 2);
    assert.deepEqual(blocos[1].itens[0][1], { tipo: 'link', texto: 'o cadastro', id: 'cadastrar-colaborador', negrito: false });
});

test('texto: nada vira HTML nem link de fora', () => {
    const [p] = lerTexto('<img src=x onerror=alert(1)> [clique](https://site.com) [ok](artigo:Maiuscula)');
    assert.ok(p.pedacos.every((x) => x.tipo === 'texto'));
    assert.equal(p.pedacos.map((x) => x.texto).join(''), '<img src=x onerror=alert(1)> [clique](https://site.com) ok');
});

test('texto: "**" sem par aparece como texto', () => {
    const pedacos = lerLinha('a **b** c **d');
    assert.deepEqual(pedacos.map((x) => [x.texto, x.negrito]), [['a ', false], ['b', true], [' c **d', false]]);
});

test('idiomas: ida e volta entre o site e a Central', () => {
    for (const i of IDIOMAS_AJUDA) assert.equal(idiomaDaAjuda(idiomaDoSite(i)), i);
    assert.equal(idiomaDaAjuda('pt'), 'pt-BR');
    assert.equal(idiomaDaAjuda('es'), 'es-ES');
    assert.equal(idiomaDaAjuda('en-NZ'), 'en-US');
    assert.equal(idiomaDaAjuda('fr'), 'pt-BR');
    assert.equal(idiomaDaAjuda(undefined), 'pt-BR');
});
