// Testes da marcação animada dos prints (Fase 12): leitura conferida do campo, posição de cada efeito em
// relação à imagem, valores inválidos ignorados e "reduzir movimento".
// Rodar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    DURACAO_ENTRADA,
    DURACAO_PULSO,
    caminhoDaForma,
    desenhoDaMarcacao,
    easeOutCubic,
    formaDoAlvo,
    geometria,
    lerMarcacao,
    medidas,
    quadroNoTempo,
    zoomFinal,
} from './marcacao.js';

const perto = (real, esperado, folga = 0.01) =>
    assert.ok(Math.abs(real - esperado) <= folga, `esperado ${esperado}, veio ${real}`);

// Print do celular no site: 206 × 457,8 px (moldura de 220 px menos 7 px de cada lado), e o dobro no computador.
const CELULAR = { largura: 206, altura: 206 / (1080 / 2400) };
const LARGO = { largura: 412, altura: 412 / (1080 / 2400) };

// Marcações reais publicadas (artigo gratis-x-pro e trocar-tema, pt-BR).
const ICONE = { x: 0.2042, y: 0.1293, largura: 0.292, altura: 0.0329, efeitos: ['zoom', 'circulo', 'seta'] };
const LINHA = { x: 0.0292, y: 0.4422, largura: 0.9416, altura: 0.1302, efeitos: ['escurecer'] };
const FINAL = { entrada: 1, pulso: 0 };

// Pontos de um caminho SVG "M x y ..." (só os pares de números depois de M, L, H/V não entram).
const numeros = (d) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

// ---------- Leitura do campo ----------

test('lê a marcação publicada e mantém só os efeitos conhecidos, na ordem da lista', () => {
    assert.deepEqual(lerMarcacao(ICONE), { ...ICONE, efeitos: ['circulo', 'seta', 'zoom'] });
    assert.deepEqual(lerMarcacao({ ...LINHA, efeitos: ['escurecer', 'escurecer'] }).efeitos, ['escurecer']);
    // Vindo do Firestore, 0 e 1 chegam como integerValue e viram número do mesmo jeito.
    assert.ok(lerMarcacao({ x: 0, y: 0, largura: 1, altura: 1, efeitos: ['escurecer'] }));
});

test('passo sem marcação: nada a desenhar', () => {
    assert.equal(lerMarcacao(undefined), null);
    assert.equal(lerMarcacao(null), null);
    assert.equal(desenhoDaMarcacao(CELULAR, null, FINAL), null);
});

test('valor fora de 0 a 1, alvo vazio, alvo fora do print ou tipo errado: ignorado (print limpo)', () => {
    const casos = [
        { ...LINHA, x: -0.01 },
        { ...LINHA, y: 1.2 },
        { ...LINHA, largura: 0 },
        { ...LINHA, altura: -0.1 },
        { ...LINHA, x: 0.5, largura: 0.6 }, // passa da borda direita
        { ...LINHA, y: 0.95, altura: 0.1 }, // passa da borda de baixo
        { ...LINHA, x: '0.1' },
        { ...LINHA, y: NaN },
        { ...LINHA, largura: Infinity },
        { ...LINHA, altura: null },
        { x: 0.1, y: 0.1, largura: 0.2, efeitos: ['circulo'] }, // sem altura
        { ...LINHA, efeitos: 'escurecer' },
        [0.1, 0.1, 0.2, 0.2],
        'escurecer',
        42,
    ];
    for (const caso of casos) assert.equal(lerMarcacao(caso), null, JSON.stringify(caso));
});

test('efeito desconhecido é descartado; sem nenhum efeito conhecido, print limpo', () => {
    assert.equal(lerMarcacao({ ...LINHA, efeitos: ['brilho'] }), null);
    assert.equal(lerMarcacao({ ...LINHA, efeitos: [] }), null);
    assert.equal(lerMarcacao({ ...LINHA, efeitos: [null, 3, {}] }), null);
    assert.deepEqual(lerMarcacao({ ...LINHA, efeitos: ['brilho', 'circulo'] }).efeitos, ['circulo']);
});

// ---------- Tempo ----------

