// Endereços antigos da Central (src/ajuda/antigos.js): a lista, o que o site faz com eles e a conferência do build.
// Rodar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ARTIGOS_RETIRADOS, ASSUNTOS_RENOMEADOS, artigoRetirado, assuntoRenomeado, caminhoDoAssuntoAntigo, caminhoDoAssuntoNovo,
    caminhosDoArtigoRetirado, conferirEnderecosAntigos,
} from './antigos.js';
import { IDIOMAS_AJUDA } from './idiomas.js';
import { acharModulo, slugDoModulo } from './enderecos.js';
import { palavraDeEnderecoValida, slugDoTexto } from '../i18n/idiomas.js';

const ANTES_DA_2_0 = ['pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX'];

test('antigos: só idiomas que estiveram no ar, endereços válidos e sem repetição', () => {
    const vistos = new Set();
    for (const a of ASSUNTOS_RENOMEADOS) {
        assert.ok(ANTES_DA_2_0.includes(a.idioma) && IDIOMAS_AJUDA.includes(a.idioma), a.idioma);
        assert.ok(palavraDeEnderecoValida(a.antigo) && palavraDeEnderecoValida(a.novo), `${a.antigo} → ${a.novo}`);
        assert.notEqual(a.antigo, a.novo);
        const chave = `${a.idioma}:${a.antigo}`;
        assert.ok(!vistos.has(chave), chave);
        vistos.add(chave);
    }
    // O módulo de cálculos nos 7 idiomas que já estavam no ar, e o diário no es-ES.
    assert.equal(ASSUNTOS_RENOMEADOS.filter((a) => a.modulo === 'calculos').length, 7);
    assert.equal(caminhoDoAssuntoAntigo(ASSUNTOS_RENOMEADOS.find((a) => a.idioma === 'en-GB')), '/en-gb/help/topic/calculators-and-estimates');
    assert.equal(caminhoDoAssuntoNovo(ASSUNTOS_RENOMEADOS.find((a) => a.idioma === 'en-GB')), '/en-gb/help/topic/calculators');
    assert.equal(caminhoDoAssuntoNovo(ASSUNTOS_RENOMEADOS.find((a) => a.modulo === 'diario-de-obra')), '/es-es/ayuda/tema/partes-diarios');
    // O nome novo é o do módulo publicado, pela mesma regra do endereço.
    assert.equal(slugDoTexto('Calculators'), 'calculators');
    assert.equal(slugDoTexto('Calculadoras'), 'calculadoras');
    assert.equal(slugDoTexto('Partes diarios'), 'partes-diarios');

    // 7 artigos × 7 idiomas, cada um com o slug que esteve no ar e o id.
    assert.equal(ARTIGOS_RETIRADOS.length, 49);
    for (const a of ARTIGOS_RETIRADOS) {
        assert.ok(ANTES_DA_2_0.includes(a.idioma), a.idioma);
        assert.ok(a.enderecos.includes(a.id));
        for (const e of a.enderecos) assert.ok(palavraDeEnderecoValida(e), e);
    }
    assert.deepEqual(caminhosDoArtigoRetirado(ARTIGOS_RETIRADOS.find((a) => a.idioma === 'en-US' && a.id === 'estimativa-cub')),
        ['/en-us/help/cub-cost-estimate', '/en-us/help/estimativa-cub']);
    assert.deepEqual(caminhosDoArtigoRetirado(ARTIGOS_RETIRADOS.find((a) => a.idioma === 'pt-PT' && a.id === 'o-que-e-o-cub')),
        ['/pt-pt/ajuda/o-que-e-o-cub']);
});

test('antigos: o site acha o assunto pelo nome antigo e reconhece o artigo retirado', () => {
    assert.deepEqual(assuntoRenomeado('en-US', 'calculators-and-estimates'), { modulo: 'calculos', novo: 'calculators' });
    assert.equal(assuntoRenomeado('pt-BR', 'calculadoras-e-estimativas'), null, 'no pt-BR o nome não mudou');
    assert.equal(assuntoRenomeado('es-MX', 'reportes-diarios'), null, 'no es-MX o diário continua "Reportes diarios"');

    const modulos = [
        { id: 'calculos', nome: 'Calculators', nomes: { 'pt-BR': 'Calculadoras e estimativas', 'en-US': 'Calculators', 'es-ES': 'Calculadoras' } },
        { id: 'diario-de-obra', nome: 'Partes diarios', nomes: { 'pt-BR': 'Diário de Obra (RDO)', 'es-ES': 'Partes diarios', 'es-MX': 'Reportes diarios' } },
    ];
    assert.equal(acharModulo(modulos, 'calculators-and-estimates', 'en-US')?.id, 'calculos');
    // es-ES: "reportes-diarios" é o nome antigo do diário aqui, e também o nome dele no es-MX: dá o mesmo módulo.
    assert.equal(acharModulo(modulos, 'reportes-diarios', 'es-ES')?.id, 'diario-de-obra');
    assert.equal(acharModulo(modulos, 'calculadoras-y-estimaciones', 'es-ES')?.id, 'calculos');
    assert.equal(acharModulo(modulos, 'nada-disso', 'en-US'), null);

    assert.ok(artigoRetirado('en-US', 'cub-cost-estimate'));
    assert.ok(artigoRetirado('es-MX', 'calculadora-cub-no-aparece'));
    assert.ok(artigoRetirado('fr-FR', 'estimativa-cub'), 'o id, em qualquer idioma sem o artigo');
    assert.ok(!artigoRetirado('fr-FR', 'cub-cost-estimate'), 'o slug inglês nunca esteve no ar em francês');
    assert.ok(!artigoRetirado('en-US', 'create-daily-report'));
});

