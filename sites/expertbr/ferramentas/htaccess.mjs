#!/usr/bin/env node
// Bloco "IDIOMAS DA EXPERTBR" do sites/expertbr/hospedagem/.htaccess, gerado a partir do cadastro dos idiomas
// (src/i18n/registro.js, o mesmo do site do ObraFácil). Idioma novo no cadastro: rode e envie o .htaccess de novo.
//
//   npm run expertbr:htaccess               reescreve o bloco
//   npm run expertbr:htaccess -- --conferir só confere (sai com erro se estiver desatualizado; o teste usa)
//
// O idioma do navegador (Accept-Language) é escolhido com as mesmas regras do site do ObraFácil
// (ferramentas/hospedagem/htaccess.mjs, regrasDoNavegador, igual a escolherIdioma de src/i18n/idiomas.js).
// As variáveis têm nome próprio (EXPERTBR_...): a pasta do ObraFácil usa outras e nunca pode receber estas.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { regrasDoNavegador } from '../../../ferramentas/hospedagem/htaccess.mjs';
import { IDIOMAS, INTERNACIONAL } from '../src/idiomas.js';

const PASTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ARQUIVO = path.join(PASTA, 'hospedagem', '.htaccess');
export const INICIO = '# >>> IDIOMAS DA EXPERTBR';
export const FIM = '# <<< IDIOMAS DA EXPERTBR';

const prefixo = (codigo) => codigo.toLowerCase();

export function gerarBloco() {
    const codigos = IDIOMAS.map((i) => prefixo(i.codigo));
    const l = [INICIO];
    l.push('# Gerado por "npm run expertbr:htaccess" a partir de src/i18n/registro.js. Não edite à mão: rode o comando.');
    l.push('#');
    l.push('# a) Idioma com maiúsculas (/PT-BR/) → minúsculas; sem a barra (/pt-br) → com a barra; qualquer outro endereço');
    l.push('#    dentro do idioma (/pt-br/algo) → a página do idioma (o site tem uma página por idioma).');
    for (const c of codigos) {
        l.push(`RewriteCond %{REQUEST_URI} !^/${c}(?:/|$)`);
        l.push(`RewriteRule ^${c}(/.*)?$ /${c}/ [NC,R=301,L]`);
    }
    l.push(`RewriteRule ^(${codigos.join('|')})$ /$1/ [R=301,L]`);
    l.push('#    Pelo pedido original (THE_REQUEST): o servidor entrega /pt-br/ abrindo pt-br/index.html por dentro, e esse');
    l.push('#    pedido interno não pode virar redirecionamento (seria um vaivém sem fim).');
    l.push(`RewriteCond %{THE_REQUEST} ^[A-Z]+\\s/+(${codigos.join('|')})/[^\\s?]+[\\s?]`);
    l.push('RewriteRule ^ /%1/ [R=301,L]');
    l.push('');
    l.push('# b) Raiz "/": a página no idioma do navegador (Accept-Language): a primeira língua da lista que o site tem; a');
    l.push(`#    região escolhe a variante (es-AR → es-MX, pt-AO → pt-PT). Sem língua conhecida (e robôs, que não mandam o`);
    l.push(`#    cabeçalho), ${INTERNACIONAL}. 302 de propósito: o destino muda conforme quem abre, e a raiz é a "x-default"`);
    l.push('#    do hreflang. A resposta não fica guardada (cabeçalhos com EXPERTBR_VARIA, no começo do arquivo).');
    for (const [codigo, padrao] of regrasDoNavegador()) {
        l.push('RewriteCond %{ENV:EXPERTBR_IDIOMA} ^$');
        l.push(`RewriteCond %{HTTP:Accept-Language} ${padrao} [NC]`);
        l.push(`RewriteRule ^$ - [E=EXPERTBR_IDIOMA:${prefixo(codigo)}]`);
    }
    l.push('RewriteCond %{ENV:EXPERTBR_IDIOMA} ^$');
    l.push(`RewriteRule ^$ /${prefixo(INTERNACIONAL)}/ [R=302,L,E=EXPERTBR_VARIA:1,E=Cache-Control:no-cache]`);
    l.push(`RewriteCond %{ENV:EXPERTBR_IDIOMA} ^(${codigos.join('|')})$`);
    l.push('RewriteRule ^$ /%1/ [R=302,L,E=EXPERTBR_VARIA:1,E=Cache-Control:no-cache]');
    l.push(FIM);
    return l.join('\n');
}

export function blocoAtual(texto) {
    const a = texto.indexOf(INICIO);
    const b = texto.indexOf(FIM);
    if (a < 0 || b < 0 || b < a) throw new Error(`sites/expertbr/hospedagem/.htaccess sem as marcas "${INICIO}" e "${FIM}"`);
    return texto.slice(a, b + FIM.length);
}

function principal() {
    const texto = fs.readFileSync(ARQUIVO, 'utf8');
    const novo = gerarBloco();
    const atual = blocoAtual(texto);
    if (process.argv.includes('--conferir')) {
        if (atual !== novo) {
            console.error('sites/expertbr/hospedagem/.htaccess: o bloco IDIOMAS DA EXPERTBR está desatualizado. Rode: npm run expertbr:htaccess');
            process.exit(1);
        }
        console.log('sites/expertbr/hospedagem/.htaccess: bloco dos idiomas em dia.');
        return;
    }
    fs.writeFileSync(ARQUIVO, texto.replace(atual, () => novo));
    console.log(atual === novo ? 'sites/expertbr/hospedagem/.htaccess: nada mudou.' : 'sites/expertbr/hospedagem/.htaccess: bloco dos idiomas regravado. Envie o arquivo para a Hostinger.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
