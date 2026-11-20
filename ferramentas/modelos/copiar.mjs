#!/usr/bin/env node
// Modelos grátis do site (checklists de qualidade e diário de obra): copia do app (gestao_obras) os dados que as
// páginas e os PDFs usam, para o site mostrar exatamente o que o app tem (decisão do Francis, 20/11/2026: a pessoa
// encontra no app o mesmo modelo que viu no site).
//
//   npm run modelos -- copiar [pasta do gestao_obras]    (padrão: ../gestao_obras, ao lado desta pasta)
//   npm run modelos -- conferir [pasta do gestao_obras]  confere se a cópia está igual ao app (não grava nada)
//
// O que vem do app, em cada um dos idiomas do site:
//   - assets/checklists/estrutura.json e assets/checklists/<idioma>.json: os 27 modelos prontos (grupo, itens, seção,
//     item crítico, foto obrigatória) com o texto nativo de cada idioma; a variante regional (pt_PT, en_GB...) por
//     cima da base, como o app faz (lib/checklists/biblioteca_de_checklists.dart);
//   - lib/l10n/app_<idioma>.arb: os rótulos dos PDFs do app (Ficha de Verificação de Serviço, colunas, respostas,
//     seções, não conformidade, liberação) e os campos do diário de obra (clima, efetivo, atividades, fotos,
//     responsável técnico). Os {nome} dos textos do app ficam como estão: o PDF do site troca por um espaço em branco
//     para preencher à mão.
// Grava src/modelos/dados/<idioma do site>.json (um por idioma) e src/modelos/dados/origem.json (commit e data do app
// de onde veio a cópia). Nada é inventado: falta um modelo, um item ou um texto em algum idioma, para com o erro.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DESTINO = path.join(RAIZ, 'src', 'modelos', 'dados');
const { IDIOMAS } = await import(pathToFileURL(path.join(RAIZ, 'src', 'i18n', 'idiomas.js')).href);

// Mesma relação do app (baseDaVariante em biblioteca_de_checklists.dart).
const BASE_DA_VARIANTE = { pt_PT: 'pt_BR', en_GB: 'en_US', en_AU: 'en_US', en_CA: 'en_US', es_MX: 'es_ES' };
const SECOES = ['A', 'D', 'C'];

// Textos do app usados pelas páginas e pelos PDFs dos modelos (src/modelos/LEIAME.md). Só texto simples, com no
// máximo {nome} (sem plural nem select do ICU).
export const CHAVES_DO_APP = [
    // Ficha de Verificação de Serviço (PDF do checklist no app, lib/services/pdf/checklist_pdf_service.dart)
    'checklistPdfTitulo', 'checklistPdfModelo', 'checklistPdfObra', 'checklistPdfLocal', 'checklistPdfEtapa',
    'checklistPdfDataDaInspecao', 'checklistPdfAplicadoPor', 'checklistPdfColunaNumero', 'checklistPdfColunaItem',
    'checklistPdfColunaResultado', 'checklistPdfColunaObservacao', 'checklistRespostaConforme',
    'checklistRespostaNaoConforme', 'checklistRespostaNaoSeAplica', 'checklistSecaoAntes', 'checklistSecaoDurante',
    'checklistSecaoConclusao', 'checklistItemCritico', 'checklistFotoObrigatoria', 'checklistPdfNaoConformidades',
    'checklistPdfOQueEstaErrado', 'checklistPdfAcaoCorretiva', 'checklistPdfReinspecao', 'checklistPdfLiberacao',
    'checklistPdfLiberadoSemRessalvas', 'checklistPdfLiberadoComRessalvas', 'checklistPdfNaoLiberado',
    'checklistPdfRessalvas', 'checklistPdfAssinadoPor',
    // Diário de obra (tela Novo RDO e PDF do RDO no app, lib/services/pdf/rdo_pdf_service.dart)
    'pdfRdoTitle', 'pdfRdoDateClient', 'rdoFormWeatherTitle', 'weatherSunny', 'weatherCloudy', 'weatherRainy',
    'weatherShowers', 'weatherVariable', 'pdfRdoPhysicalProgress', 'pdfRdoWorkforceTitle', 'pdfRdoColName',
    'pdfRdoColRole', 'pdfRdoColPresence', 'pdfRdoPresenceFull', 'pdfRdoPresenceHalf', 'rdoFormLaborAbsent',
    'rdoFormLaborExtraTitle', 'rdoFormLaborHoursWorked', 'pdfRdoActivitiesTitle', 'rdoFormObsTitle',
    'pdfRdoPhotosTitle', 'rdoFormSignatureTitle',
    // Rodapé dos PDFs do app (pdf_commons.dart)
    'pdfPage', 'pdfOf',
];