test('tempos e curva do app: entrada de 700 ms (easeOutCubic do Flutter) e pulso de 1,6 s repetindo', () => {
    assert.equal(DURACAO_ENTRADA, 700);
    assert.equal(DURACAO_PULSO, 1600);
    assert.deepEqual(quadroNoTempo(0), { entrada: 0, pulso: 0 });
    assert.deepEqual(quadroNoTempo(350), { entrada: 0.5, pulso: 350 / 1600 });
    assert.deepEqual(quadroNoTempo(2000), { entrada: 1, pulso: 400 / 1600 });
    assert.deepEqual(quadroNoTempo(700, 0), { entrada: 1, pulso: 0 });
    assert.equal(easeOutCubic(0), 0);
    assert.equal(easeOutCubic(1), 1);
    perto(easeOutCubic(0.5), 0.875, 0.002); // Cubic(0.215, 0.61, 0.355, 1.0) no meio
    perto(easeOutCubic(0.25), 0.6003, 0.002);
});

// ---------- Posição de cada efeito em relação à imagem ----------

test('zoom: cresce em volta do centro do alvo até ~metade da largura, no máximo 2,6×', () => {
    const final = geometria(CELULAR, ICONE, 1);
    const centro = { x: (ICONE.x + ICONE.largura / 2) * CELULAR.largura, y: (ICONE.y + ICONE.altura / 2) * CELULAR.altura };
    perto(final.foco.x, centro.x);
    perto(final.foco.y, centro.y);
    // 0,5 × 206 / (0,292 × 206) = 1,71 e 0,35 × 457,8 / (0,0329 × 457,8) = 10,6: vale o menor.
    perto(final.zoom, 0.5 / 0.292);
    perto(final.alvo.largura, ICONE.largura * CELULAR.largura * final.zoom);
    perto(final.alvo.x + final.alvo.largura / 2, centro.x); // o alvo fica no mesmo lugar
    assert.equal(geometria(CELULAR, ICONE, 0).zoom, 1);
    assert.equal(zoomFinal(CELULAR, { largura: 2, altura: 2 }), 2.6);
    assert.equal(zoomFinal(CELULAR, { largura: 200, altura: 100 }), 1);

    const d = desenhoDaMarcacao(CELULAR, ICONE, FINAL);
    perto(d.zoom.escala, 0.5 / 0.292);
    // Origem do zoom em porcentagem: vale para qualquer largura do print.
    const [ox, oy] = d.zoom.origem.split(' ').map(parseFloat);
    perto(ox, (ICONE.x + ICONE.largura / 2) * 100);
    perto(oy, (ICONE.y + ICONE.altura / 2) * 100);
    assert.equal(desenhoDaMarcacao(CELULAR, LINHA, FINAL).zoom, null);
});

test('escurecer: véu no print inteiro com um furo em volta do alvo', () => {
    const d = desenhoDaMarcacao(CELULAR, LINHA, FINAL);
    assert.ok(d.veu.d.startsWith(`M0 0H206V${Math.round(CELULAR.altura * 100) / 100}H0Z`));
    // Furo: cápsula (alvo largo) com folga de 3 px (escala 206/360 → mínimo 3).
    const x = LINHA.x * 206 - 3;
    const y = LINHA.y * CELULAR.altura - 3;
    const furo = numeros(d.veu.d.slice(d.veu.d.indexOf('Z') + 1));
    perto(furo[0], x + 18); // começa depois do canto arredondado de 18 px...
    perto(furo[1], y); // ...na borda de cima do alvo (com a folga)
    perto(furo[2], x + LINHA.largura * 206 + 6 - 18); // e vai até o outro canto
    assert.equal(d.veu.opacidade, 1);
    assert.equal(d.circulo, null);
    assert.equal(d.seta, null);
});

test('círculo: ícone ganha círculo; botão ou linha ganha cápsula (raio até 18 px)', () => {
    const icone = formaDoAlvo({ x: 100, y: 50, largura: 20, altura: 20 }, 3);
    assert.equal(icone.tipo, 'circulo');
    assert.equal(icone.cx, 110);
    assert.equal(icone.cy, 60);
    perto(icone.raio, (26 / 2) * 1.08);
    const botao = formaDoAlvo({ x: 10, y: 400, largura: 90, altura: 20 }, 3);
    assert.deepEqual(botao, { tipo: 'retangulo', x: 7, y: 397, largura: 96, altura: 26, raio: 13 });
    const linha = formaDoAlvo({ x: 0, y: 0, largura: 200, altura: 60 }, 3);
    assert.equal(linha.raio, 18);
    assert.match(caminhoDaForma(icone), /^M95\.96 60A14\.04 14\.04 0 1 1 124\.04 60/);
});

