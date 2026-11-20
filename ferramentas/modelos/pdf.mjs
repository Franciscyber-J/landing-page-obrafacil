// PDFs dos modelos grátis (roda no build, dentro de ferramentas/paginas/gerar.mjs): uma folha para imprimir de cada
// modelo em cada idioma, feita a partir dos mesmos dados da página (src/modelos/dados, copiados do app) e com os
// textos do app nos rótulos (a Ficha de Verificação de Serviço e o RDO do app). É a versão para imprimir, sem as
// funções do app, com o logotipo, o rodapé "Feito com ObraFácil" e o link do site no idioma.
//
// Desenhado pelo Chromium (Playwright, a mesma ferramenta da vitrine das lojas no gestao_obras) com as fontes do
// próprio site (Manrope, Bricolage e a Noto de cada escrita): o japonês, o árabe, o hindi e o tailandês saem com as
// letras certas, da direita para a esquerda onde precisa, e o texto fica selecionável. Papel A4 ou Carta pelo
// cadastro do idioma (como o app, papel_do_pdf.dart). Cada PDF tem uma página só (o build confere).
//
// Os PDFs ficam guardados em node_modules/.cache/obrafacil-modelos-pdf pelo conteúdo: o build seguinte só desenha de
// novo o que mudou.
//
// No computador do Francis, uma vez só: npx playwright install chromium

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { escritasDoCadastro } from '../../src/fontes/escritas.js';
import { IDIOMAS, caminhoInicio, idioma } from '../../src/i18n/idiomas.js';
import { absoluto } from '../../src/seo/paginas.js';
import {
    CAMPOS_DO_DIARIO, PAPEIS, caminhoDoPdf, itensPorSecao, nomeDoGrupo, papelDoIdioma, partesDoTexto, rotuloDoApp,
    textoDoApp,
} from '../../src/modelos/modelos.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE = path.join(RAIZ, 'node_modules', '.cache', 'obrafacil-modelos-pdf');
const require = createRequire(import.meta.url);
const ESCRITA_DO_IDIOMA = escritasDoCadastro(IDIOMAS);
// O que entra na chave do que fica guardado em CACHE, além do HTML de cada PDF: o desenho deste arquivo, o logotipo,
// as fontes (pela versão dos pacotes e pela lista das fontes dos PDFs) e a versão do Chromium.
function assinaturaFixa() {
    const h = crypto.createHash('sha256');
    h.update(fs.readFileSync(fileURLToPath(import.meta.url)));
    h.update(fs.readFileSync(path.join(RAIZ, 'ferramentas', 'modelos', 'logo-pdf.png')));
    h.update(fs.readFileSync(path.join(RAIZ, 'public', 'fontes', 'pdf', 'lista.json')));
    for (const pacote of ['@fontsource/manrope', '@fontsource/bricolage-grotesque']) h.update(require(`${pacote}/package.json`).version);
    return h.digest('hex');
}

const e = (texto) => String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const arquivoUrl = (relativo) => pathToFileURL(path.join(RAIZ, relativo)).href;

function cssDoPacote(pacote, arquivo) {
    return pathToFileURL(require.resolve(`${pacote}/${arquivo}`)).href;
}

// Fontes fixas da Noto de cada escrita (normal e negrito), as mesmas que o app baixa do site para os PDFs dele
// (public/fontes/pdf, lista.json). As variáveis do site entrariam no PDF como desenho (Type 3), pesadas.
const FAMILIA_DO_PDF = {
    japonesa: 'NotoSansJP', coreana: 'NotoSansKR', chinesaTradicional: 'NotoSansTC', arabe: 'NotoSansArabic',
    hebraica: 'NotoSansHebrew', devanagari: 'NotoSansDevanagari', tailandesa: 'NotoSansThai',
};
const LISTA_DAS_FONTES = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public', 'fontes', 'pdf', 'lista.json'), 'utf8')).arquivos;

