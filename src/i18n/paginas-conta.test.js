// Testes das páginas que vieram do WordPress (volta do pagamento, Perfil e Suporte): endereços em cada
// idioma, endereços antigos da Stripe e dos e-mails, escolha do idioma e a regra do .htaccess.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    COMPRAS, IDIOMAS, PAGINAS_ANTIGAS, analisarCaminho, caminhoDoAntigo, caminhoPagamento, caminhoPerfil,
    caminhoSuporte, consultaQueSegue, escolherIdioma, idioma,
} from './idiomas.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PALAVRA = /^[\p{Ll}\p{Lo}\p{N}]+(?:-[\p{Ll}\p{Lo}\p{N}]+)*$/u;
const ANTIGOS = ['/primeiros-passos', '/pagamento-ok', '/pacote-downloads-extras', '/expansao-20gb-ok', '/perfil', '/suporte'];

test('endereços das páginas em cada idioma', () => {
    assert.equal(caminhoPagamento('pt-BR', 'pro'), '/pt-br/pagamento-confirmado/pro');
    assert.equal(caminhoPagamento('pt-BR', 'acesso'), '/pt-br/pagamento-confirmado/acesso-cliente');
    assert.equal(caminhoPagamento('pt-PT', 'downloads'), '/pt-pt/pagamento-confirmado/transferencias-extra');
    assert.equal(caminhoPagamento('pt-PT', 'armazenamento'), '/pt-pt/pagamento-confirmado/mais-20-gb');
    assert.equal(caminhoPagamento('en-US', 'downloads'), '/en-us/payment-confirmed/extra-downloads');
    assert.equal(caminhoPagamento('en-GB', 'armazenamento'), '/en-gb/payment-confirmed/plus-20-gb');
    assert.equal(caminhoPagamento('es-MX', 'acesso'), '/es-mx/pago-confirmado/acceso-cliente');
    assert.equal(caminhoPagamento('es-ES'), '/es-es/pago-confirmado');
    assert.equal(caminhoPagamento('en-CA', null), '/en-ca/payment-confirmed');
    assert.throws(() => caminhoPagamento('pt-BR', 'outra'));
    assert.equal(caminhoPerfil('pt-BR'), '/pt-br/perfil');
    assert.equal(caminhoPerfil('en-AU'), '/en-au/profile');
    assert.equal(caminhoPerfil('es-MX'), '/es-mx/perfil');
    assert.equal(caminhoSuporte('pt-BR'), '/pt-br/suporte');
    assert.equal(caminhoSuporte('pt-PT'), '/pt-pt/apoio');
    assert.equal(caminhoSuporte('en-US'), '/en-us/support');
    assert.equal(caminhoSuporte('es-ES'), '/es-es/soporte');
});

test('leitura dos endereços no idioma', () => {
    for (const i of IDIOMAS) {
        for (const compra of [...COMPRAS, null]) {
            assert.deepEqual(
                analisarCaminho(caminhoPagamento(i.codigo, compra)),
                { tipo: 'pagina', codigo: i.codigo, pagina: 'pagamento', compra, canonico: null },
                `${i.codigo} ${compra}`,
            );
        }
        assert.deepEqual(analisarCaminho(caminhoPerfil(i.codigo)), { tipo: 'pagina', codigo: i.codigo, pagina: 'perfil', canonico: null });
        assert.deepEqual(analisarCaminho(caminhoSuporte(i.codigo)), { tipo: 'pagina', codigo: i.codigo, pagina: 'suporte', canonico: null });
    }
    assert.equal(analisarCaminho('/pt-br/suporte/').canonico, null);
    assert.equal(analisarCaminho('/pt-br/suporte/outra').pagina, 'nao-encontrado');
    assert.equal(analisarCaminho('/pt-br/perfil/x').pagina, 'nao-encontrado');
    assert.equal(analisarCaminho('/pt-br/pagamento-confirmado/pro/x').pagina, 'nao-encontrado');
});