test('círculo no lugar do alvo, com onda só durante o pulso', () => {
    const quadrado = { x: 0.8, y: 0.07, largura: 0.06, altura: 0.027, efeitos: ['circulo'] };
    const d = desenhoDaMarcacao(CELULAR, quadrado, FINAL);
    const [mx, my, r] = numeros(d.circulo.d);
    const cx = (quadrado.x + quadrado.largura / 2) * CELULAR.largura;
    const cy = (quadrado.y + quadrado.altura / 2) * CELULAR.altura;
    perto(mx + r, cx);
    perto(my, cy);
    assert.equal(d.circulo.traco, 1.5);
    assert.equal(d.circulo.tracoContorno, 4.5);
    assert.equal(d.circulo.opacidade, 1);
    assert.equal(d.circulo.onda, null);
    const meio = desenhoDaMarcacao(CELULAR, quadrado, { entrada: 1, pulso: 0.5 });
    perto(meio.circulo.onda.opacidade, 0.4);
    assert.ok(numeros(meio.circulo.onda.d)[2] > r); // a onda é maior que o contorno
    // Início da entrada: contorno já aparece com 40%.
    assert.equal(desenhoDaMarcacao(CELULAR, quadrado, { entrada: 0, pulso: 0 }).circulo.opacidade, 0.4);
});

test('seta: ponta encostada no alvo, no lado com mais espaço (em cima/embaixo pesam mais)', () => {
    // Alvo no alto do print: a seta fica embaixo, apontando para cima.
    const alto = desenhoDaMarcacao(CELULAR, { x: 0.4, y: 0.05, largura: 0.2, altura: 0.03, efeitos: ['seta'] }, FINAL);
    assert.equal(alto.seta.lado, 'baixo');
    const folga = 3;
    const espaco = folga + 6 * (206 / 360);
    perto(alto.seta.ponta.x, 0.5 * 206);
    perto(alto.seta.ponta.y, 0.08 * CELULAR.altura + espaco);
    assert.equal(Math.abs(alto.seta.graus), 180);
    assert.equal(alto.seta.comprimento, 26);

    // Alvo embaixo: seta em cima, apontando para baixo (sem giro).
    const baixo = desenhoDaMarcacao(CELULAR, { x: 0.05, y: 0.93, largura: 0.43, altura: 0.045, efeitos: ['seta'] }, FINAL);
    assert.equal(baixo.seta.lado, 'cima');
    perto(baixo.seta.ponta.y, 0.93 * CELULAR.altura - espaco);
    assert.equal(baixo.seta.graus, 0);

    // Faixa que ocupa a altura toda junto da borda esquerda: seta à direita, apontando para a esquerda.
    const lateral = desenhoDaMarcacao(CELULAR, { x: 0, y: 0, largura: 0.2, altura: 1, efeitos: ['seta'] }, FINAL);
    assert.equal(lateral.seta.lado, 'direita');
    perto(lateral.seta.ponta.x, 0.2 * 206 + espaco);
    perto(lateral.seta.ponta.y, CELULAR.altura / 2);
    assert.equal(((lateral.seta.graus % 360) + 360) % 360, 90); // -270° = 90° (mesma conta do app)
});

test('seta chega de longe na entrada e balança no pulso', () => {
    const m = { x: 0.4, y: 0.05, largura: 0.2, altura: 0.03, efeitos: ['seta'] };
    const fim = desenhoDaMarcacao(CELULAR, m, FINAL).seta;
    const comeco = desenhoDaMarcacao(CELULAR, m, { entrada: 0, pulso: 0 }).seta;
    perto(comeco.ponta.y - fim.ponta.y, 18 * (206 / 360));
    assert.equal(comeco.opacidade, 0);
    const balanco = desenhoDaMarcacao(CELULAR, m, { entrada: 1, pulso: 0.25 }).seta;
    perto(balanco.ponta.y - fim.ponta.y, 5 * (206 / 360));
});

