// Modelos grátis: dados copiados do app em todos os idiomas, endereços, papel e textos do app com campos em branco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDIOMAS, analisarCaminho, caminhoModelo, caminhoModelos, palavraDeEnderecoValida } from '../i18n/idiomas.js';
import {
    CAMPOS_DO_DIARIO, DIARIO, SECOES, caminhoDoPdf, contagem, gruposComModelos, itensPorSecao, modeloPeloSlug,
    modelosDoIdioma, nomeDoArquivo, papelDoIdioma, partesDoTexto, problemasDoIdioma, rotuloDoApp, textoDoApp,
} from './modelos.js';
import { CHAVES_DO_APP, montarIdioma } from '../../ferramentas/modelos/copiar.mjs';

const PASTA = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dados');
const dadosDe = (codigo) => JSON.parse(fs.readFileSync(path.join(PASTA, `${codigo}.json`), 'utf8'));

test('cada idioma do site tem os 27 modelos do app, com endereços únicos e na regra', () => {
    for (const { codigo } of IDIOMAS) {
        const dados = dadosDe(codigo);
        assert.equal(dados.idioma, codigo);
        assert.deepEqual(problemasDoIdioma(dados, codigo, palavraDeEnderecoValida), [], codigo);
        assert.equal(modelosDoIdioma(dados, codigo).length, 28, codigo);
        for (const chave of CHAVES_DO_APP) assert.equal(typeof dados.app[chave], 'string', `${codigo}: ${chave}`);
        for (const campo of CAMPOS_DO_DIARIO) {
            assert.ok(rotuloDoApp(dados, campo.rotulo), `${codigo}: ${campo.rotulo}`);
            for (const o of campo.opcoes ?? []) assert.ok(textoDoApp(dados, o), `${codigo}: ${o}`);
        }
    }
});

test('todos os idiomas têm os mesmos modelos, na mesma ordem e com os mesmos itens', () => {
    const referencia = dadosDe('pt-BR').biblioteca.modelos.map((m) => `${m.id}:${m.itens.map((i) => i.codigo).join(',')}`);
    for (const { codigo } of IDIOMAS) {
        assert.deepEqual(dadosDe(codigo).biblioteca.modelos.map((m) => `${m.id}:${m.itens.map((i) => i.codigo).join(',')}`), referencia, codigo);
    }
});

test('a cópia dos dados registra de onde veio (commit do app)', () => {
    const origem = JSON.parse(fs.readFileSync(path.join(PASTA, 'origem.json'), 'utf8'));
    assert.match(origem.commit, /^[0-9a-f]{40}$/);
});

test('endereços dos modelos: lista, checklist, diário e a palavra de outro idioma', () => {
    const dados = dadosDe('pt-BR');
    const alvenaria = modelosDoIdioma(dados, 'pt-BR').find((m) => m.id === 'alvenaria_estrutural');
    assert.equal(caminhoModelos('pt-BR'), '/pt-br/modelos-gratis');
    assert.equal(caminhoModelo('pt-BR', alvenaria.slug), '/pt-br/modelos-gratis/alvenaria-estrutural');
    assert.deepEqual(analisarCaminho('/pt-br/modelos-gratis'), { tipo: 'pagina', codigo: 'pt-BR', pagina: 'modelos', canonico: null });
    assert.deepEqual(analisarCaminho('/pt-br/modelos-gratis/alvenaria-estrutural'), {
        tipo: 'pagina', codigo: 'pt-BR', pagina: 'modelo', slug: 'alvenaria-estrutural', canonico: null,
    });
    // Palavra dos modelos de outro idioma: o endereço certo do idioma.
    assert.equal(analisarCaminho('/pt-br/free-templates').canonico, '/pt-br/modelos-gratis');
    // O diário com a palavra de outro idioma: a palavra do idioma da página.
    assert.equal(analisarCaminho('/en-gb/free-templates/construction-daily-report').canonico, '/en-gb/free-templates/site-diary');
    assert.equal(analisarCaminho('/en-gb/free-templates/site-diary').canonico, null);
    assert.equal(analisarCaminho('/pt-br/modelos-gratis/a/b').pagina, 'nao-encontrado');
    // Escrita do idioma no endereço (o navegador manda com %XX).
    const ja = modelosDoIdioma(dadosDe('ja-JP'), 'ja-JP')[1];
    const lido = analisarCaminho(new URL(caminhoModelo('ja-JP', ja.slug), 'https://x').pathname);
    assert.equal(lido.pagina, 'modelo');
    assert.equal(modeloPeloSlug(dadosDe('ja-JP'), 'ja-JP', lido.slug).id, ja.id);
});

test('nenhum endereço de modelo é o do diário de outro idioma (o site leria como diário)', () => {
    const palavrasDoDiario = new Set(IDIOMAS.map((i) => i.rotas.diario));
    for (const { codigo } of IDIOMAS) {
        for (const m of modelosDoIdioma(dadosDe(codigo), codigo)) {
            if (m.id !== DIARIO) assert.ok(!palavrasDoDiario.has(m.slug), `${codigo}: ${m.slug}`);
        }
    }
});