// Índice de exemplo de um idioma, já com os nomes novos.
function indice(idioma, { nomeCalculos = 'Calculators', artigos = [] } = {}) {
    return {
        idioma,
        modulos: [
            { id: 'calculos', nome: nomeCalculos, nomes: { [idioma]: nomeCalculos } },
            { id: 'diario-de-obra', nome: idioma === 'es-ES' ? 'Partes diarios' : 'Daily reports', nomes: { [idioma]: idioma === 'es-ES' ? 'Partes diarios' : 'Daily reports' } },
        ],
        artigos,
    };
}
const NOMES = { 'pt-PT': 'Calculadoras', 'es-ES': 'Calculadoras', 'es-MX': 'Calculadoras' };

function cenario() {
    const indices = {};
    const caminhos = new Set();
    for (const idioma of ANTES_DA_2_0) {
        indices[idioma] = indice(idioma, { nomeCalculos: NOMES[idioma] ?? 'Calculators' });
    }
    for (const a of ASSUNTOS_RENOMEADOS) caminhos.add(caminhoDoAssuntoNovo(a));
    caminhos.add('/en-us/help/create-daily-report');
    return { indices, caminhos };
}

test('antigos: o build aceita a lista quando ela bate com o que foi publicado', () => {
    const { indices, caminhos } = cenario();
    assert.deepEqual(conferirEnderecosAntigos({ indices, caminhos, slugDoModulo }), []);
    // Idioma sem índice (não publicado) não é conferido aqui: a falta dele para o build em outro lugar.
    assert.deepEqual(conferirEnderecosAntigos({ indices: {}, caminhos: new Set(), slugDoModulo }), []);
});

test('antigos: o build para quando a lista não bate com o que foi publicado', () => {
    {
        const { indices, caminhos } = cenario();
        indices['en-GB'] = indice('en-GB', { nomeCalculos: 'Calculators and tools' });
        caminhos.add('/en-gb/help/topic/calculators-and-tools');
        const p = conferirEnderecosAntigos({ indices, caminhos, slugDoModulo });
        assert.equal(p.length, 1);
        assert.match(p[0], /en-GB calculators-and-estimates: o endereço publicado é "calculators-and-tools"/);
    }
    {
        const { indices, caminhos } = cenario();
        caminhos.delete('/en-ca/help/topic/calculators');
        caminhos.add('/en-ca/help/topic/calculators-and-estimates');
        const p = conferirEnderecosAntigos({ indices, caminhos, slugDoModulo });
        assert.ok(p.some((x) => /en-CA .*não tem página/.test(x)));
        assert.ok(p.some((x) => /en-CA .*voltou a ser uma página/.test(x)));
    }
    {
        const { indices, caminhos } = cenario();
        indices['es-MX'].artigos.push({ id: 'estimativa-cub', slug: 'estimacion-cub', modulo: 'calculos' });
        caminhos.add('/es-mx/ayuda/estimacion-cub');
        const p = conferirEnderecosAntigos({ indices, caminhos, slugDoModulo });
        assert.ok(p.some((x) => /es-MX estimativa-cub: voltou a ser publicado/.test(x)));
        assert.ok(p.some((x) => /\/es-mx\/ayuda\/estimacion-cub é uma página que existe/.test(x)));
    }
    {
        const { indices, caminhos } = cenario();
        indices['pt-PT'].modulos = indices['pt-PT'].modulos.filter((m) => m.id !== 'calculos');
        assert.match(conferirEnderecosAntigos({ indices, caminhos, slugDoModulo }).join(), /pt-PT .*o módulo calculos não está publicado/);
    }
});
