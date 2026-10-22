#!/usr/bin/env node
// Bloco "ENDEREÇOS POR IDIOMA" do hospedagem/.htaccess, gerado a partir de src/i18n/registro.js. Assim um idioma
// novo entra no servidor (raiz, endereços antigos, maiúsculas) sem ninguém escrever regra à mão.
//
//   npm run htaccess              reescreve o bloco no hospedagem/.htaccess
//   npm run htaccess -- --conferir  só confere (sai com erro se o bloco estiver desatualizado; o npm test usa)
//
// O idioma do navegador (cabeçalho Accept-Language) é escolhido como em src/i18n/idiomas.js (escolherIdioma):
// a primeira língua da lista que o site tem; a região escolhe a variante (es-AR → es-MX, pt-AO → pt-PT).

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
    COMPRAS, IDIOMAS, INTERNACIONAL, REFERENCIA, caminhoAjuda, caminhoLegal, caminhoPagamento, caminhoPerfil,
    caminhoSuporte, PAGINAS_ANTIGAS,
} from '../../src/i18n/idiomas.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ARQUIVO = path.join(RAIZ, 'hospedagem', '.htaccess');
export const INICIO = '# >>> ENDEREÇOS POR IDIOMA';
export const FIM = '# <<< ENDEREÇOS POR IDIOMA';

const lingua = (codigo) => codigo.split('-')[0].toLowerCase();
const regiao = (codigo) => codigo.split('-')[1].toLowerCase();
const LINGUAS = [...new Set(IDIOMAS.map((i) => lingua(i.codigo)))];
const prefixo = (codigo) => codigo.toLowerCase();

// Começo de todas as regras do Accept-Language: pula as entradas de línguas que o site não tem e para na
// primeira que ele tem ("de-DE,de;q=0.9,es-AR;q=0.8" → para em "es-AR").
export const PULAR_OUTRAS = `^(?:\\s*(?!(?:${LINGUAS.join('|')})(?![a-z]))[^,]*,)*\\s*`;

// Regras do Accept-Language, na ordem em que são testadas: [idioma, padrão].
export function regrasDoNavegador() {
    const regras = [];
    for (const i of IDIOMAS) {
        const regioes = [regiao(i.codigo), ...i.regioes.map((r) => r.toLowerCase())];
        regras.push([i.codigo, `${PULAR_OUTRAS}${lingua(i.codigo)}-(?:${regioes.join('|')})(?![a-z0-9])`]);
    }
    for (const l of LINGUAS) {
        const daLingua = IDIOMAS.filter((i) => lingua(i.codigo) === l);
        const base = daLingua.find((i) => !i.base) ?? daLingua[0];
        regras.push([base.codigo, `${PULAR_OUTRAS}${l}(?![a-z])`]);
    }
    return regras;
}

// Endereços antigos do WordPress (sem idioma) → página no idioma: [padrão, destino(codigo), sem consulta].
// O que vem depois do "?" na volta do pagamento e no Perfil não segue (pode ser o identificador da sessão da
// Stripe), igual a src/i18n/idiomas.js (consultaQueSegue).
function antigos() {
    const lista = [
        ['termos-de-uso', (c) => caminhoLegal(c, 'termos'), false],
        ['politicas-de-privacidade', (c) => caminhoLegal(c, 'privacidade'), false],
    ];
    for (const [antigo, alvo] of Object.entries(PAGINAS_ANTIGAS)) {
        if (alvo.pagina === 'pagamento') lista.push([antigo, (c) => caminhoPagamento(c, alvo.compra), true]);
        else if (alvo.pagina === 'perfil') lista.push([antigo, (c) => caminhoPerfil(c), true]);
        else if (alvo.pagina === 'suporte') lista.push([antigo, (c) => caminhoSuporte(c), false]);
        else throw new Error(`Página antiga sem regra: ${antigo}`);
    }
    lista.push(['ajuda', (c) => caminhoAjuda(c), false]);
    return lista;
}

const escaparPadrao = (texto) => texto.replace(/[.^$*+?()[\]{}|\\-]/g, '\\$&');

