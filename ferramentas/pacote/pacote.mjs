#!/usr/bin/env node
// Pacote do site para a Hostinger: o CONTEÚDO de dist/ num zip, gravado FORA da pasta do projeto.
//
//   npm run pacote -- D:\Projetos\pacotes_site
//       grava D:\Projetos\pacotes_site\site_obrafacil_<data>_<commit>.zip e confere o zip relendo tudo.
//
// Por que um gerador próprio: com os 29 idiomas, muitos arquivos têm o nome na escrita do idioma
// (ja-jp/ヘルプ/写真を追加.html, ar-sa/مساعدة.html). O zip daqui grava os nomes em UTF-8 (com a marca de UTF-8 do
// formato zip) e com "/" entre as pastas, que é o que o servidor da Hostinger (Linux) precisa para extrair os
// arquivos com o nome certo. O "Compactar" do Windows e o Compress-Archive do Windows PowerShell 5.1 podem gravar
// "\" no lugar de "/" ou o nome em outra codificação: aí as páginas prontas ficam com o nome errado no servidor.
//
// Recusa: dist/ que não veio de um "npm run build" completo, dist de teste (conteúdo de pasta local ou sem o
// Firestore), pasta de destino dentro do projeto, e a branch diferente da main (para testar: --fora-da-main).
// O .htaccess não entra no zip: ele vai por último, à parte (skill publicar-site).

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ORIGEM, RAIZ } from '../paginas/origem.mjs';
import { conferirDist } from '../paginas/conferir.mjs';

const DIST = path.join(RAIZ, 'dist');