test('acompanha a largura do print: no dobro do tamanho, tudo dobra (traços com limites do app)', () => {
    const m = { ...ICONE, efeitos: ['escurecer', 'circulo', 'seta', 'zoom'] };
    const p = desenhoDaMarcacao(CELULAR, m, FINAL);
    const g = desenhoDaMarcacao(LARGO, m, FINAL);
    perto(g.alvo.x, p.alvo.x * 2, 0.02);
    perto(g.alvo.y, p.alvo.y * 2, 0.02);
    perto(g.alvo.largura, p.alvo.largura * 2, 0.02);
    assert.equal(g.zoom.origem, p.zoom.origem);
    assert.equal(g.seta.lado, p.seta.lado);
    // Traço: 2,5 × (412/360) = 2,86 (no celular, o mínimo de 1,5).
    perto(g.circulo.traco, 2.5 * (412 / 360));
    assert.equal(p.circulo.traco, 1.5);
});

test('os 4 efeitos juntos (artigo de exemplo gratis-x-pro, passo 1, mais o véu)', () => {
    const d = desenhoDaMarcacao(CELULAR, { ...ICONE, efeitos: ['zoom', 'circulo', 'seta', 'escurecer'] }, FINAL);
    assert.ok(d.zoom && d.veu && d.circulo && d.seta);
    // O furo do véu é a mesma forma do contorno.
    assert.ok(d.veu.d.endsWith(d.circulo.d));
});

test('reduzir movimento: marcação parada no estado final (sem onda nem balanço)', () => {
    const m = { ...ICONE, efeitos: ['escurecer', 'circulo', 'seta', 'zoom'] };
    assert.deepEqual(quadroNoTempo(0, 0, true), { entrada: 1, pulso: 0 });
    assert.deepEqual(quadroNoTempo(123, 777, true), { entrada: 1, pulso: 0 });
    // Parado ignora o quadro: qualquer momento dá o mesmo desenho, igual ao fim da animação.
    const parado = desenhoDaMarcacao(CELULAR, m, { entrada: 0, pulso: 0.5 }, true);
    const fimSemPulso = desenhoDaMarcacao(CELULAR, m, FINAL);
    assert.deepEqual(parado, fimSemPulso);
    assert.equal(parado.circulo.onda, null);
    assert.equal(parado.veu.opacidade, 1);
    assert.equal(parado.seta.opacidade, 1);
    perto(parado.zoom.escala, 0.5 / 0.292);
});

// Caixa que um caminho desenhado ocupa (círculo: "M cx-r cy A r r ..."; cápsula: pontos das retas e arcos).
function caixaDoCaminho(d) {
    if (/A[\d.]+ [\d.]+ 0 1 1/.test(d)) {
        const [esq, cy, r] = numeros(d);
        return { esq, dir: esq + 2 * r, cima: cy - r, baixo: cy + r };
    }
    const xs = [];
    const ys = [];
    for (const [, cmd, args] of d.matchAll(/([MLHVA])([^MLHVAZ]*)/g)) {
        const n = numeros(args);
        if (cmd === 'H') xs.push(n[0]);
        else if (cmd === 'V') ys.push(n[0]);
        else if (cmd === 'A') { xs.push(n[5]); ys.push(n[6]); }
        else { xs.push(n[0]); ys.push(n[1]); }
    }
    return { esq: Math.min(...xs), dir: Math.max(...xs), cima: Math.min(...ys), baixo: Math.max(...ys) };
}

function cabeNoPrint(area, d, traco, rotulo) {
    const c = caixaDoCaminho(d);
    const meio = traco / 2;
    const tol = 0.02; // arredondamento do caminho (2 casas)
    assert.ok(c.esq - meio >= -tol, `${rotulo}: sai pela esquerda (${c.esq - meio})`);
    assert.ok(c.cima - meio >= -tol, `${rotulo}: sai por cima (${c.cima - meio})`);
    assert.ok(c.dir + meio <= area.largura + tol, `${rotulo}: sai pela direita (${c.dir + meio} > ${area.largura})`);
    assert.ok(c.baixo + meio <= area.altura + tol, `${rotulo}: sai por baixo (${c.baixo + meio} > ${area.altura})`);
}

