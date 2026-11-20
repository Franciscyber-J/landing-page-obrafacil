#!/usr/bin/env node
// Conferência dos textos do site da ExpertBR (sites/expertbr/src/textos), no mesmo modelo do site do ObraFácil:
//   - idioma-base (sem "base" no cadastro): arquivo completo, com todas as chaves do pt-BR (referência);
//   - variante regional (pt-PT, en-GB, en-AU, en-CA, es-MX): só o que muda em relação à base;
//   - {{...}} iguais aos do pt-BR; nada vazio; lista onde o pt-BR tem lista (com o mesmo número de itens);
//   - palavras das âncoras no formato dos endereços (letras minúsculas, números e hífen);
//   - as chaves "obrafacil:..." usadas pelo site (src/produtos.js e a página) existem nos textos do ObraFácil.
//
//   npm run expertbr:idiomas            confere e lista o que está errado (sai com erro se houver)
//   npm run expertbr:idiomas -- --build o mesmo, antes do build (o build para se houver erro)

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { IDIOMAS, REFERENCIA, palavraDeEnderecoValida } from '../src/idiomas.js';
import { PRODUTOS } from '../src/produtos.js';

const PASTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.resolve(PASTA, '..', '..');
export const TEXTOS = path.join(PASTA, 'src', 'textos');
const TEXTOS_OBRAFACIL = path.join(RAIZ, 'src', 'i18n', 'textos');

// Chaves do ObraFácil que a página usa fora de src/produtos.js (src/Pagina.jsx e src/seo.js).
export const CHAVES_DO_OBRAFACIL_NA_PAGINA = [
    'obrafacil:recursos.itens.offline.texto',
    'obrafacil:recursos.itens.aparelhos.texto',
    'obrafacil:footer.help',
    'obrafacil:footer.support',
];

const ler = (arquivo) => JSON.parse(fs.readFileSync(arquivo, 'utf8'));

// { 'a.b': valor } com as folhas (texto ou lista).
export function achatar(objeto, prefixo = '', saida = {}) {
    for (const [chave, valor] of Object.entries(objeto ?? {})) {
        const nome = prefixo ? `${prefixo}.${chave}` : chave;
        if (valor && typeof valor === 'object' && !Array.isArray(valor)) achatar(valor, nome, saida);
        else saida[nome] = valor;
    }
    return saida;
}

const marcadores = (texto) => [...String(texto).matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g)].map((m) => m[1]).sort().join(',');

export function chavesDoObraFacil() {
    const lista = [...CHAVES_DO_OBRAFACIL_NA_PAGINA];
    for (const p of PRODUTOS) {
        const t = p.textos ?? {};
        for (const valor of [t.linha, t.descricao, t.plataformas, t.nota, t.aviso, ...(Array.isArray(t.destaques) ? t.destaques : [t.destaques])]) {
            if (typeof valor === 'string') lista.push(valor);
        }
        for (const tela of p.telas?.itens ?? []) lista.push(tela.alt);
        if (p.telas?.legenda) lista.push(p.telas.legenda);
        for (const chave of [p.seo?.subcategoria, p.seo?.descricao]) if (chave) lista.push(chave);
        for (const l of p.lojas ?? []) if (l.rotulo.includes('.')) lista.push(l.rotulo);
    }
    return lista;
}

export function conferirTextos() {
    const erros = [];
    const referencia = achatar(ler(path.join(TEXTOS, `${REFERENCIA}.json`)));
    const arquivos = new Set(fs.readdirSync(TEXTOS).filter((n) => n.endsWith('.json')).map((n) => n.replace(/\.json$/, '')));
    for (const nome of arquivos) if (!IDIOMAS.some((i) => i.codigo === nome)) erros.push(`src/textos/${nome}.json: idioma fora do cadastro (src/i18n/registro.js)`);

    for (const i of IDIOMAS) {
        if (!arquivos.has(i.codigo)) {
            erros.push(`src/textos/${i.codigo}.json não existe (idioma do cadastro sem os textos da ExpertBR)`);
            continue;
        }
        const textos = achatar(ler(path.join(TEXTOS, `${i.codigo}.json`)));
        for (const [chave, valor] of Object.entries(textos)) {
            const ref = referencia[chave];
            const onde = `${i.codigo} ${chave}`;
            if (ref === undefined) { erros.push(`${onde}: chave que não existe no ${REFERENCIA}`); continue; }
            if (Array.isArray(ref) !== Array.isArray(valor)) { erros.push(`${onde}: ${Array.isArray(ref) ? 'tem de ser lista' : 'tem de ser texto'}`); continue; }
            const itens = Array.isArray(valor) ? valor : [valor];
            if (Array.isArray(ref) && itens.length !== ref.length) erros.push(`${onde}: ${itens.length} itens (o ${REFERENCIA} tem ${ref.length})`);
            for (const item of itens) {
                if (typeof item !== 'string' || !item.trim()) erros.push(`${onde}: texto vazio`);
                else if (marcadores(item) !== marcadores(Array.isArray(ref) ? ref[0] : ref)) erros.push(`${onde}: {{...}} diferente do ${REFERENCIA}`);
            }
            if (chave.startsWith('ancoras.') && !palavraDeEnderecoValida(valor)) erros.push(`${onde}: "${valor}" não serve de âncora (letras minúsculas, números e hífen)`);
        }
        if (!i.base) {
            for (const chave of Object.keys(referencia)) if (textos[chave] === undefined) erros.push(`${i.codigo} ${chave}: falta (idioma-base tem de ter todos os textos)`);
        }
    }

    // Chaves do ObraFácil: existem no pt-BR do site dele (a cadeia de idiomas cuida dos outros).
    const doObraFacil = achatar(ler(path.join(TEXTOS_OBRAFACIL, `${REFERENCIA}.json`)));
    for (const chave of chavesDoObraFacil()) {
        if (chave.startsWith('obrafacil:')) {
            if (doObraFacil[chave.slice('obrafacil:'.length)] === undefined) erros.push(`${chave}: não existe nos textos do site do ObraFácil (src/i18n/textos/pt-BR.json)`);
        } else if (referencia[chave] === undefined) {
            erros.push(`${chave}: não existe em src/textos/${REFERENCIA}.json`);
        }
    }
    return erros;
}

function principal() {
    const erros = conferirTextos();
    if (erros.length) {
        for (const erro of erros) console.error(`ERRO: ${erro}`);
        console.error(`\nTextos da ExpertBR: ${erros.length} erro(s).`);
        process.exit(1);
    }
    console.log(`Textos da ExpertBR: ${IDIOMAS.length} idiomas conferidos, sem erros.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