// ---------- CRC-32 (o do formato zip) ----------
const TABELA = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});
export function crc32(dados) {
    let c = 0xffffffff;
    for (let i = 0; i < dados.length; i++) c = TABELA[(c ^ dados[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

// Data e hora no formato do MS-DOS (o do zip), em hora local.
function dataDos(d) {
    const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
    const data = ((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { hora, data };
}

// Arquivos e pastas de uma pasta, com o caminho relativo em "/" e o nome em NFC (como no servidor).
export function listar(pasta) {
    const itens = [];
    const andar = (atual, relativo) => {
        const entradas = fs.readdirSync(atual, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        for (const e of entradas) {
            const rel = relativo ? `${relativo}/${e.name.normalize('NFC')}` : e.name.normalize('NFC');
            const abs = path.join(atual, e.name);
            if (e.isDirectory()) {
                itens.push({ nome: `${rel}/`, pasta: true, abs });
                andar(abs, rel);
            } else if (e.isFile()) {
                itens.push({ nome: rel, pasta: false, abs });
            } else {
                throw new Error(`dist/${rel}: nem arquivo nem pasta (link?); o pacote não sabe levar isso`);
            }
        }
    };
    andar(pasta, '');
    return itens;
}

const UTF8 = 0x0800; // bit 11: nome em UTF-8
const FEITO_EM_UNIX = (3 << 8) | 20; // "feito em" Unix, versão 2.0: o servidor lê as permissões abaixo
const PERMISSAO_ARQUIVO = (0o100644 << 16) >>> 0;
const PERMISSAO_PASTA = ((0o040755 << 16) | 0x10) >>> 0;

// Grava o zip (deflate; o que não diminui vai sem compressão). Devolve o resumo.
export function gravarZip(itens, destino) {
    const saida = fs.openSync(destino, 'w');
    const central = [];
    let posicao = 0;
    const escrever = (buf) => {
        fs.writeSync(saida, buf);
        posicao += buf.length;
    };
    let bytesOriginais = 0;
    try {
        for (const item of itens) {
            const nome = Buffer.from(item.nome, 'utf8');
            if (nome.length > 0xffff) throw new Error(`nome longo demais: ${item.nome}`);
            const { hora, data } = dataDos(item.pasta ? new Date() : fs.statSync(item.abs).mtime);
            const bruto = item.pasta ? Buffer.alloc(0) : fs.readFileSync(item.abs);
            bytesOriginais += bruto.length;
            const comprimido = bruto.length ? zlib.deflateRawSync(bruto, { level: 9 }) : bruto;
            const metodo = comprimido.length < bruto.length ? 8 : 0;
            const corpo = metodo === 8 ? comprimido : bruto;
            const crc = crc32(bruto);
            if (corpo.length > 0xfffffffe || bruto.length > 0xfffffffe || posicao > 0xfffffffe) throw new Error('pacote passa de 4 GB (zip64 não é usado)');
            const local = Buffer.alloc(30);
            local.writeUInt32LE(0x04034b50, 0);
            local.writeUInt16LE(20, 4);
            local.writeUInt16LE(UTF8, 6);
            local.writeUInt16LE(metodo, 8);
            local.writeUInt16LE(hora, 10);
            local.writeUInt16LE(data, 12);
            local.writeUInt32LE(crc, 14);
            local.writeUInt32LE(corpo.length, 18);
            local.writeUInt32LE(bruto.length, 22);
            local.writeUInt16LE(nome.length, 26);
            local.writeUInt16LE(0, 28);
            const inicio = posicao;
            escrever(local);
            escrever(nome);
            escrever(corpo);
            const c = Buffer.alloc(46);
            c.writeUInt32LE(0x02014b50, 0);
            c.writeUInt16LE(FEITO_EM_UNIX, 4);
            c.writeUInt16LE(20, 6);
            c.writeUInt16LE(UTF8, 8);
            c.writeUInt16LE(metodo, 10);
            c.writeUInt16LE(hora, 12);
            c.writeUInt16LE(data, 14);
            c.writeUInt32LE(crc, 16);
            c.writeUInt32LE(corpo.length, 20);
            c.writeUInt32LE(bruto.length, 24);
            c.writeUInt16LE(nome.length, 28);
            c.writeUInt16LE(0, 30);
            c.writeUInt16LE(0, 32);
            c.writeUInt16LE(0, 34);
            c.writeUInt16LE(0, 36);
            c.writeUInt32LE(item.pasta ? PERMISSAO_PASTA : PERMISSAO_ARQUIVO, 38);
            c.writeUInt32LE(inicio, 42);
            central.push(c, nome);
        }
        if (itens.length > 0xffff) throw new Error('mais de 65.535 itens no pacote (zip64 não é usado)');
        const inicioCentral = posicao;
        for (const parte of central) escrever(parte);
        const fim = Buffer.alloc(22);
        fim.writeUInt32LE(0x06054b50, 0);
        fim.writeUInt16LE(0, 4);
        fim.writeUInt16LE(0, 6);
        fim.writeUInt16LE(itens.length, 8);
        fim.writeUInt16LE(itens.length, 10);
        fim.writeUInt32LE(posicao - inicioCentral, 12);
        fim.writeUInt32LE(inicioCentral, 16);
        fim.writeUInt16LE(0, 20);
        escrever(fim);
    } finally {
        fs.closeSync(saida);
    }
    return { itens: itens.length, bytesOriginais, bytesDoZip: fs.statSync(destino).size };
}

// Lê o zip de volta (diretório central) e confere cada item contra a pasta: nome, marca UTF-8, tamanho, CRC e o
// conteúdo descomprimido. Devolve a lista de problemas.
export function conferirZip(arquivo, itens) {
    const problemas = [];
    const zip = fs.readFileSync(arquivo);
    const fim = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (fim < 0) return ['zip sem o fim do diretório central'];
    const total = zip.readUInt16LE(fim + 10);
    let p = zip.readUInt32LE(fim + 16);
    const esperados = new Map(itens.map((i) => [i.nome, i]));
    if (total !== itens.length) problemas.push(`zip com ${total} itens; a pasta tem ${itens.length}`);
    for (let n = 0; n < total; n++) {
        if (zip.readUInt32LE(p) !== 0x02014b50) {
            problemas.push('diretório central quebrado');
            break;
        }
        const flags = zip.readUInt16LE(p + 8);
        const metodo = zip.readUInt16LE(p + 10);
        const crc = zip.readUInt32LE(p + 16);
        const tamanho = zip.readUInt32LE(p + 20);
        const original = zip.readUInt32LE(p + 24);
        const lNome = zip.readUInt16LE(p + 28);
        const lExtra = zip.readUInt16LE(p + 30);
        const lComent = zip.readUInt16LE(p + 32);
        const local = zip.readUInt32LE(p + 42);
        const nome = zip.subarray(p + 46, p + 46 + lNome).toString('utf8');
        p += 46 + lNome + lExtra + lComent;
        const item = esperados.get(nome);
        if (!item) {
            problemas.push(`no zip mas não no dist: ${nome}`);
            continue;
        }
        esperados.delete(nome);
        if (!(flags & UTF8)) problemas.push(`${nome}: sem a marca de UTF-8`);
        if (nome.includes('\\')) problemas.push(`${nome}: com "\\" no nome`);
        if (item.pasta) continue;
        const inicio = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
        const corpo = zip.subarray(inicio, inicio + tamanho);
        const dados = metodo === 8 ? zlib.inflateRawSync(corpo) : corpo;
        const noDisco = fs.readFileSync(item.abs);
        if (dados.length !== original || crc32(dados) !== crc || !dados.equals(noDisco)) problemas.push(`${nome}: conteúdo diferente do dist`);
    }
    for (const nome of esperados.keys()) problemas.push(`no dist mas não no zip: ${nome}`);
    return problemas;
}

function git(...args) {
    try {
        return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' }).trim();
    } catch {
        return null;
    }
}

export function dentroDoProjeto(destino) {
    const rel = path.relative(RAIZ, path.resolve(destino));
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function principal() {
    const args = process.argv.slice(2);
    const foraDaMain = args.includes('--fora-da-main');
    const pasta = args.find((a) => !a.startsWith('--'));
    if (!pasta) throw new Error('diga a pasta do pacote, fora do projeto. Ex.: npm run pacote -- D:\\Projetos\\pacotes_site');
    if (dentroDoProjeto(pasta)) throw new Error('a pasta do pacote tem de ficar fora da pasta do projeto');

    if (!fs.existsSync(ORIGEM) || !fs.existsSync(path.join(DIST, 'sitemap.xml'))) {
        throw new Error('dist/ não veio de um "npm run build" completo: rode npm run build antes');
    }
    const origem = JSON.parse(fs.readFileSync(ORIGEM, 'utf8'));
    if (origem.conteudo !== 'firestore') {
        throw new Error('este dist/ foi gerado com conteúdo de teste (pasta local ou sem o Firestore) e não é para publicar: rode npm run build');
    }
    const commit = git('rev-parse', 'HEAD');
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
    const sujo = git('status', '--porcelain', '--', 'src', 'public', 'ferramentas', 'index.html', 'package.json', 'package-lock.json', 'vite.config.js');
    if (origem.commit && commit && origem.commit !== commit) {
        throw new Error(`o dist/ é do commit ${origem.commit.slice(0, 7)}, mas a pasta está no ${commit.slice(0, 7)}: rode npm run build de novo`);
    }
    if (!foraDaMain && branch !== 'main') throw new Error(`a pasta está na branch ${branch}; o pacote para publicar sai da main (git switch main; git pull; npm run build)`);
    if (!foraDaMain && sujo) throw new Error(`há mudanças não gravadas no código:\n${sujo}\nO pacote sai da main sem mudanças locais.`);

    console.log('Conferindo o dist/ (páginas prontas, sitemaps, robots.txt e llms.txt)...');
    const conferencia = conferirDist(DIST);
    if (conferencia.problemas.length) {
        for (const pr of conferencia.problemas.slice(0, 30)) console.error(`  ${pr}`);
        throw new Error(`${conferencia.problemas.length} problema(s) no dist/: rode npm run build de novo`);
    }

    fs.mkdirSync(pasta, { recursive: true });
    const dia = origem.geradoEm.slice(0, 10);
    const destino = path.join(path.resolve(pasta), `site_obrafacil_${dia}_${(commit ?? 'sem-git').slice(0, 7)}.zip`);
    const itens = listar(DIST);
    if (itens.some((i) => i.nome === '.htaccess')) throw new Error('dist/.htaccess não devia existir: o .htaccess vai à parte, por último');
    console.log(`Gravando ${itens.filter((i) => !i.pasta).length} arquivo(s) e ${itens.filter((i) => i.pasta).length} pasta(s)...`);
    const resumo = gravarZip(itens, destino);
    const problemas = conferirZip(destino, itens);
    if (problemas.length) {
        for (const pr of problemas.slice(0, 30)) console.error(`  ${pr}`);
        fs.rmSync(destino, { force: true });
        throw new Error('o zip saiu diferente do dist/ e foi apagado');
    }
    const mb = (b) => (b / 1024 / 1024).toFixed(1).replace('.', ',');
    console.log(`\nPacote pronto: ${destino}`);
    console.log(`  ${resumo.itens} itens, ${mb(resumo.bytesOriginais)} MB no dist, ${mb(resumo.bytesDoZip)} MB no zip`);
    console.log(`  conteúdo do Firestore lido em ${origem.geradoEm}; idiomas da Central: ${origem.idiomasDaCentral.length}`);
    console.log(`  commit ${commit?.slice(0, 7) ?? '?'} (${branch ?? '?'}); zip relido e conferido arquivo por arquivo.`);
    console.log('O .htaccess (hospedagem/.htaccess) vai à parte, por último.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        principal();
    } catch (erro) {
        console.error(`\nERRO no pacote: ${erro.message}`);
        process.exit(1);
    }
}