const sufixoDoApp = (codigo) => codigo.replace('-', '_');

function lerJson(arquivo) {
    try {
        return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    } catch (erro) {
        throw new Error(`não consegui ler ${arquivo}: ${erro.message}`);
    }
}

// [cima] por cima de [base], chave a chave (igual ao sobrepor do app).
function sobrepor(base, cima) {
    const resultado = { ...base };
    for (const [chave, valor] of Object.entries(cima)) {
        const antes = resultado[chave];
        resultado[chave] = antes && typeof antes === 'object' && !Array.isArray(antes) && valor && typeof valor === 'object' && !Array.isArray(valor)
            ? sobrepor(antes, valor) : valor;
    }
    return resultado;
}

function textosDaBiblioteca(pasta, sufixo) {
    const ler = (s) => {
        const arquivo = path.join(pasta, 'assets', 'checklists', `${s}.json`);
        return fs.existsSync(arquivo) ? lerJson(arquivo) : null;
    };
    const base = BASE_DA_VARIANTE[sufixo];
    const proprio = ler(sufixo);
    if (base) {
        const daBase = ler(base);
        if (!daBase) throw new Error(`assets/checklists/${base}.json não existe (base de ${sufixo})`);
        return proprio ? sobrepor(daBase, proprio) : daBase;
    }
    if (!proprio) throw new Error(`assets/checklists/${sufixo}.json não existe: o idioma não tem os modelos prontos no app`);
    return proprio;
}

function textoValido(v) {
    return typeof v === 'string' && v.trim().length > 0;
}

// Os dados de um idioma do site. erros: lista onde cada problema entra.
export function montarIdioma({ estrutura, textos, arb, codigo, erros }) {
    const onde = `${codigo}`;
    const grupos = [];
    for (const g of estrutura.grupos ?? []) {
        const nome = textos.grupos?.[g];
        if (!textoValido(nome)) erros.push(`${onde}: grupo ${g} sem nome`);
        grupos.push({ id: g, nome: nome ?? g });
    }
    const modelos = [];
    for (const m of estrutura.modelos ?? []) {
        const t = textos.modelos?.[m.servico];
        if (!t || !textoValido(t.nome)) {
            erros.push(`${onde}: modelo ${m.servico} sem nome`);
            continue;
        }
        if (!grupos.some((g) => g.id === m.grupo)) erros.push(`${onde}: modelo ${m.servico} com grupo desconhecido ${m.grupo}`);
        const itens = [];
        for (const i of m.itens ?? []) {
            const texto = t.itens?.[i.codigo];
            if (!textoValido(texto)) {
                erros.push(`${onde}: modelo ${m.servico}, item ${i.codigo} sem texto`);
                continue;
            }
            if (!SECOES.includes(i.secao)) erros.push(`${onde}: modelo ${m.servico}, item ${i.codigo} com seção ${i.secao}`);
            itens.push({ codigo: String(i.codigo), secao: i.secao, texto: texto.trim(), critico: i.critico === true, foto: i.foto_obrigatoria === true });
        }
        modelos.push({ id: m.servico, grupo: m.grupo, nome: t.nome.trim(), itens });
    }
    for (const campo of ['nota_da_biblioteca', 'criterio_padrao']) if (!textoValido(textos[campo])) erros.push(`${onde}: ${campo} vazio`);
    const app = {};
    for (const chave of CHAVES_DO_APP) {
        const valor = arb[chave];
        if (!textoValido(valor)) {
            erros.push(`${onde}: o texto ${chave} não existe no ARB do app`);
            continue;
        }
        if (/\{[^}]*,/.test(valor)) erros.push(`${onde}: ${chave} usa plural/select do ICU, que o site não lê`);
        app[chave] = valor;
    }
    return {
        idioma: codigo,
        biblioteca: {
            versao: estrutura.versao ?? 1,
            nota: textos.nota_da_biblioteca,
            criterio: textos.criterio_padrao,
            grupos,
            modelos,
        },
        app,
    };
}

