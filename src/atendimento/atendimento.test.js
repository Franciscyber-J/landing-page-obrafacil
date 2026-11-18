// Atendimento do site: país pelo fuso, grupos, leitura da resposta do Max (segurança dos links) e a conversa com o
// servidor simulado (src/atendimento/simulado.js), que segue o contrato da function maxChatSite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paisDoFuso } from './fusos.js';
import {
    CONFIG_INICIAL, PAISES_OS_DOIS, PAISES_SO_CHAT, grupoDaPagina, grupoDoPais, lerConfiguracao, regiaoDoIdioma,
    visitante, whatsappValido,
} from './grupos.js';
import { lerResposta, linkPermitido } from './resposta.js';
import { REPETIDA_MS, TEXTO_MAXIMO, criarConversa, textoParaEnviar } from './conversa.js';
import { criarServidorSimulado } from './simulado.js';
import { IDIOMAS } from '../i18n/registro.js';

// ---------- País pelo fuso ----------

test('fuso → país, com os nomes antigos que os navegadores ainda devolvem', () => {
    assert.equal(paisDoFuso('America/Sao_Paulo'), 'BR');
    assert.equal(paisDoFuso('Asia/Tokyo'), 'JP');
    assert.equal(paisDoFuso('Europe/Moscow'), 'RU');
    assert.equal(paisDoFuso('Asia/Almaty'), 'KZ');
    assert.equal(paisDoFuso('Asia/Seoul'), 'KR');
    assert.equal(paisDoFuso('Asia/Taipei'), 'TW');
    assert.equal(paisDoFuso('America/New_York'), 'US');
    assert.equal(paisDoFuso('Asia/Calcutta'), 'IN');
    assert.equal(paisDoFuso('Asia/Saigon'), 'VN');
    assert.equal(paisDoFuso('Europe/Kiev'), 'UA');
    assert.equal(paisDoFuso('US/Eastern'), 'US');
    assert.equal(paisDoFuso('Etc/UTC'), null);
    assert.equal(paisDoFuso('UTC'), null);
    assert.equal(paisDoFuso('Marte/Base'), null);
    assert.equal(paisDoFuso(undefined), null);
});

