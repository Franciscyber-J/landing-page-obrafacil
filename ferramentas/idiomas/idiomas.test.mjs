// Conferência dos plurais do npm run idiomas: roda a ferramenta numa cópia do projeto (pasta temporária), com textos
// alterados de propósito, e confere o que ela acusa. O projeto de verdade não é tocado.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COPIAR = ['ferramentas/idiomas/idiomas.mjs', 'src/i18n/idiomas.js', 'src/i18n/registro.js', 'src/i18n/pricing.js'];

// Cópia mínima do projeto; mudar(textos) altera os textos (por idioma) antes de rodar. Devolve código, saída e pendências.
function rodar(mudar = () => {}, args = []) {
    const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'idiomas-'));
    try {
        for (const rel of COPIAR) {
            fs.mkdirSync(path.dirname(path.join(pasta, rel)), { recursive: true });
            fs.copyFileSync(path.join(RAIZ, rel), path.join(pasta, rel));
        }
        const textosOrigem = path.join(RAIZ, 'src', 'i18n', 'textos');
        const textos = {};
        for (const nome of fs.readdirSync(textosOrigem).filter((n) => n.endsWith('.json'))) {
            textos[nome.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(textosOrigem, nome), 'utf8'));
        }
        mudar(textos);
        const destino = path.join(pasta, 'src', 'i18n', 'textos');
        fs.mkdirSync(destino, { recursive: true });
        for (const [codigo, dados] of Object.entries(textos)) fs.writeFileSync(path.join(destino, `${codigo}.json`), JSON.stringify(dados));
        const r = spawnSync(process.execPath, [path.join(pasta, 'ferramentas', 'idiomas', 'idiomas.mjs'), ...args], { encoding: 'utf8' });
        const arquivo = path.join(destino, 'PENDENCIAS.md');
        return { codigo: r.status, saida: `${r.stdout}${r.stderr}`, pendencias: fs.existsSync(arquivo) ? fs.readFileSync(arquivo, 'utf8') : '' };
    } finally {
        fs.rmSync(pasta, { recursive: true, force: true });
    }
}

test('textos de hoje: sem erro e com a tabela de plurais dos idiomas', () => {
    const r = rodar();
    assert.equal(r.codigo, 0, r.saida);
    assert.match(r.pendencias, /## Plurais/);
    assert.match(r.pendencias, /\| pt-PT \| one \(1\), many .*, other \(0, 2–1000\) \| — \|/);
});

test('número sem plural no pt-BR: erro', () => {
    const r = rodar((t) => { t['pt-BR'].ajuda.obrasTeste = '{{count}} obras'; });
    assert.equal(r.codigo, 1);
    assert.match(r.saida, /ajuda\.obrasTeste tem \{\{count\}\} e não é plural/);
});

test('forma "other" sem o número: erro', () => {
    const r = rodar((t) => { t['en-US'].ajuda.artigos_other = 'articles'; });
    assert.equal(r.codigo, 1);
    assert.match(r.saida, /en-US\.json: ajuda\.artigos_other tem \{\{\.\.\.\}\} diferente/);
});

test('forma de um número só pode trazer a palavra no lugar do número (en one = 1); a que vale para vários, não', () => {
    assert.equal(rodar((t) => { t['en-US'].ajuda.artigos_one = 'One article'; }).codigo, 0);
    // pt-BR "one" vale para 0 e 1: o número é obrigatório
    const r = rodar((t) => { t['pt-BR'].ajuda.artigos_one = 'um artigo'; });
    assert.equal(r.codigo, 1);
    assert.match(r.saida, /pt-BR\.json: ajuda\.artigos_one tem \{\{\.\.\.\}\} diferente/);
});

test('forma que falta num idioma: pendência por idioma (não para o build)', () => {
    const r = rodar((t) => { delete t['es-ES'].ajuda.artigos_many; });
    assert.equal(r.codigo, 0, r.saida);
    assert.match(r.saida, /es-ES {2}1 a traduzir; plural sem as formas: ajuda\.artigos \(many\)/);
    assert.match(r.pendencias, /\| es-ES \| .* \| `ajuda\.artigos` \(many\) \|/);
});

test('plurais de um idioma ainda não cadastrado (árabe, hebraico)', () => {
    const r = rodar(undefined, ['plurais', 'ar-SA', 'he-IL']);
    assert.equal(r.codigo, 0, r.saida);
    assert.match(r.saida, /ar-SA \(não cadastrado\): zero \(0\), one \(1\), two \(2\), few \(3–10/);
    assert.match(r.saida, /precisa de: zero, one, two, few, many, other/);
    assert.match(r.saida, /he-IL \(não cadastrado\): one \(1\), two \(2\), other/);
});
