// Build do site da ExpertBR (expertbr.com), separado do site do ObraFácil (raiz deste repositório).
//
//   npm run expertbr:build   (na raiz do repositório)
//
// 1. vite build (este arquivo): o CSS, o script pequeno do navegador (tema e menu de idioma), as fontes de cada
//    escrita e as imagens, em sites/expertbr/dist.
// 2. vite build --ssr src/servidor.jsx: desenha as páginas em HTML no build (React só no build; no navegador vai
//    HTML pronto, sem React).
// 3. ferramentas/gerar.mjs: grava uma página pronta por idioma, sitemap.xml, robots.txt e llms.txt e confere tudo.
//
// Reaproveita do site do ObraFácil (sem copiar): cores e medidas (src/styles/design-tokens.css), fontes
// (@fontsource e src/fontes/<escrita>.css), cadastro e regras dos idiomas (src/i18n), textos do ObraFácil,
// telas reais do app (public/telas) e bandeiras (pacote flag-icons).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDIOMAS } from '../../src/i18n/registro.js';
import { escritasDoCadastro } from '../../src/fontes/escritas.js';
import { arquivosDasTelas } from './src/produtos.js';

const PASTA = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(PASTA, '..', '..');

// Bandeiras do menu de idiomas (só as dos idiomas do cadastro) e as telas reais do ObraFácil que os cartões mostram,
// copiadas do site do ObraFácil para o dist daqui: o site da ExpertBR não busca imagem em outro endereço.
function arquivosDoObraFacil() {
    const bandeiras = path.join(RAIZ, 'node_modules', 'flag-icons', 'flags', '4x3');
    const paises = [...new Set(IDIOMAS.map((i) => i.pais.toLowerCase()))];
    const telas = arquivosDasTelas();
    return {
        name: 'arquivos-do-obrafacil',
        apply: 'build',
        buildStart() {
            for (const pais of paises) if (!fs.existsSync(path.join(bandeiras, `${pais}.svg`))) this.error(`Bandeira não encontrada: ${pais}`);
            for (const t of telas) if (!fs.existsSync(path.join(RAIZ, 'public', t))) this.error(`Tela não encontrada: public/${t}`);
        },
        generateBundle() {
            for (const pais of paises) {
                this.emitFile({ type: 'asset', fileName: `bandeiras/${pais}.svg`, source: fs.readFileSync(path.join(bandeiras, `${pais}.svg`)) });
            }
            for (const t of telas) this.emitFile({ type: 'asset', fileName: t, source: fs.readFileSync(path.join(RAIZ, 'public', t)) });
        },
    };
}

// Uma entrada de CSS por escrita que algum idioma usa (japonesa, árabe...): a página daquele idioma liga só a dela.
function entradasDasFontes() {
    const usadas = [...new Set(Object.values(escritasDoCadastro(IDIOMAS)))].sort();
    return Object.fromEntries(usadas.map((e) => [`fonte-${e}`, path.join(RAIZ, 'src', 'fontes', `${e}.css`)]));
}

export default defineConfig(({ isSsrBuild }) => ({
    root: PASTA,
    base: '/',
    publicDir: path.join(PASTA, 'public'),
    plugins: [react(), ...(isSsrBuild ? [] : [arquivosDoObraFacil()])],
    build: isSsrBuild
        ? { outDir: path.join(PASTA, 'dist-ssr'), emptyOutDir: true, copyPublicDir: false }
        : {
            outDir: path.join(PASTA, 'dist'),
            emptyOutDir: true,
            manifest: true,
            assetsInlineLimit: 0,
            rollupOptions: { input: { principal: path.join(PASTA, 'index.html'), ...entradasDasFontes() } },
        },
}));
