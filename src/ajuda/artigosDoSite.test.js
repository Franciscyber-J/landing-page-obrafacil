// Artigos da Central apontados pelas páginas do site (Suporte, Perfil e volta do pagamento): o link sai com o
// endereço do artigo no idioma da página, e nenhuma página usa um id fora da lista que o build confere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTIGOS_DO_SITE, caminhoDoArtigoDoSite, enderecosDosArtigosDoSite } from './artigosDoSite.js';
import { definirDadosIniciais } from '../dadosIniciais.js';

const CONTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'components', 'conta');
const INDICE_FR = { artigos: ARTIGOS_DO_SITE.map((id) => ({ id, slug: `fr-${id}` })) };

test('build: endereços dos artigos no idioma e os que faltam', () => {
    const { enderecos, faltando } = enderecosDosArtigosDoSite(INDICE_FR, 'fr-FR');
    assert.equal(enderecos.idioma, 'fr-FR');
    assert.deepEqual(Object.keys(enderecos.slugs).sort(), [...ARTIGOS_DO_SITE].sort());
    assert.equal(enderecos.slugs['cancelar-assinatura'], 'fr-cancelar-assinatura');
    assert.deepEqual(faltando, []);
    const semUm = { artigos: INDICE_FR.artigos.filter((a) => a.id !== 'abrir-chamado') };
    assert.deepEqual(enderecosDosArtigosDoSite(semUm, 'fr-FR').faltando, ['abrir-chamado']);
    assert.deepEqual(enderecosDosArtigosDoSite(null, 'fr-FR').faltando, ARTIGOS_DO_SITE);
});

test('página pronta: o link leva ao endereço do artigo no idioma; sem os dados do build, ao id', () => {
    try {
        definirDadosIniciais({ ajuda: { enderecos: enderecosDosArtigosDoSite(INDICE_FR, 'fr-FR').enderecos } });
        assert.equal(caminhoDoArtigoDoSite('fr-FR', 'cancelar-assinatura'), '/fr-fr/aide/fr-cancelar-assinatura');
        // Trocou de idioma sem recarregar: os endereços guardados são do francês, não servem para o alemão.
        assert.equal(caminhoDoArtigoDoSite('de-DE', 'cancelar-assinatura'), '/de-de/hilfe/cancelar-assinatura');
        definirDadosIniciais({ ajuda: { enderecos: { idioma: 'fr-FR', slugs: {} } } });
        assert.equal(caminhoDoArtigoDoSite('fr-FR', 'abrir-chamado'), '/fr-fr/aide/abrir-chamado');
        definirDadosIniciais(null);
        assert.equal(caminhoDoArtigoDoSite('pt-BR', 'abrir-chamado'), '/pt-br/ajuda/abrir-chamado');
        assert.throws(() => caminhoDoArtigoDoSite('pt-BR', 'artigo-fora-da-lista'), /ARTIGOS_DO_SITE/);
    } finally {
        definirDadosIniciais(null);
    }
});

test('as páginas da conta só apontam artigos da lista, e sempre por caminhoDoArtigoDoSite', () => {
    const usados = new Set();
    for (const nome of fs.readdirSync(CONTA).filter((n) => n.endsWith('.jsx'))) {
        const codigo = fs.readFileSync(path.join(CONTA, nome), 'utf8');
        assert.ok(!/caminhoArtigo\(/.test(codigo), `${nome}: link de artigo montado com caminhoArtigo (use caminhoDoArtigoDoSite)`);
        for (const m of codigo.matchAll(/caminhoDoArtigoDoSite\(codigo, '([^']+)'\)/g)) usados.add(m[1]);
        for (const m of codigo.matchAll(/\{ id: '([^']+)', texto:/g)) usados.add(m[1]);
        const mapa = /const ARTIGO = \{([\s\S]*?)\};/.exec(codigo);
        if (mapa) for (const m of mapa[1].matchAll(/: '([^']+)'/g)) usados.add(m[1]);
    }
    assert.ok(usados.size >= 8, `ids achados nas páginas: ${[...usados].join(', ')}`);
    for (const id of usados) assert.ok(ARTIGOS_DO_SITE.includes(id), `${id} não está em ARTIGOS_DO_SITE`);
    for (const id of ARTIGOS_DO_SITE) assert.ok(usados.has(id), `${id} está em ARTIGOS_DO_SITE mas nenhuma página usa`);
});
