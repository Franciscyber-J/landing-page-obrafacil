#!/usr/bin/env node
// Confere o expertbr.com no ar (só leituras) e prova que o appobrafacil.expertbr.com não mudou com a troca.
//
//   node sites/expertbr/ferramentas/verificar.mjs
//       confere o expertbr.com: idiomas, raiz pelo idioma do navegador, redirecionamentos do WordPress que saiu,
//       410, cabeçalhos de segurança e cache, robots.txt, sitemap.xml e llms.txt.
//   node sites/expertbr/ferramentas/verificar.mjs --fotografar-obrafacil <arquivo.json>
//       ANTES da troca: guarda como o appobrafacil.expertbr.com responde hoje (status, destino e cabeçalhos de
//       uma lista de endereços).
//   node sites/expertbr/ferramentas/verificar.mjs --comparar-obrafacil <arquivo.json>
//       DEPOIS da troca: pede os mesmos endereços e acusa qualquer diferença.
//   --endereco http://127.0.0.1:8088   faz os pedidos nesse servidor, com o nome do site no cabeçalho Host (teste
//       num Apache local com as duas pastas; ver LEIAME.md, "Teste do .htaccess num Apache local").
// Sai com código 1 se alguma conferência falhar.

import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import process from 'node:process';
import { IDIOMAS, caminhoInicio } from '../src/idiomas.js';

const opcao = (nome) => {
    const i = process.argv.indexOf(nome);
    return i >= 0 ? process.argv[i + 1] : null;
};
const ENDERECO = opcao('--endereco');
const EXPERTBR = 'expertbr.com';
const OBRAFACIL = 'appobrafacil.expertbr.com';

// Pedido sem seguir redirecionamento, com o Host do site (no ar, o próprio endereço).
function pedir(host, caminho, { idioma = null } = {}) {
    const base = new URL(ENDERECO ?? `https://${host}`);
    const cliente = base.protocol === 'http:' ? http : https;
    return new Promise((resolver, falhar) => {
        const req = cliente.request({
            hostname: base.hostname, port: base.port || undefined, path: caminho, method: 'GET', servername: host,
            headers: { Host: host, 'User-Agent': 'ExpertBR-verificacao/1.0', ...(idioma ? { 'Accept-Language': idioma } : {}) },
        }, (res) => {
            let corpo = '';
            res.setEncoding('utf8');
            res.on('data', (d) => { corpo += d; });
            res.on('end', () => resolver({ status: res.statusCode, cabecalhos: res.headers, corpo, destino: res.headers.location ?? null }));
        });
        req.on('error', falhar);
        req.setTimeout(30000, () => req.destroy(new Error('tempo esgotado')));
        req.end();
    });
}

let falhas = 0;
function linha(ok, texto) {
    if (!ok) falhas += 1;
    console.log(`${ok ? 'OK   ' : 'FALHA'}  ${texto}`);
}

// Destino sem o esquema e o domínio quando é o próprio site (o Apache local responde http://expertbr.com/...).
const caminhoDo = (destino) => {
    if (!destino) return null;
    const u = new URL(destino, `https://${EXPERTBR}`);
    return u.hostname === EXPERTBR ? `${u.pathname}${u.search}` : u.href;
};

async function redireciona(nome, caminho, status, destino, opcoes) {
    const r = await pedir(EXPERTBR, caminho, opcoes);
    const chegou = caminhoDo(r.destino);
    linha(r.status === status && chegou === destino, `${nome}: ${caminho} → ${r.status} ${chegou ?? ''} (esperado ${status} ${destino})`);
    return r;
}

async function status(nome, caminho, esperado, host = EXPERTBR) {
    const r = await pedir(host, caminho);
    linha(r.status === esperado, `${nome}: ${caminho} → ${r.status} (esperado ${esperado})`);
    return r;
}