test('zoom perto da borda: círculo, contorno e onda no máximo cabem no print, nos 4 cantos', () => {
    // Ícone (círculo) e botão (cápsula) a 2% a 5% da borda, como o botão "?" do passo 1 do gratis-x-pro.
    const cantos = {
        'em cima à esquerda': { x: 0.05, y: 0.02 },
        'em cima à direita': { x: 0.895, y: 0.02 },
        'embaixo à esquerda': { x: 0.05, y: 0.945 },
        'embaixo à direita': { x: 0.895, y: 0.945 },
    };
    const formas = {
        icone: { largura: 0.055, altura: 0.025 },
        botao: { largura: 0.3, altura: 0.03 },
    };
    for (const area of [CELULAR, LARGO, { largura: 186, altura: 186 / (1080 / 2400) }]) {
        const { traco } = medidas(area);
        for (const [canto, pos] of Object.entries(cantos)) {
            for (const [nome, tam] of Object.entries(formas)) {
                // Do lado direito, o alvo termina a 5% da borda (o "?" do gratis-x-pro termina a 5%).
                const x = pos.x > 0.5 ? 0.95 - tam.largura : pos.x;
                const m = { x, y: pos.y, ...tam, efeitos: ['zoom', 'circulo', 'seta', 'escurecer'] };
                const rotulo = `${nome} ${canto} (${area.largura} px)`;
                for (const parado of [false, true]) {
                    const d = desenhoDaMarcacao(area, m, { entrada: 1, pulso: 0.9999 }, parado);
                    assert.ok(d.zoom.escala > 1, `${rotulo}: zoom`);
                    cabeNoPrint(area, d.circulo.d, traco + 3, `${rotulo} contorno`);
                    if (!parado) cabeNoPrint(area, d.circulo.onda.d, traco, `${rotulo} onda no máximo`);
                    // O ponto parado do zoom fica dentro do print: o print aumentado cobre a área toda.
                    const [ox, oy] = d.zoom.origem.split(' ').map(parseFloat);
                    assert.ok(ox >= 0 && ox <= 100 && oy >= 0 && oy <= 100, `${rotulo}: origem ${d.zoom.origem}`);
                }
                // Durante toda a entrada também (o zoom cresce e o enquadramento acompanha).
                for (const entrada of [0.2, 0.5, 0.8]) {
                    const d = desenhoDaMarcacao(area, m, { entrada, pulso: 0.9999 });
                    if (d.zoom.escala > 1.6) cabeNoPrint(area, d.circulo.onda.d, traco, `${rotulo} entrada ${entrada}`);
                }
            }
        }
    }
});

test('zoom no passo 1 do gratis-x-pro (botão "?" no canto): o alvo entra e o círculo inteiro aparece', () => {
    const ajuda = { x: 0.895, y: 0.072, largura: 0.055, altura: 0.025, efeitos: ['zoom', 'circulo', 'seta'] };
    const d = desenhoDaMarcacao(CELULAR, ajuda, { entrada: 1, pulso: 0.9999 });
    const { traco } = medidas(CELULAR);
    cabeNoPrint(CELULAR, d.circulo.onda.d, traco, 'onda');
    // O alvo saiu do lugar (para dentro), e o zoom final continua o do app (2,6×).
    const centroOriginal = (ajuda.x + ajuda.largura / 2) * CELULAR.largura;
    assert.ok(d.alvo.x + d.alvo.largura / 2 < centroOriginal);
    perto(d.zoom.escala, 2.6);
});

test('zoom longe da borda: igual ao app (o alvo cresce no mesmo lugar)', () => {
    const meio = { x: 0.4, y: 0.45, largura: 0.1, altura: 0.04, efeitos: ['zoom', 'circulo'] };
    const g = geometria(CELULAR, meio, 1);
    perto(g.foco.x, 0.45 * CELULAR.largura);
    perto(g.foco.y, 0.47 * CELULAR.altura);
    perto(g.zoom, zoomFinal(CELULAR, { largura: 0.1 * 206, altura: 0.04 * CELULAR.altura }));
});

test('alvo colado na borda: o destaque vai o mais para dentro possível, sem faixa vazia no print', () => {
    // Botão a 1 px da borda direita: nem com o zoom dá para ganhar a margem toda.
    const colado = { x: 0.695, y: 0.4, largura: 0.3, altura: 0.03, efeitos: ['zoom', 'circulo'] };
    const g = geometria(CELULAR, colado, 1);
    perto(g.foco.x, CELULAR.largura); // a borda direita do print aumentado fica na borda da área
    const semCorrecao = (colado.x + colado.largura) * CELULAR.largura + (g.zoom - 1) * (colado.largura / 2) * CELULAR.largura;
    assert.ok(g.alvo.x + g.alvo.largura < semCorrecao); // bem mais para dentro que o app
});

test('print ainda sem tamanho na tela: nada a desenhar', () => {
    assert.equal(desenhoDaMarcacao({ largura: 0, altura: 0 }, lerMarcacao(LINHA), FINAL), null);
});
