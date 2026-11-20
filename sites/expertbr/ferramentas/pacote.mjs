#!/usr/bin/env node
// Pacote do site da ExpertBR para a Hostinger: um zip com O CONTEÚDO de sites/expertbr/dist (não a pasta), para
// extrair em public_html, e ao lado a cópia do .htaccess que vai junto. Usa o mesmo gravador de zip do site do
// ObraFácil (ferramentas/pacote/pacote.mjs: nomes em UTF-8 com "/", conferido arquivo por arquivo depois de gravado).
//
//   npm run expertbr:pacote -- D:\Projetos\pacotes_site
//   npm run expertbr:pacote -- D:\Projetos\pacotes_site --fora-da-main   (só para voltar a uma versão antiga)
//
// Recusa: pasta dentro do projeto, dist que não passa na conferência, mudança não gravada no código, branch que não
// é a main. Grava site_expertbr_<data>_<commit>.zip e site_expertbr_<data>_<commit>.htaccess.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { conferirZip, dentroDoProjeto, gravarZip, listar } from '../../../ferramentas/pacote/pacote.mjs';
import { conferirDist } from './conferir.mjs';

const PASTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.resolve(PASTA, '..', '..');
const DIST = path.join(PASTA, 'dist');
const git = (...args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' }).trim();

function principal() {
    const args = process.argv.slice(2);
    const destino = args.find((a) => !a.startsWith('--'));
    if (!destino) throw new Error('diga a pasta do pacote, fora do projeto. Ex.: npm run expertbr:pacote -- D:\\Projetos\\pacotes_site');
    if (dentroDoProjeto(destino)) throw new Error('a pasta do pacote tem de ficar fora da pasta do projeto');
    if (!fs.existsSync(path.join(DIST, 'pt-br', 'index.html'))) throw new Error('sem dist: rode npm run expertbr:build antes');
    if (git('status', '--porcelain', '--', 'sites/expertbr', 'src/i18n', 'src/styles', 'src/index.css', 'src/fontes', 'public/telas', 'package.json')) {
        throw new Error('há mudança não gravada no código (git status): grave ou desfaça antes de gerar o pacote');
    }
    if (!args.includes('--fora-da-main') && git('branch', '--show-current') !== 'main') throw new Error('o pacote sai da main (ou use --fora-da-main para voltar a uma versão antiga)');
    const { problemas } = conferirDist(DIST);
    if (problemas.length) throw new Error(`o dist tem ${problemas.length} problema(s): rode npm run expertbr:build de novo`);

    fs.mkdirSync(destino, { recursive: true });
    const agora = new Date();
    const data = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}_${String(agora.getHours()).padStart(2, '0')}${String(agora.getMinutes()).padStart(2, '0')}`;
    const nome = `site_expertbr_${data}_${git('rev-parse', '--short=8', 'HEAD')}`;
    const zip = path.join(destino, `${nome}.zip`);
    const itens = listar(DIST);
    if (itens.some((i) => i.nome === 'appobrafacil/' || i.nome.startsWith('appobrafacil/'))) throw new Error('o dist não pode ter a pasta appobrafacil');
    gravarZip(itens, zip);
    const erros = conferirZip(zip, itens);
    if (erros.length) {
        fs.rmSync(zip, { force: true });
        throw new Error(`zip com problema (apagado): ${erros.slice(0, 5).join('; ')}`);
    }
    fs.copyFileSync(path.join(PASTA, 'hospedagem', '.htaccess'), path.join(destino, `${nome}.htaccess`));
    const tamanho = (fs.statSync(zip).size / 1024 / 1024).toFixed(1);
    console.log(`Pacote pronto: ${zip} (${tamanho} MB, ${itens.filter((i) => !i.pasta).length} arquivos), zip relido e conferido arquivo por arquivo.`);
    console.log(`.htaccess desta versão: ${path.join(destino, `${nome}.htaccess`)} (vai para public_html/.htaccess, por último).`);
}

try {
    principal();
} catch (erro) {
    console.error(`\nERRO no pacote da ExpertBR: ${erro.message}`);
    process.exit(1);
}