test('palavra de outro idioma ou grafia diferente vai para o endereço certo', () => {
    assert.equal(analisarCaminho('/en-us/suporte').canonico, '/en-us/support');
    assert.equal(analisarCaminho('/pt-pt/suporte').canonico, '/pt-pt/apoio');
    assert.equal(analisarCaminho('/es-mx/profile').canonico, '/es-mx/perfil');
    assert.equal(analisarCaminho('/PT-BR/Perfil').canonico, '/pt-br/perfil');
    assert.equal(analisarCaminho('/en-us/pagamento-confirmado/acesso-cliente').canonico, '/en-us/payment-confirmed/client-access');
    assert.equal(analisarCaminho('/es-es/payment-confirmed/plus-20-gb').canonico, '/es-es/pago-confirmado/mas-20-gb');
    assert.equal(analisarCaminho('/pt-pt/pagamento-confirmado/downloads-extras').canonico, '/pt-pt/pagamento-confirmado/transferencias-extra');
    // Compra desconhecida: o texto geral, no endereço sem a compra.
    const desconhecida = analisarCaminho('/pt-br/pagamento-confirmado/qualquer');
    assert.equal(desconhecida.compra, null);
    assert.equal(desconhecida.canonico, '/pt-br/pagamento-confirmado');
});

test('endereços antigos do WordPress (Stripe e e-mails) são lidos com e sem barra', () => {
    const esperado = {
        '/primeiros-passos': { pagina: 'pagamento', compra: 'pro' },
        '/pagamento-ok': { pagina: 'pagamento', compra: 'acesso' },
        '/pacote-downloads-extras': { pagina: 'pagamento', compra: 'downloads' },
        '/expansao-20gb-ok': { pagina: 'pagamento', compra: 'armazenamento' },
        '/perfil': { pagina: 'perfil' },
        '/suporte': { pagina: 'suporte' },
    };
    for (const [url, dados] of Object.entries(esperado)) {
        for (const variacao of [url, `${url}/`, url.toUpperCase()]) {
            assert.deepEqual(analisarCaminho(variacao), { tipo: 'antigo', codigo: null, ...dados }, variacao);
        }
    }
    assert.equal(analisarCaminho('/perfil/outra').tipo, 'desconhecido');
    assert.equal(analisarCaminho('/pagamento-ok/x').tipo, 'desconhecido');
    assert.equal(analisarCaminho('/constructor').tipo, 'desconhecido');
});

test('endereço antigo abre a página no idioma do navegador', () => {
    const destino = (url, navegador) => caminhoDoAntigo(analisarCaminho(url), escolherIdioma(navegador));
    assert.equal(destino('/primeiros-passos', ['pt-BR', 'pt']), '/pt-br/pagamento-confirmado/pro');
    assert.equal(destino('/pagamento-ok/', ['pt-PT']), '/pt-pt/pagamento-confirmado/acesso-cliente');
    assert.equal(destino('/pacote-downloads-extras/', ['es-AR', 'es']), '/es-mx/pago-confirmado/descargas-extra');
    assert.equal(destino('/expansao-20gb-ok/', ['es']), '/es-es/pago-confirmado/mas-20-gb');
    assert.equal(destino('/perfil', ['en-GB']), '/en-gb/profile');
    assert.equal(destino('/perfil', ['de-DE']), '/en-us/profile');
    assert.equal(destino('/suporte/', ['pt-AO']), '/pt-pt/apoio');
    assert.equal(destino('/suporte/', []), '/en-us/support');
    // Os endereços antigos de antes continuam iguais.
    assert.equal(destino('/termos-de-uso/', ['pt-BR']), '/pt-br/termos-de-uso');
    assert.equal(destino('/ajuda/criar-rdo', ['en-US']), '/en-us/help/criar-rdo');
});

test('a volta do pagamento e o Perfil não levam a consulta adiante; os outros mantêm', () => {
    assert.equal(consultaQueSegue(analisarCaminho('/pagamento-ok/'), '?session_id=cs_live_x'), '');
    assert.equal(consultaQueSegue(analisarCaminho('/primeiros-passos'), '?session_id=cs_live_x'), '');
    assert.equal(consultaQueSegue(analisarCaminho('/perfil'), '?utm_source=email'), '');
    assert.equal(consultaQueSegue(analisarCaminho('/suporte/'), '?utm_source=x'), '?utm_source=x');
    assert.equal(consultaQueSegue(analisarCaminho('/termos-de-uso/'), '?gclid=1'), '?gclid=1');
    assert.equal(consultaQueSegue(analisarCaminho('/ajuda'), ''), '');
});