async function conferirExpertbr() {
    console.log(`\n== expertbr.com${ENDERECO ? ` (em ${ENDERECO})` : ''} ==`);
    for (const i of IDIOMAS) {
        const caminho = caminhoInicio(i.codigo);
        const r = await pedir(EXPERTBR, caminho);
        const canon = /<link rel="canonical" href="([^"]+)"/.exec(r.corpo)?.[1];
        const ok = r.status === 200 && canon === `https://${EXPERTBR}${caminho}` && r.corpo.includes(`<html lang="${i.codigo}"`)
            && /<h1[\s>]/.test(r.corpo) && r.corpo.includes('application/ld+json');
        linha(ok, `página ${caminho}: ${r.status}, canonical ${canon ?? 'ausente'}`);
        if (i.codigo === 'pt-BR') {
            const c = r.cabecalhos;
            linha(/default-src 'self'/.test(c['content-security-policy'] ?? ''), 'política de conteúdo (Content-Security-Policy) na página');
            linha(!!c['strict-transport-security'], 'HSTS na página');
            linha(c['x-content-type-options'] === 'nosniff', 'nosniff na página');
            linha(/no-cache/.test(c['cache-control'] ?? ''), `página sem cache longo (${c['cache-control'] ?? 'sem Cache-Control'})`);
            const css = /href="(\/assets\/[^"]+\.css)"/.exec(r.corpo)?.[1];
            if (css) {
                const a = await pedir(EXPERTBR, css);
                linha(a.status === 200 && /immutable/.test(a.cabecalhos['cache-control'] ?? ''), `CSS do build com cache longo (${css})`);
            }
        }
    }

    // Raiz pelo idioma do navegador (302, sem guardar).
    const casos = [['pt-BR,pt;q=0.9', '/pt-br/'], ['pt-AO', '/pt-pt/'], ['es-AR,es;q=0.9', '/es-mx/'], ['de-DE,de;q=0.9', '/de-de/'],
        ['ja', '/ja-jp/'], ['ar', '/ar-sa/'], ['zh-CN', '/zh-tw/'], ['eo', '/en-us/'], [null, '/en-us/']];
    for (const [idioma, destino] of casos) {
        const r = await redireciona(`raiz com ${idioma ?? 'nenhum idioma (robô)'}`, '/', 302, destino, { idioma });
        if (idioma === 'pt-BR,pt;q=0.9') {
            linha(/accept-language/i.test(r.cabecalhos.vary ?? '') && /no-cache/.test(r.cabecalhos['cache-control'] ?? ''), 'raiz: Vary: Accept-Language e sem cache');
        }
    }

    await redireciona('idioma em maiúsculas', '/PT-BR/', 301, '/pt-br/');
    await redireciona('idioma sem a barra', '/pt-br', 301, '/pt-br/');
    await redireciona('endereço dentro do idioma', '/pt-br/qualquer-coisa', 301, '/pt-br/');
    await redireciona('index.html do idioma', '/pt-br/index.html', 301, '/pt-br/');
    await redireciona('index.html da raiz', '/index.html', 301, '/');
    try {
        const www = await pedir(`www.${EXPERTBR}`, '/pt-br/');
        linha(www.status === 301 && www.destino === `https://${EXPERTBR}/pt-br/`, `www → sem www: ${www.status} ${www.destino ?? ''}`);
    } catch (erro) {
        // Sem DNS para o www (ou certificado só do domínio): não é falha do site, só fica anotado.
        console.log(`AVISO  www.${EXPERTBR} não respondeu (${erro.message}): conferir o DNS do www no hPanel`);
    }

    // WordPress que saiu.
    const OF = `https://${OBRAFACIL}`;
    await redireciona('artigo antigo', '/o-fim-da-desorganizacao-na-obra/', 301, `${OF}/pt-br/`);
    await redireciona('artigo antigo com data', '/2025/06/12/o-fim-da-desorganizacao-na-sua-obra/', 301, `${OF}/pt-br/`);
    await redireciona('artigo pelo número', '/?p=12', 301, `${OF}/pt-br/`);
    await redireciona('termos antigos', '/termos-de-uso/', 301, `${OF}/termos-de-uso`);
    await redireciona('privacidade antiga', '/politicas-de-privacidade/', 301, `${OF}/politicas-de-privacidade`);
    await redireciona('página antiga do WordPress', '/planos/', 301, `${OF}/`);
    await redireciona('mapa do site do WordPress', '/wp-sitemap.xml', 301, '/sitemap.xml');
    for (const caminho of ['/wp-admin/', '/wp-login.php', '/xmlrpc.php', '/feed/', '/wp-content/uploads/2025/06/foto.jpg', '/wp-json/wp/v2/posts', '/category/obras/', '/?s=obra']) {
        await status('parte do WordPress, removida de vez', caminho, 410);
    }
    await status('endereço que não existe', '/nao-existe', 404);
    await status('cópia de configuração', '/.htaccess.bk', 403);
    await status('validação de certificado passa direto (sem regra)', '/.well-known/acme-challenge/teste', 404);

    for (const [arquivo, contem] of [['/robots.txt', 'Sitemap: https://expertbr.com/sitemap.xml'], ['/sitemap.xml', '<urlset'], ['/llms.txt', '# ExpertBR']]) {
        const r = await pedir(EXPERTBR, arquivo);
        linha(r.status === 200 && r.corpo.includes(contem), `${arquivo}: ${r.status}`);
    }
}

