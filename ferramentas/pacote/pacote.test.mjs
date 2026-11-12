// Pacote da Hostinger: zip com os nomes em UTF-8 e "/" entre as pastas, conferido relendo tudo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RAIZ } from '../paginas/origem.mjs';
import {
    arquivoDoEndereco, arquivosNoAr, conferirZip, crc32, dentroDoProjeto, gravarZip, listar, nomesDoZip, pacoteAnterior,
    sobrasNoServidor, textoDasSobras,
} from './pacote.mjs';
import { SITE, absoluto } from '../../src/seo/paginas.js';

test('pacote: CRC-32 do formato zip', () => {
    assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
    assert.equal(crc32(Buffer.alloc(0)), 0);
});

test('pacote: só fora da pasta do projeto', () => {
    assert.ok(dentroDoProjeto(RAIZ));
    assert.ok(dentroDoProjeto(path.join(RAIZ, 'dist')));
    assert.ok(!dentroDoProjeto(path.join(RAIZ, '..', 'pacotes_site')));
    assert.ok(!dentroDoProjeto(os.tmpdir()));
});

test('pacote: nomes em outras escritas, pastas com "/", marca UTF-8 e conteúdo igual ao da pasta', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pacote-'));
    const pasta = path.join(base, 'dist');
    const zip = path.join(base, 'site.zip');
    const arquivos = {
        'index.html': '<!doctype html><title>x</title>',
        'ja-jp/ヘルプ/写真を追加.html': '写真'.repeat(500),
        'ar-sa/مساعدة.html': 'مساعدة',
        'he-il/עזרה/יצירת-יומן-עבודה.html': 'עזרה',
        'pt-br/ajuda/criar-rdo.html': 'a'.repeat(10000),
        'fontes/pdf/vazio.ttf': '',
        'imagem.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]),
    };
    try {
        for (const [nome, conteudo] of Object.entries(arquivos)) {
            const arq = path.join(pasta, ...nome.split('/'));
            fs.mkdirSync(path.dirname(arq), { recursive: true });
            fs.writeFileSync(arq, conteudo);
        }
        const itens = listar(pasta);
        assert.deepEqual(itens.filter((i) => !i.pasta).map((i) => i.nome).sort(), Object.keys(arquivos).sort());
        assert.ok(itens.some((i) => i.pasta && i.nome === 'ja-jp/ヘルプ/'));
        const resumo = gravarZip(itens, zip);
        assert.equal(resumo.itens, itens.length);
        assert.ok(resumo.bytesDoZip < resumo.bytesOriginais + 2000);
        assert.deepEqual(conferirZip(zip, itens), []);
        const bruto = fs.readFileSync(zip);
        assert.ok(bruto.includes(Buffer.from('ja-jp/ヘルプ/写真を追加.html', 'utf8')), 'nome em UTF-8 com "/"');
        assert.ok(!bruto.includes(Buffer.from('ja-jp\\', 'utf8')), 'sem "\\" nos nomes');
        // Zip que não bate com a pasta: a conferência acusa.
        fs.writeFileSync(path.join(pasta, 'ar-sa', 'مساعدة.html'), 'outro');
        assert.match(conferirZip(zip, itens).join(), /مساعدة\.html: conteúdo diferente/);
        fs.writeFileSync(path.join(pasta, 'novo.html'), 'x');
        assert.match(conferirZip(zip, listar(pasta)).join(), /no dist mas não no zip: novo\.html/);
    } finally {
        fs.rmSync(base, { recursive: true });
    }
});

test('sobras: arquivo no servidor da página de cada endereço (escrita do idioma, página inicial com barra)', () => {
    assert.equal(arquivoDoEndereco(`${SITE}/pt-br/`), 'pt-br/index.html');
    assert.equal(arquivoDoEndereco(`${SITE}/pt-br/ajuda`), 'pt-br/ajuda.html');
    assert.equal(arquivoDoEndereco(`${SITE}/en-us/help/topic/payroll`), 'en-us/help/topic/payroll.html');
    assert.equal(arquivoDoEndereco(absoluto('/ja-jp/ヘルプ/写真を追加')), 'ja-jp/ヘルプ/写真を追加.html');
    assert.equal(arquivoDoEndereco(`${SITE}/`), null);
    assert.equal(arquivoDoEndereco('https://expertbr.com/pt-br/'), null);
});

