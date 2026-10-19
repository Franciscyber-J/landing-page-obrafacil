// Gera, depois do "vite build", uma página de verdade para os Termos de Uso e a Política de
// Privacidade em cada idioma (dist/<idioma>/<palavra>/index.html), com o texto já dentro do HTML.
// Assim robôs (Google, revisão das lojas) e navegadores sem JavaScript leem o texto; o site,
// ao carregar, confere no Firestore se há versão mais nova e desenha a mesma coisa.
//
// O texto vem do Firestore (leitura pública, sem chave). Sem acesso à internet, as páginas não são
// geradas e o build continua: o site lê o texto na hora (o endereço continua funcionando).
//
// Uso: roda sozinho no fim do "npm run build" (postbuild).

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { IDIOMAS, caminhoLegal, INTERNACIONAL } from '../../src/i18n/idiomas.js';
import { DOCUMENTOS, textoDaVersao, versoesDoDocumento } from '../../src/legal/firestore.js';
import { blocosEmHtml, escapar, lerTexto, tituloDoTexto } from '../../src/legal/markdown.js';

const DIST = path.resolve('dist');
const SITE = 'https://appobrafacil.expertbr.com';

function primeiroParagrafo(blocos) {
    const p = blocos.find((b) => b.tipo === 'paragrafo');
    const texto = p ? p.trechos.map((t) => t.texto).join('') : '';
    return texto.length > 160 ? `${texto.slice(0, 157).replace(/\s+\S*$/, '')}...` : texto;
}

function jsonNoHtml(valor) {
    return JSON.stringify(valor).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function pagina(modelo, { codigo, documento, blocos, dados }) {
    const titulo = `${tituloDoTexto(blocos)} · ObraFácil`;
    const descricao = primeiroParagrafo(blocos);
    const alternativos = [
        `<link rel="canonical" href="${SITE}${caminhoLegal(codigo, documento)}" />`,
        ...IDIOMAS.map((i) => `<link rel="alternate" hreflang="${i.codigo}" href="${SITE}${caminhoLegal(i.codigo, documento)}" />`),
        `<link rel="alternate" hreflang="x-default" href="${SITE}${caminhoLegal(INTERNACIONAL, documento)}" />`,
    ].join('\n    ');
    const corpo = `<main class="legal-estatico"><article>${blocosEmHtml(blocos)}</article></main>`
        + `<script type="application/json" id="legal-inicial">${jsonNoHtml(dados)}</script>`;
    let html = modelo
        .replace(/<html lang="[^"]*"/, `<html lang="${codigo}"`)
        .replace(/<title>[^<]*<\/title>/, `<title>${escapar(titulo)}</title>`)
        .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapar(descricao)}" />`)
        .replace('</head>', `    ${alternativos}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${corpo}</div>`);
    if (!html.includes('id="legal-inicial"')) throw new Error('Modelo do index.html sem <div id="root"></div>');
    return html;
}

async function principal() {
    const modeloArquivo = path.join(DIST, 'index.html');
    if (!fs.existsSync(modeloArquivo)) throw new Error('dist/index.html não existe: rode o vite build antes.');
    const modelo = fs.readFileSync(modeloArquivo, 'utf8');
    let geradas = 0;
    for (const documento of DOCUMENTOS) {
        const escolha = await versoesDoDocumento(documento);
        if (!escolha) {
            console.warn(`  ${documento}: nada publicado no Firestore; página não gerada (o site mostra o aviso de texto indisponível).`);
            continue;
        }
        for (const { codigo } of IDIOMAS) {
            const lido = await textoDaVersao(documento, escolha.atual.versao, codigo);
            if (!lido) {
                console.warn(`  ${documento} ${escolha.atual.versao} ${codigo}: sem texto neste idioma; página não gerada.`);
                continue;
            }
            const blocos = lerTexto(lido.texto);
            const dados = {
                documento,
                idioma: codigo,
                atual: { versao: lido.versao, texto: lido.texto, vigenteDesde: escolha.atual.vigenteDesde },
                proxima: escolha.proxima,
            };
            const destino = path.join(DIST, ...caminhoLegal(codigo, documento).split('/').filter(Boolean), 'index.html');
            fs.mkdirSync(path.dirname(destino), { recursive: true });
            fs.writeFileSync(destino, pagina(modelo, { codigo, documento, blocos, dados }));
            geradas += 1;
        }
        console.log(`  ${documento}: versão ${escolha.atual.versao}${escolha.atual.vigenteDesde ? '' : ' (ainda não liberada)'}${escolha.proxima ? `, próxima ${escolha.proxima.versao}` : ''}`);
    }
    console.log(`Termos e Política: ${geradas} página(s) gerada(s) em dist/.`);
}

principal().catch((erro) => {
    console.warn(`\nAVISO: Termos e Política não foram gerados como páginas prontas (${erro.message}).`);
    console.warn('O build continua; o site lê o texto no Firestore quando a pessoa abre a página.\n');
    process.exitCode = 0;
});
