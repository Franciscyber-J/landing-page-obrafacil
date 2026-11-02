// Pacote da Hostinger: zip com os nomes em UTF-8 e "/" entre as pastas, conferido relendo tudo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RAIZ } from '../paginas/origem.mjs';
import { conferirZip, crc32, dentroDoProjeto, gravarZip, listar } from './pacote.mjs';

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