function origemDoApp(pasta) {
    try {
        const [commit, data] = execFileSync('git', ['-C', pasta, 'log', '-1', '--format=%H %cI', '--', 'assets/checklists', 'lib/l10n'], { encoding: 'utf8' }).trim().split(' ');
        return { commit, data };
    } catch {
        return { commit: null, data: null };
    }
}

// Tudo o que seria gravado, em memória: { arquivos: Map(nome → conteúdo), erros }.
export function lerDoApp(pasta) {
    const erros = [];
    const estrutura = lerJson(path.join(pasta, 'assets', 'checklists', 'estrutura.json'));
    if ((estrutura.modelos ?? []).length !== 27) erros.push(`estrutura.json com ${(estrutura.modelos ?? []).length} modelos (o site espera os 27 do app)`);
    const arquivos = new Map();
    for (const i of IDIOMAS) {
        const sufixo = sufixoDoApp(i.codigo);
        let textos;
        try {
            textos = textosDaBiblioteca(pasta, sufixo);
        } catch (erro) {
            erros.push(`${i.codigo}: ${erro.message}`);
            continue;
        }
        const arquivoArb = path.join(pasta, 'lib', 'l10n', `app_${sufixo}.arb`);
        if (!fs.existsSync(arquivoArb)) {
            erros.push(`${i.codigo}: lib/l10n/app_${sufixo}.arb não existe`);
            continue;
        }
        const dados = montarIdioma({ estrutura, textos, arb: lerJson(arquivoArb), codigo: i.codigo, erros });
        arquivos.set(`${i.codigo}.json`, `${JSON.stringify(dados, null, 1)}\n`);
    }
    const origem = origemDoApp(pasta);
    arquivos.set('origem.json', `${JSON.stringify({
        _leia: 'Copiado do app (gestao_obras) por "npm run modelos -- copiar". Não edite os arquivos desta pasta à mão.',
        commit: origem.commit,
        data: origem.data,
    }, null, 1)}\n`);
    return { arquivos, erros };
}

function principal() {
    const [comando = 'conferir', pastaArg] = process.argv.slice(2);
    const pasta = path.resolve(pastaArg ?? path.join(RAIZ, '..', 'gestao_obras'));
    if (!fs.existsSync(path.join(pasta, 'assets', 'checklists', 'estrutura.json'))) {
        console.error(`Não achei o app em ${pasta} (assets/checklists/estrutura.json). Passe a pasta do gestao_obras.`);
        process.exit(1);
    }
    const { arquivos, erros } = lerDoApp(pasta);
    if (erros.length) {
        for (const e of erros) console.error(`ERRO: ${e}`);
        console.error('Nada foi gravado.');
        process.exit(1);
    }
    if (comando === 'copiar') {
        fs.mkdirSync(DESTINO, { recursive: true });
        for (const nome of fs.readdirSync(DESTINO)) if (nome.endsWith('.json') && !arquivos.has(nome)) fs.rmSync(path.join(DESTINO, nome));
        for (const [nome, conteudo] of arquivos) fs.writeFileSync(path.join(DESTINO, nome), conteudo);
        console.log(`Modelos copiados do app: ${arquivos.size - 1} idioma(s) em src/modelos/dados (app ${JSON.parse(arquivos.get('origem.json')).commit?.slice(0, 8) ?? 'sem git'}).`);
        return;
    }
    if (comando === 'conferir') {
        const diferentes = [];
        for (const [nome, conteudo] of arquivos) {
            if (nome === 'origem.json') continue;
            const atual = path.join(DESTINO, nome);
            if (!fs.existsSync(atual) || fs.readFileSync(atual, 'utf8') !== conteudo) diferentes.push(nome);
        }
        if (diferentes.length) {
            console.error(`A cópia do site está diferente do app em: ${diferentes.join(', ')}. Rode: npm run modelos -- copiar ${pastaArg ?? ''}`.trim());
            process.exit(1);
        }
        console.log('Modelos do site iguais aos do app.');
        return;
    }
    console.error(`Comando desconhecido: ${comando}. Use: copiar | conferir [pasta do gestao_obras]`);
    process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
