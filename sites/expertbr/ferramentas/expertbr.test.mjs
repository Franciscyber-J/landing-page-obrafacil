// Testes do site da ExpertBR (rodam no "npm test" da raiz e no "npm run expertbr:test").
// Também protegem o site da ExpertBR de mudanças no do ObraFácil: se uma chave de texto do ObraFácil que a página
// usa mudar de nome, o teste acusa aqui.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conferirTextos } from './idiomas.mjs';
import { ARQUIVO, blocoAtual, gerarBloco } from './htaccess.mjs';
import { conferirDist } from './conferir.mjs';
import { ESTADOS, PRODUTOS, arquivosDasTelas } from '../src/produtos.js';

const PASTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.resolve(PASTA, '..', '..');
const htaccess = fs.readFileSync(ARQUIVO, 'utf8');
const linhas = htaccess.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

test('textos dos 29 idiomas completos e coerentes (npm run expertbr:idiomas)', () => {
    assert.deepEqual(conferirTextos(), []);
});

test('aplicativos: dados completos; "em breve" sem link, sem lojas e fora dos dados estruturados', () => {
    const ids = new Set();
    for (const p of PRODUTOS) {
        assert.match(p.id, /^[a-z]+(-[a-z]+)*$/, p.id);
        assert.ok(!ids.has(p.id), `id repetido: ${p.id}`);
        ids.add(p.id);
        assert.ok(ESTADOS.includes(p.estado), `${p.id}: estado ${p.estado}`);
        // Decisão do Francis (20/11/2026): cada app num subdomínio do expertbr.com.
        assert.match(p.endereco, /^https:\/\/[a-z0-9-]+\.expertbr\.com$/, `${p.id}: endereço fora do padrão <app>.expertbr.com`);
        assert.ok(p.textos?.linha && p.textos?.descricao && p.textos?.destaques, `${p.id}: faltam textos`);
        if (p.simbolo) assert.ok(fs.existsSync(path.join(PASTA, 'public', p.simbolo.arquivo)), `${p.id}: símbolo ${p.simbolo.arquivo} não existe`);
        if (p.estado === 'no-ar') {
            assert.equal(typeof p.pagina, 'function', `${p.id}: no ar sem a página no idioma`);
            assert.ok(p.seo?.sistemas && p.seo?.categoria && p.seo?.descricao, `${p.id}: no ar sem os dados para o Google`);
        } else {
            assert.ok(!p.pagina && !p.lojas && !p.seo, `${p.id}: "em breve" não pode ter página, lojas nem dados para o Google`);
            assert.ok(p.textos.aviso, `${p.id}: "em breve" sem o aviso`);
        }
    }
    assert.ok(PRODUTOS.some((p) => p.estado === 'no-ar'), 'nenhum app no ar (a abertura precisa de um)');
    for (const t of arquivosDasTelas()) assert.ok(fs.existsSync(path.join(RAIZ, 'public', t)), `tela ${t} não existe`);
});

test('.htaccess: bloco dos idiomas em dia (senão: npm run expertbr:htaccess)', () => {
    assert.equal(blocoAtual(htaccess), gerarBloco());
});

test('.htaccess: nada vale para a pasta do ObraFácil (appobrafacil.expertbr.com)', () => {
    // 1. Todo cabeçalho só com a marca do expertbr.com.
    for (const l of linhas.filter((x) => /^Header\b/.test(x))) assert.match(l, /\senv=EXPERTBR(_VARIA)?$/, `cabeçalho sem env=EXPERTBR: ${l}`);
    // 2. Nada que valha para a pasta inteira sem a marca.
    for (const proibido of [/^Expires/i, /^ErrorDocument/i, /^DirectorySlash/i, /^<If\b/i, /^Redirect(Match|Permanent)?\b/i, /^php_/i, /^SetEnv\b/i, /^AddType/i, /^AddHandler/i, /^RewriteOptions/i]) {
        assert.ok(!linhas.some((l) => proibido.test(l)), `diretiva que vale para a pasta do ObraFácil: ${proibido}`);
    }
    // 3. A primeira regra de endereço encerra tudo para outro endereço que não o expertbr.com, e para /appobrafacil.
    const motor = linhas.indexOf('RewriteEngine On');
    assert.ok(motor >= 0);
    assert.equal(linhas[motor + 1], 'RewriteCond %{HTTP_HOST} !^(www\\.)?expertbr\\.com(:\\d+)?$ [NC]');
    assert.equal(linhas[motor + 2], 'RewriteRule ^ - [L]');
    assert.equal(linhas[motor + 3], 'RewriteRule ^appobrafacil(/|$) - [L,NC]');
    // 4. Variáveis com nome próprio: nenhuma das que o .htaccess do ObraFácil usa.
    const doObraFacil = fs.readFileSync(path.join(RAIZ, 'hospedagem', '.htaccess'), 'utf8');
    const usadas = (texto) => new Set([...texto.matchAll(/E=([A-Za-z_-]+):|ENV:([A-Za-z_-]+)|env=([A-Za-z_-]+)/g)].map((m) => m[1] ?? m[2] ?? m[3]));
    const nossas = usadas(htaccess);
    for (const v of usadas(doObraFacil)) {
        if (v === 'Cache-Control') continue; // variável do próprio servidor (cache), por pedido
        assert.ok(!nossas.has(v), `variável ${v} também é usada pelo .htaccess do ObraFácil`);
    }
    for (const v of nossas) assert.ok(v.startsWith('EXPERTBR') || v === 'Cache-Control', `variável sem o prefixo EXPERTBR: ${v}`);
});

test('.htaccess: o que vale para a pasta inteira é igual ao do ObraFácil', () => {
    const doObraFacil = fs.readFileSync(path.join(RAIZ, 'hospedagem', '.htaccess'), 'utf8');
    for (const d of ['DirectoryIndex index.html', 'AddDefaultCharset UTF-8']) {
        assert.ok(linhas.includes(d) && doObraFacil.includes(d), d);
    }
    assert.ok(linhas.includes('Options -Indexes -MultiViews') && doObraFacil.includes('Options -Indexes -MultiViews'));
});

test('dist (se já foi gerado): páginas prontas, sitemap, robots e llms.txt sem problema', (t) => {
    const dist = path.join(PASTA, 'dist');
    if (!fs.existsSync(path.join(dist, 'pt-br', 'index.html'))) {
        t.skip('sem dist: rode npm run expertbr:build (o build faz a mesma conferência)');
        return;
    }
    assert.deepEqual(conferirDist(dist).problemas, []);
});
