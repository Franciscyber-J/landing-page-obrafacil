// Testes dos idiomas do site: cadeia de textos, escolha pelo navegador e endereços.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    IDIOMAS, analisarCaminho, cadeia, caminhoAjuda, caminhoArtigo, caminhoAssunto, caminhoInicio,
    escolherIdioma, idDaSecao, secaoDaAncora, slugDoTexto,
} from './idiomas.js';
import { acharModulo, criarRotas, slugDoModulo } from '../ajuda/enderecos.js';

test('cadastro: variante herda as palavras dos endereços da base', () => {
    const enGB = IDIOMAS.find((i) => i.codigo === 'en-GB');
    assert.equal(enGB.rotas.ajuda, 'help');
    assert.equal(enGB.rotas.secoes.precos, 'pricing');
    assert.equal(enGB.prefixo, 'en-gb');
});

test('cadeia: variante → base → inglês → português', () => {
    assert.deepEqual(cadeia('es-MX'), ['es-MX', 'es-ES', 'en-US', 'pt-BR']);
    assert.deepEqual(cadeia('pt-PT'), ['pt-PT', 'pt-BR', 'en-US']);
    assert.deepEqual(cadeia('pt-BR'), ['pt-BR', 'en-US']);
    assert.deepEqual(cadeia('en-US'), ['en-US', 'pt-BR']);
});

test('navegador: escolhe pelo idioma, pela região e pela ordem de preferência', () => {
    assert.equal(escolherIdioma(['pt-BR']), 'pt-BR');
    assert.equal(escolherIdioma(['pt']), 'pt-BR');
    assert.equal(escolherIdioma(['pt-AO']), 'pt-PT');
    assert.equal(escolherIdioma(['es-AR', 'en']), 'es-MX');
    assert.equal(escolherIdioma(['es']), 'es-ES');
    assert.equal(escolherIdioma(['en-NZ']), 'en-AU');
    assert.equal(escolherIdioma(['en-IE']), 'en-GB');
    assert.equal(escolherIdioma(['de-DE', 'en-GB']), 'en-GB');
    assert.equal(escolherIdioma(['de-DE']), 'en-US');
    assert.equal(escolherIdioma([]), 'en-US');
    assert.equal(escolherIdioma(['xx-!!', 'es-CO']), 'es-MX');
    // Valor antigo guardado pelo detector anterior.
    assert.equal(escolherIdioma(['es-MX', 'pt-BR']), 'es-MX');
});

test('endereços em cada idioma', () => {
    assert.equal(caminhoInicio('pt-BR'), '/pt-br/');
    assert.equal(caminhoInicio('en-GB', 'precos'), '/en-gb/#pricing');
    assert.equal(caminhoAjuda('es-MX'), '/es-mx/ayuda');
    assert.equal(caminhoAssunto('en-US', 'project-finances'), '/en-us/help/topic/project-finances');
    assert.equal(caminhoArtigo('pt-PT', 'criar-rdo'), '/pt-pt/ajuda/criar-rdo');
});

test('leitura do endereço', () => {
    assert.deepEqual(analisarCaminho('/'), { tipo: 'raiz' });
    assert.deepEqual(analisarCaminho('/xx-yy/'), { tipo: 'desconhecido' });
    assert.deepEqual(analisarCaminho('/pt-br/'), { tipo: 'pagina', codigo: 'pt-BR', pagina: 'inicio', canonico: null });
    assert.deepEqual(analisarCaminho('/en-us/help'), { tipo: 'pagina', codigo: 'en-US', pagina: 'ajuda', canonico: null });
    assert.deepEqual(
        analisarCaminho('/es-es/ayuda/tema/finanzas-de-la-obra'),
        { tipo: 'pagina', codigo: 'es-ES', pagina: 'assunto', modulo: 'finanzas-de-la-obra', canonico: null },
    );
    assert.deepEqual(
        analisarCaminho('/en-gb/help/create-daily-report'),
        { tipo: 'pagina', codigo: 'en-GB', pagina: 'artigo', slug: 'create-daily-report', canonico: null },
    );
    assert.equal(analisarCaminho('/pt-br/qualquer').pagina, 'nao-encontrado');
    assert.equal(analisarCaminho('/pt-br/ajuda/a/b/c').pagina, 'nao-encontrado');
});