test('todos os países dos grupos iniciais têm fuso no mapa', () => {
    const comFuso = new Set();
    const fonte = readFileSync(new URL('./fusos.js', import.meta.url), 'utf8');
    for (const m of fonte.matchAll(/^ {4}([A-Z]{2}): '/gm)) comFuso.add(m[1]);
    for (const pais of [...CONFIG_INICIAL.so_chat, ...CONFIG_INICIAL.os_dois, ...CONFIG_INICIAL.so_whatsapp]) {
        assert.ok(comFuso.has(pais), pais);
    }
});

// ---------- Grupos ----------

test('grupos iniciais iguais aos do servidor (decisão de 18/11/2026)', () => {
    assert.deepEqual(PAISES_SO_CHAT, ['RU', 'JP', 'KR', 'TW', 'TH', 'VN', 'KP']);
    assert.deepEqual(PAISES_OS_DOIS, ['US', 'CA', 'AU', 'FR', 'DE', 'PH', 'PL', 'CZ', 'HU', 'GR', 'UA', 'BY']);
    assert.equal(grupoDoPais('BR'), 'so_whatsapp');
    assert.equal(grupoDoPais('KZ'), 'so_whatsapp');
    assert.equal(grupoDoPais('US'), 'os_dois');
    assert.equal(grupoDoPais('JP'), 'so_chat');
    assert.equal(grupoDoPais('NZ'), 'os_dois', 'fora das listas: o padrão');
    assert.equal(grupoDoPais(null), 'os_dois');
    assert.equal(grupoDoPais('XX'), 'os_dois');
});

test('documento: listas e padrão conferidos como no servidor; país em dois grupos vale o primeiro', () => {
    const c = lerConfiguracao({ so_chat: ['jp', 'BR', 'xx', 3], os_dois: ['BR'], so_whatsapp: ['BR', 'US'], padrao: 'so_chat' });
    assert.deepEqual(c.so_chat, ['JP', 'BR']);
    assert.equal(grupoDoPais('BR', c), 'so_chat');
    assert.equal(grupoDoPais('US', c), 'so_whatsapp');
    assert.equal(grupoDoPais('NZ', c), 'so_chat');
    const vazio = lerConfiguracao({ so_chat: 'JP', padrao: 'qualquer' });
    assert.deepEqual(vazio.so_chat, PAISES_SO_CHAT, 'campo que não é lista: valor inicial');
    assert.equal(vazio.padrao, 'os_dois');
    assert.deepEqual(lerConfiguracao(null), { ...CONFIG_INICIAL, so_whatsapp: [...CONFIG_INICIAL.so_whatsapp], os_dois: [...PAISES_OS_DOIS], so_chat: [...PAISES_SO_CHAT] });
});

test('região do idioma do navegador', () => {
    assert.equal(regiaoDoIdioma('ru-RU'), 'RU');
    assert.equal(regiaoDoIdioma('zh-Hant-TW'), 'TW');
    assert.equal(regiaoDoIdioma('pt_BR'), 'BR');
    assert.equal(regiaoDoIdioma('es-419'), null);
    assert.equal(regiaoDoIdioma('ja'), null);
});

test('visitante: o fuso manda; o idioma só quando o fuso não diz o país; sem nada, os dois', () => {
    const v = (fuso, idiomas) => visitante({ fuso, idiomas }, paisDoFuso);
    // Russo no Cazaquistão: WhatsApp. Na Rússia: a conversa.
    assert.deepEqual(v('Asia/Almaty', ['ru-RU']), { pais: 'KZ', grupo: 'so_whatsapp' });
    assert.deepEqual(v('Europe/Moscow', ['ru-RU']), { pais: 'RU', grupo: 'so_chat' });
    // Brasileiro com o navegador em inglês continua no WhatsApp.
    assert.deepEqual(v('America/Sao_Paulo', ['en-US']), { pais: 'BR', grupo: 'so_whatsapp' });
    // Brasileira morando no Japão: vale onde ela está.
    assert.deepEqual(v('Asia/Tokyo', ['pt-BR']), { pais: 'JP', grupo: 'so_chat' });
    // Sem país pelo fuso: o do idioma.
    assert.deepEqual(v('Etc/UTC', ['ko-KR']), { pais: 'KR', grupo: 'so_chat' });
    assert.deepEqual(v(null, ['es-419', 'th-TH']), { pais: 'TH', grupo: 'so_chat' });
    // Nada: o padrão, sem país para o servidor.
    assert.deepEqual(v('Etc/UTC', ['en']), { pais: null, grupo: 'os_dois' });
});

test('página pronta: o grupo do país do idioma da página (o mesmo no build e no primeiro desenho)', () => {
    const grupo = (codigo) => grupoDaPagina(IDIOMAS.find((i) => i.codigo === codigo).pais);
    assert.equal(grupo('pt-BR'), 'so_whatsapp');
    assert.equal(grupo('ja-JP'), 'so_chat');
    assert.equal(grupo('ko-KR'), 'so_chat');
    assert.equal(grupo('en-US'), 'os_dois');
    assert.equal(grupo('ru-KZ'), 'so_whatsapp');
    for (const i of IDIOMAS) assert.ok(['so_whatsapp', 'os_dois', 'so_chat'].includes(grupoDaPagina(i.pais)), i.codigo);
});

test('número do WhatsApp do documento: só algarismos com o código do país', () => {
    assert.equal(whatsappValido('5562992666759'), '5562992666759');
    assert.equal(whatsappValido(' 5562992666759 '), '5562992666759');
    assert.equal(whatsappValido('+55 62 99266-6759'), null);
    assert.equal(whatsappValido('123'), null);
    assert.equal(whatsappValido('javascript:alert(1)'), null);
    assert.equal(whatsappValido(undefined), null);
});

// ---------- Resposta do Max ----------

test('links: só o site, o app e a página do ObraFácil nas lojas, sempre https', () => {
    assert.ok(linkPermitido('https://appobrafacil.expertbr.com/pt-br/ajuda/criar-rdo'));
    assert.ok(linkPermitido('https://obrafacilapp.expertbr.com/cadastro?idioma=pt-BR&max=abc'));
    assert.ok(linkPermitido('https://play.google.com/store/apps/details?id=com.expertbr.obrafacil&hl=pt-BR'));
    assert.ok(linkPermitido('https://apps.apple.com/br/app/obrafacil/id6760675010'));
    for (const ruim of [
        'http://appobrafacil.expertbr.com/pt-br/',
        'https://appobrafacil.expertbr.com.golpe.com/',
        'https://golpe.com/?https://appobrafacil.expertbr.com',
        'https://usuario:senha@appobrafacil.expertbr.com/',
        'https://appobrafacil.expertbr.com:8443/',
        'https://play.google.com/store/apps/details?id=com.outro.app',
        'https://apps.apple.com/app/id123',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'https://wa.me/5562992666759',
    ]) assert.equal(linkPermitido(ruim), null, ruim);
});

test('resposta: negrito do WhatsApp, listas, blocos e links; o resto é texto', () => {
    const blocos = lerResposta([
        'Oi! O *plano grátis* não tem prazo.',
        '• Obras\n• **Equipe**\n1. Baixe o app\n2. Crie a conta',
        '📖 *Criar um diário de obra*\nhttps://appobrafacil.expertbr.com/pt-br/ajuda/criar-rdo.',
        'Veja https://golpe.com/x e <b>isto</b> <script>alert(1)</script>',
    ].join('\n\n'));
    assert.equal(blocos.length, 5);
    assert.deepEqual(blocos[0].linhas[0], [
        { tipo: 'texto', texto: 'Oi! O ', negrito: false },
        { tipo: 'texto', texto: 'plano grátis', negrito: true },
        { tipo: 'texto', texto: ' não tem prazo.', negrito: false },
    ]);
    assert.equal(blocos[1].tipo, 'lista');
    assert.equal(blocos[1].numerada, false);
    assert.deepEqual(blocos[1].itens[1], [{ tipo: 'texto', texto: 'Equipe', negrito: true }]);
    assert.equal(blocos[2].numerada, true);
    assert.equal(blocos[2].itens.length, 2);
    const link = blocos[3].linhas[1];
    assert.deepEqual(link, [
        { tipo: 'link', texto: 'https://appobrafacil.expertbr.com/pt-br/ajuda/criar-rdo', href: 'https://appobrafacil.expertbr.com/pt-br/ajuda/criar-rdo', negrito: false },
        { tipo: 'texto', texto: '.', negrito: false },
    ]);
    const ultimo = blocos[4].linhas[0];
    assert.ok(ultimo.every((p) => p.tipo === 'texto'), 'endereço de fora e HTML ficam como texto');
    assert.equal(ultimo.map((p) => p.texto).join(''), 'Veja https://golpe.com/x e <b>isto</b> <script>alert(1)</script>');
});

test('asterisco solto não vira negrito', () => {
    const [bloco] = lerResposta('2 * 3 = 6 e *sem fim');
    assert.deepEqual(bloco.linhas[0], [{ tipo: 'texto', texto: '2 * 3 = 6 e *sem fim', negrito: false }]);
});

test('nenhum dangerouslySetInnerHTML no atendimento', () => {
    for (const arquivo of ['../components/atendimento/Painel.jsx', '../components/atendimento/Atendimento.jsx']) {
        assert.doesNotMatch(readFileSync(new URL(arquivo, import.meta.url), 'utf8'), /dangerouslySetInnerHTML|innerHTML/);
    }
});

// ---------- Conversa com o servidor simulado ----------

test('texto: 1 a 1000 caracteres depois de tirar os espaços', () => {
    assert.equal(textoParaEnviar('  oi  '), 'oi');
    assert.equal(textoParaEnviar('   '), null);
    assert.equal(textoParaEnviar('\u0000\u0007'), null);
    assert.equal(textoParaEnviar('a'.repeat(TEXTO_MAXIMO)), 'a'.repeat(TEXTO_MAXIMO));
    assert.equal(textoParaEnviar('a'.repeat(TEXTO_MAXIMO + 1)), null);
    assert.equal(textoParaEnviar(undefined), null);
});

function conversa(opcoes = {}) {
    const pedidos = [];
    const simulado = criarServidorSimulado({ espera: 5 });
    const servidor = { enviar: (entrada) => { pedidos.push(entrada); return simulado.enviar(entrada); } };
    return { c: criarConversa({ servidor, idioma: 'pt-BR', pais: 'JP', ...opcoes }), pedidos };
}

test('envio: a mensagem e a resposta entram na conversa; o servidor recebe texto, idioma e país', async () => {
    const { c, pedidos } = conversa();
    const r = await c.enviar('  Quanto custa o PRO?  ');
    assert.deepEqual(r, { enviado: true });
    assert.deepEqual(pedidos, [{ texto: 'Quanto custa o PRO?', idioma: 'pt-BR', pais: 'JP' }]);
    const { mensagens, esperando, erro } = c.estado();
    assert.equal(mensagens.length, 2);
    assert.equal(mensagens[0].autor, 'pessoa');
    assert.equal(mensagens[1].autor, 'max');
    assert.equal(esperando, false);
    assert.equal(erro, null);
});

test('um envio por vez: o segundo, enquanto o Max responde, é ignorado', async () => {
    const { c, pedidos } = conversa();
    const primeiro = c.enviar('primeira');
    assert.equal(c.estado().esperando, true);
    const segundo = await c.enviar('segunda');
    assert.equal(segundo.ignorado, true);
    await primeiro;
    assert.equal(pedidos.length, 1);
});

test('texto vazio nem chega ao servidor', async () => {
    const { c, pedidos } = conversa();
    assert.equal((await c.enviar('   ')).enviado, false);
    assert.equal(pedidos.length, 0);
});

test('a mesma mensagem logo em seguida não sai de novo (10 minutos)', async () => {
    let agora = 0;
    const { c, pedidos } = conversa({ agora: () => agora });
    await c.enviar('Tem app para Windows?');
    const r = await c.enviar('tem app para windows');
    assert.deepEqual(r, { enviado: false, devolver: 'tem app para windows' });
    assert.equal(c.estado().erro, 'repetida');
    agora = REPETIDA_MS + 1;
    assert.equal((await c.enviar('tem app para windows')).enviado, true);
    assert.equal(pedidos.length, 2);
});

test('erro da function ou sem internet: a mensagem volta para o campo, com o aviso certo', async () => {
    const { c } = conversa();
    const r = await c.enviar('isso vai dar erro');
    assert.deepEqual(r, { enviado: false, devolver: 'isso vai dar erro' });
    assert.equal(c.estado().erro, 'geral');
    assert.equal(c.estado().mensagens.length, 0, 'a mensagem que não foi não fica na conversa');
    await c.enviar('falha de rede');
    assert.equal(c.estado().erro, 'rede');
});

test('motivos do servidor: limite, desligado, teto, ocupada e país do WhatsApp', async () => {
    for (const [palavra, motivo] of [['limite', 'limite'], ['desligado', 'desligado'], ['teto', 'teto'], ['ocupada', 'ocupada'], ['whatsapp', 'pais_whatsapp']]) {
        const { c } = conversa();
        const r = await c.enviar(`teste ${palavra}`);
        assert.equal(r.enviado, false, palavra);
        assert.equal(r.devolver, `teste ${palavra}`);
        assert.equal(c.estado().motivo, motivo);
        assert.equal(c.estado().esperando, false);
        assert.equal(c.estado().mensagens.length, 0);
    }
});

test('resposta vazia do servidor conta como erro', async () => {
    const c = criarConversa({ servidor: { enviar: async () => ({ conversaId: 's_x', resposta: '  ' }) }, idioma: 'en-US' });
    assert.equal((await c.enviar('oi')).enviado, false);
    assert.equal(c.estado().erro, 'geral');
});