test('papel do PDF: Carta nos EUA, no Canadá e no México (como o app); A4 nos outros', () => {
    assert.equal(papelDoIdioma('en-US'), 'carta');
    assert.equal(papelDoIdioma('en-CA'), 'carta');
    assert.equal(papelDoIdioma('es-MX'), 'carta');
    for (const c of ['pt-BR', 'pt-PT', 'en-GB', 'en-AU', 'es-ES', 'ja-JP', 'ar-SA']) assert.equal(papelDoIdioma(c), 'a4', c);
});

test('PDF: endereço fora das pastas das páginas e nome do arquivo salvo', () => {
    assert.equal(caminhoDoPdf('pt-BR', 'alvenaria-estrutural'), '/modelos-pdf/pt-br/alvenaria-estrutural.pdf');
    assert.equal(nomeDoArquivo('Portas: batente/porta'), 'Portas batente porta - ObraFácil.pdf');
});

test('itens por seção na ordem do app, numerados como na ficha', () => {
    const dados = dadosDe('pt-BR');
    for (const m of modelosDoIdioma(dados, 'pt-BR').filter((x) => x.tipo === 'checklist')) {
        const secoes = itensPorSecao(m);
        const ordem = SECOES.map((s) => s.codigo);
        assert.deepEqual(secoes.map((s) => s.codigo), ordem.filter((c) => secoes.some((s) => s.codigo === c)));
        assert.deepEqual(secoes.flatMap((s) => s.itens.map((i) => i.numero)), m.itens.map((_, n) => n + 1));
        const c = contagem(m);
        assert.equal(c.itens, m.itens.length);
    }
    assert.equal(gruposComModelos(dados, 'pt-BR').reduce((s, g) => s + g.modelos.length, 0), 27);
});

test('texto do app com campos em branco', () => {
    const dados = { app: { a: 'Data: {date} | cliente: {client}', b: '{numero}ª reinspeção em {quando}: {resultado} ({por})', c: 'Clima: {weather}', d: 'Fiziki ilerleme: %{progress}' } };
    assert.deepEqual(partesDoTexto(dados, 'a'), [{ texto: 'Data: ' }, { branco: 'date' }, { texto: ' | cliente: ' }, { branco: 'client' }]);
    assert.deepEqual(partesDoTexto(dados, 'b', { numero: 1 }), [
        { texto: '1ª reinspeção em ' }, { branco: 'quando' }, { texto: ': ' }, { branco: 'resultado' }, { texto: ' (' }, { branco: 'por' }, { texto: ')' },
    ]);
    assert.equal(rotuloDoApp(dados, 'c'), 'Clima');
    assert.equal(rotuloDoApp(dados, 'd'), 'Fiziki ilerleme');
    assert.throws(() => textoDoApp(dados, 'nao-existe'));
});

test('a cópia do app para quando falta texto num idioma (nada é inventado)', () => {
    const estrutura = { versao: 1, grupos: ['g'], modelos: [{ servico: 's', grupo: 'g', itens: [{ codigo: 'a1', secao: 'A' }, { codigo: 'd1', secao: 'D' }] }] };
    const textos = { grupos: { g: 'Grupo' }, nota_da_biblioteca: 'Nota', criterio_padrao: 'Critério', modelos: { s: { nome: 'Serviço', itens: { a1: 'Item' } } } };
    const erros = [];
    montarIdioma({ estrutura, textos, arb: {}, codigo: 'xx-XX', erros });
    assert.ok(erros.some((e) => e.includes('item d1 sem texto')));
    assert.ok(erros.some((e) => e.includes('checklistPdfTitulo')));
});

test('o mapa de endereços (troca de idioma na página do modelo) bate com os nomes dos modelos', () => {
    const enderecos = JSON.parse(fs.readFileSync(path.join(PASTA, 'enderecos.json'), 'utf8'));
    for (const { codigo } of IDIOMAS) {
        for (const m of modelosDoIdioma(dadosDe(codigo), codigo)) {
            if (m.id !== DIARIO) assert.equal(enderecos[m.id]?.[codigo], m.slug, `${codigo}: ${m.id}`);
        }
    }
});

test('o aviso de responsabilidade técnica está escrito em cada idioma (título, texto e a linha do PDF)', () => {
    const TEXTOS = path.join(PASTA, '..', '..', 'i18n', 'textos');
    for (const i of IDIOMAS) {
        const aviso = JSON.parse(fs.readFileSync(path.join(TEXTOS, `${i.codigo}.json`), 'utf8')).modelos?.aviso ?? {};
        const daBase = i.base ? JSON.parse(fs.readFileSync(path.join(TEXTOS, `${i.base}.json`), 'utf8')).modelos.aviso : {};
        for (const campo of ['titulo', 'texto', 'pdf']) {
            const valor = aviso[campo] ?? daBase[campo];
            assert.ok(typeof valor === 'string' && valor.trim().length > 1, `${i.codigo}: modelos.aviso.${campo}`);
        }
    }
});