test('grafia diferente vai para o endereço certo', () => {
    assert.equal(analisarCaminho('/PT-BR').canonico, '/pt-br/');
    assert.equal(analisarCaminho('/en-us/ajuda').canonico, '/en-us/help');
    assert.equal(analisarCaminho('/en-us/ajuda/assunto/obras').canonico, '/en-us/help/topic/obras');
    assert.equal(analisarCaminho('/es-ES/ayuda/crear-reporte').canonico, '/es-es/ayuda/crear-reporte');
});

test('endereços antigos da Central (/ajuda/pt-BR/...)', () => {
    assert.deepEqual(analisarCaminho('/ajuda'), { tipo: 'antigo', codigo: null, pagina: 'ajuda' });
    assert.deepEqual(analisarCaminho('/ajuda/en-GB'), { tipo: 'antigo', codigo: 'en-GB', pagina: 'ajuda' });
    assert.deepEqual(analisarCaminho('/ajuda/pt-BR/assunto/rdo'), { tipo: 'antigo', codigo: 'pt-BR', pagina: 'assunto', modulo: 'rdo' });
    assert.deepEqual(analisarCaminho('/ajuda/es-MX/crear-reporte'), { tipo: 'antigo', codigo: 'es-MX', pagina: 'artigo', slug: 'crear-reporte' });
    assert.deepEqual(analisarCaminho('/ajuda/criar-rdo'), { tipo: 'antigo', codigo: null, pagina: 'artigo', slug: 'criar-rdo' });
});

test('âncoras da página inicial em qualquer idioma', () => {
    assert.equal(secaoDaAncora('#precos'), 'precos');
    assert.equal(secaoDaAncora('#pricing'), 'precos');
    assert.equal(secaoDaAncora('#preguntas-frecuentes'), 'faq');
    assert.equal(secaoDaAncora('#nada'), null);
    assert.equal(secaoDaAncora(''), null);
    assert.equal(idDaSecao('es-MX', 'precos'), 'precios');
});

test('nome do assunto no endereço', () => {
    assert.equal(slugDoTexto('Diário de obra (RDO)'), 'diario-de-obra-rdo');
    assert.equal(slugDoTexto('Suministros y almacén'), 'suministros-y-almacen');
    assert.equal(slugDoTexto('Помощь и Тема'), 'помощь-и-тема');
    const financeiro = { id: 'financeiro', nome: 'Project finances', nomes: { 'pt-BR': 'Financeiro da obra', 'en-US': 'Project finances' } };
    assert.equal(slugDoModulo(financeiro, 'en-US'), 'project-finances');
    assert.equal(slugDoModulo(financeiro, 'pt-BR'), 'financeiro-da-obra');
    assert.equal(slugDoModulo({ id: 'obras', nome: 'Projects' }, 'en-US'), 'projects');
    const modulos = [financeiro, { id: 'obras', nome: 'Projects', nomes: { 'pt-BR': 'Obras', 'en-US': 'Projects' } }];
    assert.equal(acharModulo(modulos, 'project-finances', 'en-US'), financeiro);
    assert.equal(acharModulo(modulos, 'financeiro', 'en-US'), financeiro);
    assert.equal(acharModulo(modulos, 'financeiro-da-obra', 'en-US'), financeiro);
    assert.equal(acharModulo(modulos, 'nada', 'en-US'), null);
    assert.equal(criarRotas('en-GB').assunto(financeiro), '/en-gb/help/topic/project-finances');
});