test('sobras: só páginas e sitemaps de idioma que não vêm no pacote novo; o resto do servidor fica', () => {
    const noServidor = [
        'pt-br/index.html', 'pt-br/ajuda/criar-rdo.html', 'pt-br/ajuda/artigo-que-saiu.html', 'fr-fr/aide/nom-ancien.html',
        'sitemap-pt-br.xml', 'sitemap-xx-yy.xml', 'sitemap.xml', 'assets/index-velho.js', 'dados/ajuda/pt-BR.aaaaaaaaaaaa.json',
        'download/ObraFacil.exe', 'email/logo-obrafacil.png', 'fontes/pdf/x.ttf', 'index.html', 'pt-br/ajuda/artigo-que-saiu.html',
    ];
    const doPacote = ['pt-br/index.html', 'pt-br/ajuda/criar-rdo.html', 'fr-fr/aide/nom-nouveau.html', 'sitemap-pt-br.xml', 'sitemap.xml', 'assets/index-novo.js', 'index.html'];
    assert.deepEqual(sobrasNoServidor(noServidor, doPacote), ['fr-fr/aide/nom-ancien.html', 'pt-br/ajuda/artigo-que-saiu.html', 'sitemap-xx-yy.xml']);
    assert.deepEqual(sobrasNoServidor(doPacote, doPacote), []);
    // O mesmo nome escrito de dois jeitos (letra com acento junta ou separada) é o mesmo arquivo.
    assert.deepEqual(sobrasNoServidor(['cs-cz/napoveda/vy\u0301pis.html'], ['cs-cz/napoveda/v\u00fdpis.html']), []);
});

test('sobras: o site no ar pelos sitemaps (índice e um por idioma)', async () => {
    const urlset = (locs) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${locs.map((l) => `<url><loc>${l}</loc></url>`).join('')}</urlset>`;
    const paginas = {
        [`${SITE}/sitemap.xml`]: `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${SITE}/sitemap-pt-br.xml</loc></sitemap><sitemap><loc>${SITE}/sitemap-ja-jp.xml</loc></sitemap></sitemapindex>`,
        [`${SITE}/sitemap-pt-br.xml`]: urlset([`${SITE}/pt-br/`, `${SITE}/pt-br/ajuda/criar-rdo`]),
        [`${SITE}/sitemap-ja-jp.xml`]: urlset([absoluto('/ja-jp/ヘルプ/写真を追加')]),
    };
    const lidos = await arquivosNoAr(async (url) => {
        if (!(url in paginas)) throw new Error(`HTTP 404 em ${url}`);
        return paginas[url];
    });
    assert.deepEqual(lidos, ['sitemap-pt-br.xml', 'pt-br/index.html', 'pt-br/ajuda/criar-rdo.html', 'sitemap-ja-jp.xml', 'ja-jp/ヘルプ/写真を追加.html']);
    await assert.rejects(arquivosNoAr(async () => { throw new Error('HTTP 500'); }), /HTTP 500/);
    await assert.rejects(arquivosNoAr(async () => '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>'), /nenhum sitemap/);
});

test('sobras: nomes do pacote anterior da pasta e o texto da lista', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pacote-sobras-'));
    try {
        const pasta = path.join(base, 'dist');
        for (const nome of ['pt-br/ajuda/criar-rdo.html', 'ja-jp/ヘルプ/写真を追加.html', 'index.html']) {
            const arq = path.join(pasta, ...nome.split('/'));
            fs.mkdirSync(path.dirname(arq), { recursive: true });
            fs.writeFileSync(arq, nome);
        }
        const pacotes = path.join(base, 'pacotes');
        fs.mkdirSync(pacotes);
        assert.equal(pacoteAnterior(pacotes, path.join(pacotes, 'site_obrafacil_2026-11-12_bbbbbbb.zip')), null);
        const antigo = path.join(pacotes, 'site_obrafacil_2026-11-02_aaaaaaa.zip');
        gravarZip(listar(pasta), antigo);
        assert.deepEqual(nomesDoZip(antigo).sort(), ['index.html', 'ja-jp/ヘルプ/写真を追加.html', 'pt-br/ajuda/criar-rdo.html']);
        const novo = path.join(pacotes, 'site_obrafacil_2026-11-12_bbbbbbb.zip');
        fs.writeFileSync(novo, 'ainda sendo gravado');
        assert.equal(pacoteAnterior(pacotes, novo), antigo);
        assert.equal(pacoteAnterior(path.join(base, 'nao-existe'), novo), null);
    } finally {
        fs.rmSync(base, { recursive: true });
    }
    const vazio = textoDasSobras({ zip: 'site.zip', sobras: [], fontes: ['o site no ar (sitemaps)'] });
    assert.match(vazio, /Nada a apagar/);
    const com = textoDasSobras({ zip: 'site.zip', sobras: ['fr-fr/aide/nom-ancien.html'], fontes: ['o site no ar (sitemaps)', 'o pacote anterior (x.zip)'], avisos: ['teste'] });
    assert.match(com, /1 arquivo\(s\)/);
    assert.match(com, / {2}fr-fr\/aide\/nom-ancien\.html\r\n/);
    assert.match(com, /Comparado com: o site no ar \(sitemaps\) e o pacote anterior \(x\.zip\)\./);
    assert.match(com, /ATENÇÃO: teste/);
});
