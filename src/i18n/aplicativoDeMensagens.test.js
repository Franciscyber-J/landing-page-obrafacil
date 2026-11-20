// Conferência do mapa idioma → aplicativo de mensagens da conversa do "antes" (aplicativoDeMensagens.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODIGOS, idioma } from './idiomas.js';
import { APLICATIVOS, APLICATIVO_DO_IDIOMA, FORMATO, aplicativoDoIdioma } from './aplicativoDeMensagens.js';

const PASTA = path.dirname(fileURLToPath(import.meta.url));
const CSS_CORES = fs.readFileSync(path.join(PASTA, '..', 'styles', 'design-tokens.css'), 'utf8');

test('todo idioma cadastrado tem o aplicativo dele, e só aplicativos conhecidos', () => {
    for (const codigo of CODIGOS) {
        assert.ok(APLICATIVO_DO_IDIOMA[codigo], `${codigo} sem aplicativo em aplicativoDeMensagens.js`);
        assert.ok(APLICATIVOS.includes(APLICATIVO_DO_IDIOMA[codigo]), `${codigo}: aplicativo desconhecido`);
    }
    for (const codigo of Object.keys(APLICATIVO_DO_IDIOMA)) {
        assert.ok(CODIGOS.includes(codigo), `${codigo} está no mapa mas não no cadastro de idiomas`);
    }
});

test('os países de cada aplicativo, pelos dados de uso de 2025/2026', () => {
    assert.equal(aplicativoDoIdioma('pt-BR'), 'whatsapp');
    assert.equal(aplicativoDoIdioma('ja-JP'), 'line');
    assert.equal(aplicativoDoIdioma('th-TH'), 'line');
    assert.equal(aplicativoDoIdioma('zh-TW'), 'line');
    assert.equal(aplicativoDoIdioma('ko-KR'), 'kakao');
    assert.equal(aplicativoDoIdioma('vi-VN'), 'zalo');
    assert.equal(aplicativoDoIdioma('uk-UA'), 'telegram');
    assert.equal(aplicativoDoIdioma('el-GR'), 'viber');
    assert.equal(aplicativoDoIdioma('hu-HU'), 'messenger');
    assert.equal(aplicativoDoIdioma('pl-PL'), 'messenger');
    for (const c of ['en-US', 'en-CA', 'en-AU']) assert.equal(aplicativoDoIdioma(c), 'mensagens', c);
    // A variante pode ter outro aplicativo que a base: no Reino Unido é o WhatsApp, nos EUA as mensagens de texto.
    assert.equal(idioma('en-GB').base, 'en-US');
    assert.equal(aplicativoDoIdioma('en-GB'), 'whatsapp');
});

test('idioma fora do mapa cai no WhatsApp', () => {
    assert.equal(aplicativoDoIdioma('xx-YY'), 'whatsapp');
});

test('cada aplicativo tem o formato e as cores dele (claro e escuro)', () => {
    for (const app of APLICATIVOS) {
        const f = FORMATO[app];
        assert.ok(f, `${app} sem formato`);
        assert.ok(['dentro', 'fora', 'nenhuma'].includes(f.hora), `${app}: hora inválida`);
        assert.ok(['tiques', 'texto', 'foto', 'nenhum'].includes(f.lido), `${app}: lido inválido`);
        if (f.digitandoNoTopo) assert.ok(f.status, `${app}: "digitando" no topo precisa da linha de status`);
        if (app === 'whatsapp') continue; // as cores do WhatsApp são as do :root
        assert.match(CSS_CORES, new RegExp(`\\[data-app='${app}'\\]\\s*\\{`), `${app} sem cores no claro`);
        assert.match(CSS_CORES, new RegExp(`\\[data-theme='dark'\\] \\[data-app='${app}'\\]`), `${app} sem cores no escuro`);
    }
});