function fonteDoPdf(familia, peso) {
    const achada = LISTA_DAS_FONTES.find((f) => f.familia === familia && f.peso === peso);
    if (!achada) throw new Error(`public/fontes/pdf sem a ${familia} ${peso}`);
    return arquivoUrl(`public/fontes/pdf/${achada.arquivo}`);
}

// As fontes da folha: a Manrope e a Bricolage do site (arquivos fixos por peso) e a Noto da escrita do idioma.
function fontes(codigo) {
    const folhas = [
        ...['400', '700', '800'].map((p) => cssDoPacote('@fontsource/manrope', `${p}.css`)),
        cssDoPacote('@fontsource/bricolage-grotesque', '800.css'),
    ];
    const escrita = ESCRITA_DO_IDIOMA[codigo];
    let faces = '';
    let familia = '';
    if (escrita) {
        const nome = FAMILIA_DO_PDF[escrita];
        if (!nome) throw new Error(`Sem fonte de PDF para a escrita ${escrita} (ferramentas/modelos/pdf.mjs)`);
        faces = [400, 700].map((peso) => `@font-face { font-family: 'Escrita do PDF'; font-weight: ${peso === 700 ? '600 900' : '100 500'}; src: url('${fonteDoPdf(nome, peso)}') format('truetype'); }`).join('\n');
        familia = "'Escrita do PDF', ";
    }
    return {
        links: folhas.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n'),
        faces,
        texto: `'Manrope', ${familia}sans-serif`,
        titulo: `'Bricolage Grotesque', 'Manrope', ${familia}sans-serif`,
    };
}

// Texto do app com cada {nome} sem valor desenhado como linha para preencher.
function campo(dados, chave, valores = {}, classe = '') {
    const partes = partesDoTexto(dados, chave, valores).map((p) => (p.branco ? '<span class="branco"></span>' : `<span>${e(p.texto)}</span>`));
    return `<p class="campo ${classe}">${partes.join('')}</p>`;
}

function rotuloComLinha(texto) {
    return `<p class="campo"><span>${e(texto)}</span><span class="branco"></span></p>`;
}

const caixa = '<span class="caixa"></span>';

// Linha de assinatura com o rótulo do app (Responsável técnico).
function assinatura(dados) {
    return `<div class="assinatura"><div class="linhaAssinatura"></div><p>${e(textoDoApp(dados, 'rdoFormSignatureTitle'))}</p></div>`;
}

function cabecalho({ documento, titulo, subtitulo }) {
    return `
<header class="topo">
  <img class="logo" src="${arquivoUrl('ferramentas/modelos/logo-pdf.png')}" alt="ObraFácil">
  <div class="titulos">
    ${documento ? `<p class="documento">${e(documento)}</p>` : ''}
    <h1>${e(titulo)}</h1>
    ${subtitulo ? `<p class="subtitulo">${e(subtitulo)}</p>` : ''}
  </div>
</header>`;
}