// Endereços do ObraFácil fotografados antes e comparados depois. Cobrem página, raiz, endereços antigos, arquivos,
// 404 e 410: tudo o que um .htaccess da pasta de cima poderia mudar (cabeçalhos, cache, redirecionamentos).
export const ENDERECOS_DO_OBRAFACIL = [
    ['/', 'pt-BR,pt;q=0.9'], ['/', null], ['/pt-br/', null], ['/en-us/help', null], ['/pt-br/ajuda/criar-rdo', null],
    ['/termos-de-uso/', 'pt-BR'], ['/primeiros-passos', null], ['/PT-BR/ajuda', null], ['/index.html', null],
    ['/robots.txt', null], ['/sitemap.xml', null], ['/llms.txt', null], ['/tema.js', null], ['/logo.png', null],
    ['/download/Instalador_ObraFacil_Windows.exe', null], ['/nao-existe-xyz', null], ['/wp-admin/', null], ['/planos/', null],
];
// Cabeçalhos que mudam sozinhos a cada pedido (data, identificador do pedido na CDN, estado do cache da CDN).
const VARIAM = ['date', 'x-hcdn-request-id', 'x-hcdn-cache-status', 'x-hcdn-upstream-rt', 'age', 'alt-svc', 'set-cookie', 'connection', 'keep-alive', 'transfer-encoding', 'content-length', 'etag', 'last-modified', 'expires'];

async function fotografar() {
    const foto = {};
    for (const [caminho, idioma] of ENDERECOS_DO_OBRAFACIL) {
        const r = await pedir(OBRAFACIL, caminho, { idioma });
        const cabecalhos = Object.fromEntries(Object.entries(r.cabecalhos).filter(([k]) => !VARIAM.includes(k)).sort());
        foto[`${caminho} [${idioma ?? 'sem idioma'}]`] = { status: r.status, destino: r.destino, cabecalhos };
    }
    return foto;
}

async function principal() {
    const fotografarEm = opcao('--fotografar-obrafacil');
    const compararCom = opcao('--comparar-obrafacil');
    if (fotografarEm) {
        fs.writeFileSync(fotografarEm, JSON.stringify(await fotografar(), null, 2));
        console.log(`appobrafacil.expertbr.com fotografado em ${fotografarEm} (${ENDERECOS_DO_OBRAFACIL.length} endereços).`);
        return;
    }
    if (compararCom) {
        console.log('\n== appobrafacil.expertbr.com: igual a antes da troca? ==');
        const antes = JSON.parse(fs.readFileSync(compararCom, 'utf8'));
        const agora = await fotografar();
        for (const [chave, a] of Object.entries(antes)) {
            const b = agora[chave];
            const diferencas = [];
            if (a.status !== b.status) diferencas.push(`status ${a.status} → ${b.status}`);
            if (a.destino !== b.destino) diferencas.push(`destino ${a.destino} → ${b.destino}`);
            for (const nome of new Set([...Object.keys(a.cabecalhos), ...Object.keys(b.cabecalhos)])) {
                if (JSON.stringify(a.cabecalhos[nome]) !== JSON.stringify(b.cabecalhos[nome])) diferencas.push(`${nome}: ${a.cabecalhos[nome] ?? '(nada)'} → ${b.cabecalhos[nome] ?? '(nada)'}`);
            }
            linha(diferencas.length === 0, `${chave}${diferencas.length ? `: ${diferencas.join('; ')}` : ' igual'}`);
        }
    } else {
        await conferirExpertbr();
    }
    console.log(falhas ? `\n${falhas} conferência(s) falharam.` : '\nTudo certo.');
    if (falhas) process.exit(1);
}

principal().catch((erro) => {
    console.error(`ERRO: ${erro.message}`);
    process.exit(1);
});