export function gerarBloco() {
    const codigos = IDIOMAS.map((i) => prefixo(i.codigo));
    const l = [];
    l.push(INICIO);
    l.push('# Gerado por "npm run htaccess" a partir de src/i18n/registro.js. Não edite à mão: rode o comando.');
    l.push('#');
    l.push('# 1) Idioma do navegador (Accept-Language), só nos endereços que precisam dele (a raiz e os antigos do');
    l.push('#    WordPress): a primeira língua da lista que o site tem; a região escolhe a variante. Mesma escolha de');
    l.push('#    src/i18n/idiomas.js (escolherIdioma).');
    const quer = ['', ...antigos().map(([a]) => escaparPadrao(a))].join('|');
    l.push(`RewriteRule ^(?:${quer})/?$ - [NC,E=QUER_IDIOMA:1]`);
    for (const [codigo, padrao] of regrasDoNavegador()) {
        l.push('RewriteCond %{ENV:QUER_IDIOMA} =1');
        l.push('RewriteCond %{ENV:IDIOMA_NAVEGADOR} ^$');
        l.push(`RewriteCond %{HTTP:Accept-Language} ${padrao} [NC]`);
        l.push(`RewriteRule ^ - [E=IDIOMA_NAVEGADOR:${prefixo(codigo)}]`);
    }
    l.push('');
    l.push(`# 2) Raiz "/": vai para a página inicial no idioma da pessoa; sem língua conhecida, ${INTERNACIONAL} (o mesmo`);
    l.push('#    que o site faz). 302 de propósito: o destino muda conforme quem abre, e a raiz continua sendo a');
    l.push('#    "x-default" do hreflang (a porta de entrada que escolhe o idioma). Um 301 faria o Google e os');
    l.push('#    navegadores guardarem um idioma só para todo mundo.');
    l.push('RewriteCond %{ENV:IDIOMA_NAVEGADOR} ^$');
    l.push(`RewriteRule ^$ /${prefixo(INTERNACIONAL)}/ [R=302,L,E=VARIA_IDIOMA:1,E=Cache-Control:no-cache]`);
    l.push(`RewriteCond %{ENV:IDIOMA_NAVEGADOR} ^(${codigos.join('|')})$`);
    l.push('RewriteRule ^$ /%1/ [R=302,L,E=VARIA_IDIOMA:1,E=Cache-Control:no-cache]');
    l.push('');
    l.push('# 3) Endereços antigos do WordPress (estão nas lojas, na Stripe, num Payment Link, no app e em e-mails já');
    l.push('#    enviados): 301 para a mesma página no idioma do navegador. Sem língua conhecida (o Google não manda');
    l.push(`#    nenhuma), ${REFERENCIA}: eram páginas em português, e o 301 passa o histórico delas para a página nova.`);
    l.push('#    Sem cache (o destino muda conforme quem abre). Com e sem barra no fim, maiúsculas ou não.');
    l.push(`RewriteCond %{ENV:QUER_IDIOMA} =1`);
    l.push('RewriteCond %{ENV:IDIOMA_NAVEGADOR} ^$');
    l.push(`RewriteRule ^.+$ - [E=IDIOMA_NAVEGADOR:${prefixo(REFERENCIA)}]`);
    for (const i of IDIOMAS) {
        for (const [antigo, destino, semConsulta] of antigos()) {
            l.push(`RewriteCond %{ENV:IDIOMA_NAVEGADOR} =${prefixo(i.codigo)}`);
            l.push(`RewriteRule ^${escaparPadrao(antigo)}/?$ ${destino(i.codigo)}${semConsulta ? '?' : ''} [NC,R=301,L,E=VARIA_IDIOMA:1,E=Cache-Control:no-cache]`);
        }
    }
    l.push('');
    l.push('# 4) Endereços antigos da Central com o idioma (/ajuda/pt-BR/criar-rdo) → /pt-br/ajuda/criar-rdo. Sem');
    l.push(`#    idioma (/ajuda/criar-rdo), ${REFERENCIA}. O site corrige sozinho o resto (nome do assunto no idioma).`);
    for (const i of IDIOMAS) {
        l.push(`RewriteRule ^ajuda/${prefixo(i.codigo)}(/.*)?$ ${caminhoAjuda(i.codigo)}$1 [NC,R=301,L]`);
    }
    l.push(`RewriteRule ^ajuda/(.+)$ ${caminhoAjuda(REFERENCIA)}/$1 [NC,R=301,L]`);
    l.push('');
    l.push('# 5) Idioma com maiúsculas (/PT-BR/ajuda) → minúsculas; página inicial sem barra (/pt-br) → com barra.');
    for (const c of codigos) {
        l.push(`RewriteCond %{REQUEST_URI} !^/${c}(?:/|$)`);
        l.push(`RewriteRule ^${c}(/.*)?$ /${c}$1 [NC,R=301,L]`);
    }
    l.push(`RewriteRule ^(${codigos.join('|')})$ /$1/ [R=301,L]`);
    l.push(FIM);
    return l.join('\n');
}

export function blocoAtual(texto) {
    const a = texto.indexOf(INICIO);
    const b = texto.indexOf(FIM);
    if (a < 0 || b < 0 || b < a) throw new Error(`hospedagem/.htaccess sem as marcas "${INICIO}" e "${FIM}"`);
    return texto.slice(a, b + FIM.length);
}

function principal() {
    const texto = fs.readFileSync(ARQUIVO, 'utf8');
    const novo = gerarBloco();
    const atual = blocoAtual(texto);
    if (process.argv.includes('--conferir')) {
        if (atual !== novo) {
            console.error('hospedagem/.htaccess: o bloco ENDEREÇOS POR IDIOMA está desatualizado. Rode: npm run htaccess');
            process.exit(1);
        }
        console.log('hospedagem/.htaccess: bloco dos idiomas em dia.');
        return;
    }
    fs.writeFileSync(ARQUIVO, texto.replace(atual, () => novo));
    console.log(atual === novo ? 'hospedagem/.htaccess: nada mudou.' : 'hospedagem/.htaccess: bloco dos idiomas regravado. Envie o arquivo para a Hostinger.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