function rodape({ t, codigo, convite, nota }) {
    const url = absoluto(caminhoInicio(codigo));
    const mostrado = url.replace(/^https:\/\//, '').replace(/\/$/, '');
    return `
<footer class="rodape">
  <div class="rodapeLinha">
    <p class="feito">${e(t('modelos.pdf.feitoCom'))}</p>
    <p class="convite">${e(convite)} <a href="${e(url)}">${e(mostrado)}</a></p>
  </div>
  ${nota ? `<p class="nota">${e(nota)}</p>` : ''}
</footer>`;
}

function corpoDoChecklist({ t, codigo, dados, modelo }) {
    const respostas = ['checklistRespostaConforme', 'checklistRespostaNaoConforme', 'checklistRespostaNaoSeAplica'];
    const linhas = itensPorSecao(modelo).map((s) => `
      <tr class="secao"><td colspan="${3 + respostas.length}">${e(textoDoApp(dados, s.chave))}</td></tr>
      ${s.itens.map((i) => `
      <tr>
        <td class="num">${i.numero}</td>
        <td class="texto">${e(i.texto)}${i.critico || i.foto ? `<span class="marcas">${i.critico ? `<span class="marca critico">${e(textoDoApp(dados, 'checklistItemCritico'))}</span>` : ''}${i.foto ? `<span class="marca">${e(textoDoApp(dados, 'checklistFotoObrigatoria'))}</span>` : ''}</span>` : ''}</td>
        ${respostas.map(() => `<td class="resp">${caixa}</td>`).join('')}
        <td class="obs"></td>
      </tr>`).join('')}`).join('');
    const nc = () => `
      <div class="nc">
        ${campo(dados, 'checklistPdfOQueEstaErrado')}
        ${campo(dados, 'checklistPdfAcaoCorretiva')}
        ${campo(dados, 'checklistPdfReinspecao', { numero: 1 })}
      </div>`;
    return `
${cabecalho({ documento: textoDoApp(dados, 'checklistPdfTitulo'), titulo: modelo.nome, subtitulo: nomeDoGrupo(dados, modelo.grupo) === modelo.nome ? '' : nomeDoGrupo(dados, modelo.grupo) })}
<section class="grade">
  ${rotuloComLinha(textoDoApp(dados, 'checklistPdfObra'))}
  ${rotuloComLinha(textoDoApp(dados, 'checklistPdfLocal'))}
  ${rotuloComLinha(textoDoApp(dados, 'checklistPdfEtapa'))}
  ${rotuloComLinha(textoDoApp(dados, 'checklistPdfDataDaInspecao'))}
  <div class="largura">${rotuloComLinha(textoDoApp(dados, 'checklistPdfAplicadoPor'))}</div>
</section>
<p class="criterio"><strong>${e(t('modelos.checklist.criterio'))}:</strong> ${e(dados.biblioteca.criterio)}</p>
<table class="itens">
  <thead><tr>
    <th class="num">${e(textoDoApp(dados, 'checklistPdfColunaNumero'))}</th>
    <th class="texto">${e(textoDoApp(dados, 'checklistPdfColunaItem'))}</th>
    ${respostas.map((r) => `<th class="resp">${e(textoDoApp(dados, r))}</th>`).join('')}
    <th class="obs">${e(textoDoApp(dados, 'checklistPdfColunaObservacao'))}</th>
  </tr></thead>
  <tbody>${linhas}</tbody>
</table>
<section class="bloco">
  <h2>${e(textoDoApp(dados, 'checklistPdfNaoConformidades'))}</h2>
  ${nc()}${nc()}
</section>
<section class="bloco">
  <h2>${e(textoDoApp(dados, 'checklistPdfLiberacao'))}</h2>
  <p class="opcoes">
    ${['checklistPdfLiberadoSemRessalvas', 'checklistPdfLiberadoComRessalvas', 'checklistPdfNaoLiberado'].map((c) => `<span>${caixa}${e(textoDoApp(dados, c))}</span>`).join('')}
  </p>
  ${campo(dados, 'checklistPdfRessalvas')}
  ${assinatura(dados)}
</section>
${rodape({ t, codigo, convite: t('modelos.pdf.conviteChecklist'), nota: dados.biblioteca.nota })}`;
}

function linhasEmBranco(n) {
    return `<div class="pautado">${'<span></span>'.repeat(n)}</div>`;
}

function corpoDoDiario({ t, codigo, dados, nome }) {
    const opcoes = (id) => CAMPOS_DO_DIARIO.find((c) => c.id === id).opcoes;
    const tabela = (colunas, linhas, classe) => `
  <table class="tabela ${classe}">
    <thead><tr>${colunas.map((c) => `<th class="${c.classe ?? ''}">${e(c.texto)}</th>`).join('')}</tr></thead>
    <tbody>${`<tr>${colunas.map((c) => `<td class="${c.classe ?? ''}">${c.caixa ? caixa : ''}</td>`).join('')}</tr>`.repeat(linhas)}</tbody>
  </table>`;
    return `
${cabecalho({ titulo: nome })}
<section class="grade">
  ${rotuloComLinha(textoDoApp(dados, 'checklistPdfObra'))}
  ${campo(dados, 'pdfRdoDateClient')}
  <div class="largura">${campo(dados, 'pdfRdoPhysicalProgress', {}, 'curto')}</div>
</section>
<section class="bloco linhaUnica">
  <h2>${e(textoDoApp(dados, 'rdoFormWeatherTitle'))}</h2>
  <p class="opcoes">${opcoes('clima').map((o) => `<span>${caixa}${e(textoDoApp(dados, o))}</span>`).join('')}</p>
</section>
<section class="bloco">
  <h2>${e(rotuloDoApp(dados, 'pdfRdoWorkforceTitle'))}</h2>
  ${tabela([
        { texto: textoDoApp(dados, 'pdfRdoColName'), classe: 'nome' },
        { texto: textoDoApp(dados, 'pdfRdoColRole'), classe: 'funcao' },
        ...opcoes('efetivo').map((o) => ({ texto: textoDoApp(dados, o), classe: 'resp', caixa: true })),
        { texto: textoDoApp(dados, 'rdoFormLaborHoursWorked'), classe: 'horas' },
    ], 6, 'efetivo')}
</section>
<section class="bloco">
  <h2>${e(textoDoApp(dados, 'rdoFormLaborExtraTitle'))}</h2>
  ${tabela([
        { texto: textoDoApp(dados, 'pdfRdoColName'), classe: 'nome' },
        { texto: textoDoApp(dados, 'pdfRdoColRole'), classe: 'funcao' },
        { texto: textoDoApp(dados, 'rdoFormLaborHoursWorked'), classe: 'horas' },
    ], 2, 'avulsa')}
</section>
<section class="bloco"><h2>${e(textoDoApp(dados, 'pdfRdoActivitiesTitle'))}</h2>${linhasEmBranco(5)}</section>
<section class="bloco"><h2>${e(textoDoApp(dados, 'rdoFormObsTitle'))}</h2>${linhasEmBranco(3)}</section>
<section class="bloco"><h2>${e(textoDoApp(dados, 'pdfRdoPhotosTitle'))}</h2>${linhasEmBranco(2)}</section>
${assinatura(dados)}
${rodape({ t, codigo, convite: t('modelos.pdf.conviteDiario') })}`;
}

const ESTILO = `
@page { margin: 10mm 12mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { color: #0d2136; font-family: var(--texto); font-size: 8.6pt; line-height: 1.3; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { display: flex; flex-direction: column; min-height: calc(var(--altura) - 21mm); }
h1, h2 { font-family: var(--titulo); letter-spacing: -0.01em; }
.topo { display: flex; align-items: center; gap: 6mm; padding-bottom: 3mm; border-bottom: 1.2pt solid #0f3a63; }
.logo { width: 32mm; height: auto; }
.titulos { flex: 1; min-width: 0; text-align: end; }
.documento { font-size: 7.8pt; font-weight: 700; color: #a84f08; }
h1 { font-size: 14pt; line-height: 1.12; font-weight: 800; color: #0f3a63; }
.subtitulo { font-size: 7.8pt; color: #4a5f75; }
.grade { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2mm 6mm; margin-top: 3mm; }
.largura { grid-column: 1 / -1; }
.campo { display: flex; flex-wrap: wrap; align-items: flex-end; column-gap: 1.5mm; row-gap: 0.8mm; min-height: 5.6mm; }
.campo > span:not(.branco) { white-space: pre-wrap; }
.branco { flex: 1 1 18mm; min-width: 14mm; height: 4.4mm; border-bottom: 0.6pt solid #8a9bb0; }
.curto .branco { flex: 0 0 22mm; }
.criterio { margin-top: 2.5mm; padding: 1.5mm 3mm; border-radius: 2mm; background: #eaf0f7; font-size: 7.8pt; color: #33475b; }
.itens, .tabela { width: 100%; margin-top: 2.5mm; border-collapse: collapse; table-layout: fixed; }
.itens th, .tabela th { padding: 1.2mm 1.2mm; font-size: 6.8pt; font-weight: 700; line-height: 1.12; color: #ffffff; background: #0f3a63; text-align: start; vertical-align: bottom; overflow-wrap: anywhere; }
.itens td, .tabela td { padding: 1.3mm 1.2mm; border-bottom: 0.5pt solid #b9c6d4; vertical-align: top; }
.itens .num { width: 8mm; text-align: center; font-weight: 700; }
.itens .resp, .tabela .resp { width: 15mm; text-align: center; }
.itens th.resp, .tabela th.resp { text-align: center; }
.itens .obs { width: 38mm; }
.itens td.obs { border-inline-start: 0.5pt solid #d5dde6; }
.itens tr.secao td { padding: 1.6mm 1.2mm 0.8mm; font-family: var(--titulo); font-weight: 800; font-size: 8.2pt; color: #0f3a63; border-bottom: 0.9pt solid #0f3a63; }
.itens td.texto { line-height: 1.28; }
.marcas { display: flex; flex-wrap: wrap; gap: 1mm; margin-top: 0.8mm; }
.marca { display: inline-block; padding: 0.1mm 1.5mm; border-radius: 4mm; border: 0.6pt solid #1a5fb8; color: #1a5fb8; font-size: 6.3pt; font-weight: 700; }
.marca.critico { border-color: #a84f08; color: #a84f08; }
.caixa { display: inline-block; flex-shrink: 0; width: 3.4mm; height: 3.4mm; border: 0.8pt solid #4a5f75; border-radius: 0.8mm; vertical-align: middle; }
.bloco { margin-top: 3.2mm; }
.bloco h2 { margin-bottom: 1.2mm; padding-bottom: 0.8mm; font-size: 9pt; font-weight: 800; color: #0f3a63; border-bottom: 0.9pt solid #0f3a63; }
.nc { display: flex; flex-direction: column; gap: 0.6mm; padding: 1mm 0 2mm; border-bottom: 0.5pt dashed #b9c6d4; }
.opcoes { display: flex; flex-wrap: wrap; gap: 1.2mm 5mm; margin: 1.2mm 0; }
.opcoes span { display: inline-flex; align-items: center; gap: 1.6mm; }
.linhaUnica { display: flex; align-items: center; gap: 1mm 4mm; flex-wrap: wrap; }
.linhaUnica h2 { margin: 0; padding: 0; border: 0; }
.tabela td { height: 5.9mm; }
.tabela .nome { width: 34%; }
.tabela .horas { width: 18mm; text-align: center; }
.tabela td.nome, .tabela td.funcao { border-inline-end: 0.5pt solid #d5dde6; }
.pautado { display: flex; flex-direction: column; }
.pautado span { height: 5.9mm; border-bottom: 0.5pt solid #b9c6d4; }
.assinatura { width: 72mm; margin-top: 4mm; margin-inline-start: auto; text-align: center; font-size: 7.6pt; color: #4a5f75; }
.linhaAssinatura { height: 8mm; margin-bottom: 1mm; border-bottom: 0.8pt solid #0d2136; }
.rodape { margin-top: auto; padding-top: 2.5mm; border-top: 0.6pt solid #b9c6d4; font-size: 7.2pt; color: #4a5f75; }
.rodapeLinha { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 1mm 6mm; }
.feito { font-weight: 800; color: #0f3a63; }
.convite { flex: 1; text-align: end; }
.convite a { color: #1a5fb8; font-weight: 700; text-decoration: none; white-space: nowrap; }
.nota { margin-top: 1.2mm; font-size: 6.3pt; color: #6a7d90; }
`;

// O HTML de um PDF. modelo: o checklist ou o diário (src/modelos/modelos.js); nome: o nome da página.
export function htmlDoPdf({ t, codigo, dados, modelo, nome }) {
    const i = idioma(codigo);
    const f = fontes(codigo);
    const papel = PAPEIS[papelDoIdioma(codigo)];
    const corpo = modelo.tipo === 'diario' ? corpoDoDiario({ t, codigo, dados, nome }) : corpoDoChecklist({ t, codigo, dados, modelo });
    return `<!doctype html>
<html lang="${e(codigo)}" dir="${e(i.direcao)}">
<head>
<meta charset="utf-8">
<title>${e(`${nome} - ObraFácil`)}</title>
${f.links}
<style>
${f.faces}
@page { size: ${papel.largura} ${papel.altura}; }
:root { --texto: ${f.texto}; --titulo: ${f.titulo}; --altura: ${papel.altura}; }
${ESTILO}
</style>
</head>
<body>
${corpo}
</body>
</html>`;
}

function paginasDoPdf(buffer) {
    return (buffer.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
}

// Gera os PDFs em dist/modelos-pdf/<idioma>/<slug>.pdf. itens: [{ codigo, dados, modelo, nome, t }].
// Devolve { gerados, guardados } (quantos foram desenhados agora e quantos vieram do que já estava guardado).
export async function gerarPdfs({ dist, itens, aoAvisar = () => {} }) {
    const { chromium } = await import('playwright');
    let navegador;
    try {
        navegador = await chromium.launch();
    } catch (erro) {
        throw new Error(`não consegui abrir o Chromium para gerar os PDFs dos modelos. No computador, rode uma vez: npx playwright install chromium (${erro.message.split('\n')[0]})`, { cause: erro });
    }
    fs.mkdirSync(CACHE, { recursive: true });
    const versao = `${navegador.version()}|${assinaturaFixa()}`;
    const pasta = fs.mkdtempSync(path.join(CACHE, 'html-'));
    let gerados = 0;
    let guardados = 0;
    const problemas = [];
    try {
        const fila = [...itens];
        const trabalhar = async () => {
            const pagina = await navegador.newPage();
            try {
                for (let item = fila.shift(); item; item = fila.shift()) {
                    const html = htmlDoPdf(item);
                    const papel = papelDoIdioma(item.codigo);
                    const chave = crypto.createHash('sha256').update(`${versao}|${papel}|${html}`).digest('hex').slice(0, 32);
                    const guardado = path.join(CACHE, `${chave}.pdf`);
                    const destino = path.join(dist, ...caminhoDoPdf(item.codigo, item.modelo.slug).split('/').filter(Boolean));
                    fs.mkdirSync(path.dirname(destino), { recursive: true });
                    if (fs.existsSync(guardado)) {
                        fs.copyFileSync(guardado, destino);
                        guardados++;
                        continue;
                    }
                    const arquivoHtml = path.join(pasta, `${chave}.html`);
                    fs.writeFileSync(arquivoHtml, html);
                    await pagina.goto(pathToFileURL(arquivoHtml).href, { waitUntil: 'load' });
                    await pagina.evaluate(() => document.fonts.ready);
                    const pdf = await pagina.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true });
                    const paginas = paginasDoPdf(pdf);
                    if (paginas !== 1) problemas.push(`${caminhoDoPdf(item.codigo, item.modelo.slug)}: ${paginas} páginas (o modelo cabe numa folha só)`);
                    fs.writeFileSync(guardado, pdf);
                    fs.copyFileSync(guardado, destino);
                    gerados++;
                    if ((gerados + guardados) % 100 === 0) aoAvisar(`  PDFs dos modelos: ${gerados + guardados} de ${itens.length}...`);
                }
            } finally {
                await pagina.close();
            }
        };
        await Promise.all(Array.from({ length: 4 }, trabalhar));
    } finally {
        await navegador.close();
        fs.rmSync(pasta, { recursive: true, force: true });
    }
    if (problemas.length) {
        // O que saiu com mais de uma página não fica guardado: o próximo build desenha de novo.
        throw new Error(`PDFs dos modelos fora do tamanho:\n  ${problemas.join('\n  ')}`);
    }
    return { gerados, guardados };
}