test('cadastro: palavras dos endereços das páginas completas, válidas e sem repetir entre páginas', () => {
    const dono = new Map();
    const marcar = (palavra, pagina, onde) => {
        assert.ok(palavra, `${onde}: falta a palavra`);
        assert.match(palavra, PALAVRA, `${onde}: "${palavra}"`);
        assert.ok(!idioma(palavra), `${onde}: "${palavra}" parece código de idioma`);
        const anterior = dono.get(palavra);
        assert.ok(!anterior || anterior === pagina, `${onde}: "${palavra}" já é a palavra de ${anterior}`);
        dono.set(palavra, pagina);
    };
    for (const i of IDIOMAS) {
        for (const pagina of ['ajuda', 'termos', 'privacidade', 'pagamento', 'perfil', 'suporte']) {
            marcar(i.rotas[pagina], pagina, `${i.codigo} rotas.${pagina}`);
        }
    }
    const donoCompra = new Map();
    for (const i of IDIOMAS) {
        assert.deepEqual(Object.keys(i.rotas.compras).sort(), [...COMPRAS].sort(), `${i.codigo}: compras`);
        for (const compra of COMPRAS) {
            const palavra = i.rotas.compras[compra];
            assert.match(palavra, PALAVRA, `${i.codigo} rotas.compras.${compra}`);
            const anterior = donoCompra.get(palavra);
            assert.ok(!anterior || anterior === compra, `${i.codigo}: "${palavra}" já é a palavra da compra ${anterior}`);
            donoCompra.set(palavra, compra);
        }
    }
    // Endereço antigo não pode ser palavra de outra página (ex.: "suporte" é a palavra do Suporte).
    for (const [antigo, dados] of Object.entries(PAGINAS_ANTIGAS)) {
        const outro = dono.get(antigo);
        assert.ok(!outro || outro === dados.pagina, `endereço antigo /${antigo} é palavra de ${outro}`);
        assert.ok(!/^[a-z]{2}(-[a-z]{2})?$/.test(antigo), `endereço antigo /${antigo} parece idioma`);
    }
});

test('.htaccess leva os endereços antigos (301) à página no idioma, com e sem barra no fim', () => {
    const htaccess = fs.readFileSync(path.join(RAIZ, 'hospedagem', '.htaccess'), 'utf8');
    // Regras do bloco gerado (ferramentas/hospedagem/htaccess.mjs): RewriteRule ^<antigo>/?$ <destino> [NC,R=301,...]
    const regras = htaccess.split('\n').filter((l) => /^RewriteRule \^[a-z0-9\\-]+\/\?\$ \/[a-z]{2}-[a-z]{2}\//.test(l) && l.includes('R=301'));
    for (const url of ANTIGOS) {
        const daPagina = regras.filter((l) => new RegExp(l.split(/\s+/)[1], 'i').test(url.slice(1)));
        assert.equal(daPagina.length, IDIOMAS.length, `${url}: uma regra por idioma`);
        for (const l of daPagina) {
            const [, padrao, destino] = l.split(/\s+/);
            const regra = new RegExp(padrao, 'i');
            // No .htaccess o caminho chega sem a barra do começo.
            assert.ok(regra.test(`${url.slice(1)}/`), `${url}/`);
            assert.ok(!regra.test(`${url.slice(1)}/outra`));
            const lido = analisarCaminho(destino.replace(/\?$/, ''));
            assert.equal(lido.tipo, 'pagina', destino);
            assert.equal(lido.canonico, null, `${destino} já é o endereço certo`);
            const antigo = PAGINAS_ANTIGAS[url.slice(1)];
            assert.equal(lido.pagina, antigo.pagina, destino);
            // A volta do pagamento e o Perfil descartam o ?session_id; o Suporte mantém o ?utm_.
            assert.equal(destino.endsWith('?'), consultaQueSegue(antigo, '?x=1') === '', destino);
        }
    }
});

test('verificar.mjs confere cada endereço antigo no ar', () => {
    const verificar = fs.readFileSync(path.join(RAIZ, 'hospedagem', 'verificar.mjs'), 'utf8');
    for (const url of ANTIGOS) assert.ok(verificar.includes(`'${url}'`), url);
});
