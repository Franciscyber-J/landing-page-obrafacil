// Marcação animada nos prints da Central (Fase 12): o mesmo destaque que o app desenha a partir da 1.9.2
// (gestao_obras, lib/ajuda/widgets/print_com_marcacao.dart e MarcacaoAjuda em lib/ajuda/modelos_ajuda.dart).
//
// O print chega limpo do Storage; o passo publicado traz o campo "marcacao": onde fica o alvo, em proporção do
// print (0 = borda de cima ou da esquerda, 1 = de baixo ou da direita), e os efeitos (escurecer, circulo, seta,
// zoom). O site desenha por cima, em SVG, sem mexer na imagem.
//
// Aqui só contas, sem tela: leitura conferida do campo, geometria (zoom, forma do contorno, lado da seta) e o
// desenho de cada quadro da animação. O componente (components/ajuda/PrintComMarcacao.jsx) só aplica o resultado.
// Os números (tempos, curva, espessuras, folgas, tamanhos) são os do app; mudar lá é mudar aqui.

export const EFEITOS = Object.freeze(['escurecer', 'circulo', 'seta', 'zoom']);

// Entrada (uma vez): o véu escurece, o zoom aproxima e a seta chega. Pulso (repete): onda do contorno e balanço da seta.
export const DURACAO_ENTRADA = 700;
export const DURACAO_PULSO = 1600;

// ---------- Leitura do campo ----------

// Mesma leitura tolerante do app (MarcacaoAjuda.deMapa): número fora de 0 a 1, alvo vazio ou fora do print
// devolvem null e o print aparece limpo. Efeito desconhecido é descartado; se nenhum efeito conhecido sobrar,
// também null.
export function lerMarcacao(bruto) {
    if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null;
    const n = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? v : null);
    const x = n(bruto.x);
    const y = n(bruto.y);
    const largura = n(bruto.largura);
    const altura = n(bruto.altura);
    if (x === null || y === null || largura === null || altura === null) return null;
    if (largura <= 0 || altura <= 0 || x + largura > 1.0001 || y + altura > 1.0001) return null;
    const efeitos = Array.isArray(bruto.efeitos)
        ? EFEITOS.filter((e) => bruto.efeitos.includes(e))
        : [];
    if (efeitos.length === 0) return null;
    return { x, y, largura, altura, efeitos };
}

const tem = (marcacao, efeito) => marcacao.efeitos.includes(efeito);
const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

// ---------- Tempo ----------

// Curves.easeOutCubic do Flutter: Cubic(0.215, 0.61, 0.355, 1.0) (não é 1 - (1 - t)³), resolvida como lá
// (busca binária com erro de 0,001).
function cubica(a, b, c, d) {
    const avaliar = (p1, p2, m) => 3 * p1 * (1 - m) * (1 - m) * m + 3 * p2 * (1 - m) * m * m + m * m * m;
    return (t) => {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        let inicio = 0;
        let fim = 1;
        for (;;) {
            const meio = (inicio + fim) / 2;
            const x = avaliar(a, c, meio);
            if (Math.abs(t - x) < 0.001) return avaliar(b, d, meio);
            if (x < t) inicio = meio;
            else fim = meio;
        }
    };
}
export const easeOutCubic = cubica(0.215, 0.61, 0.355, 1.0);

// Ponto da animação: entrada (0 a 1, linear; a curva entra no desenho) depois de msEntrada milissegundos e
// pulso (0 a 1, repetindo) depois de msPulso. No app os dois começam juntos (msPulso = msEntrada).
// Parado ("reduzir movimento"): já no fim, sem pulso.
export function quadroNoTempo(msEntrada, msPulso = msEntrada, parado = false) {
    if (parado) return { entrada: 1, pulso: 0 };
    const e = Math.max(0, msEntrada);
    const p = Math.max(0, msPulso);
    return { entrada: Math.min(1, e / DURACAO_ENTRADA), pulso: (p % DURACAO_PULSO) / DURACAO_PULSO };
}

// ---------- Geometria ----------

// Zoom máximo: o alvo cresce até ocupar cerca de metade da largura do print, sem passar de 2,6×.
export function zoomFinal(area, alvo) {
    if (alvo.largura <= 0 || alvo.altura <= 0) return 1;
    const z = Math.min((0.5 * area.largura) / alvo.largura, (0.35 * area.altura) / alvo.altura);
    return limitar(z, 1, 2.6);
}

// Medidas que acompanham o tamanho do print na tela (as do app): escala, traço do contorno e folga em volta do alvo.
export function medidas(area) {
    const escala = Math.min(area.largura, area.altura) / 360;
    return { escala, traco: limitar(2.5 * escala, 1.5, 3.5), folga: limitar(4 * escala, 3, 8) };
}

// Quanto o destaque ocupa a partir do centro do alvo (meia largura e meia altura), para um alvo de
// largura × altura já com o zoom: a forma com a folga e, com "circulo", o contorno (traço + 3) e a onda no
// tamanho máximo do pulso (folga + 14 × escala). Cresce em linha reta com o tamanho do alvo.
export function extensaoDoDestaque(largura, altura, marcacao, m) {
    const circulo = tem(marcacao, 'circulo');
    const camadas = circulo
        ? [{ folga: m.folga, traco: m.traco + 3 }, { folga: m.folga + 14 * m.escala, traco: m.traco }]
        : [{ folga: m.folga, traco: 0 }];
    let x = 0;
    let y = 0;
    for (const camada of camadas) {
        const forma = formaDoAlvo({ x: 0, y: 0, largura, altura }, camada.folga);
        const meioTraco = camada.traco / 2;
        x = Math.max(x, (forma.tipo === 'circulo' ? forma.raio : forma.largura / 2) + meioTraco);
        y = Math.max(y, (forma.tipo === 'circulo' ? forma.raio : forma.altura / 2) + meioTraco);
    }
    return { x, y };
}

// Onde o alvo fica no print mostrado (em pixels da tela), já com o zoom, o próprio zoom e o ponto que fica
// parado durante o zoom (foco). entrada: valor já com a curva (0 a 1).
//
// Alvo perto da borda: com o foco sempre no centro do alvo (como na 1.9.2 do app), o círculo aumentado e a onda
// do pulso saíam do print e eram cortados. O zoom continua o mesmo, mas o enquadramento se desloca só o
// necessário para o destaque inteiro (contorno e onda no tamanho máximo) ficar dentro do print. App (a partir da
// versão seguinte à 1.9.2: GeometriaMarcacao.calcular e MedidasMarcacao) e site fazem a mesma conta.
// O foco fica sempre dentro do print, então o print aumentado continua cobrindo a área toda (sem faixa vazia).
// O limite do zoom (alvo com no máximo metade da largura e 35% da altura) já garante que o destaque aumentado
// cabe no print; o que faltava era a margem junto da borda. Alvo colado na borda (folga menor que a margem
// mesmo com o zoom) não tem como ganhar margem toda, porque a imagem não pode passar da própria borda: o
// destaque fica o mais para dentro possível.
export function geometria(area, marcacao, entrada) {
    const original = {
        x: marcacao.x * area.largura,
        y: marcacao.y * area.altura,
        largura: marcacao.largura * area.largura,
        altura: marcacao.altura * area.altura,
    };
    const centro = { x: original.x + original.largura / 2, y: original.y + original.altura / 2 };
    if (!tem(marcacao, 'zoom')) return { alvo: original, zoom: 1, foco: centro };

    const zoom = 1 + (zoomFinal(area, original) - 1) * limitar(entrada, 0, 1);
    const largura = original.largura * zoom;
    const altura = original.altura * zoom;
    const ocupa = extensaoDoDestaque(largura, altura, marcacao, medidas(area));
    const enquadrar = (c, tamanho, meio) => {
        const desejado = 2 * meio <= tamanho ? limitar(c, meio, tamanho - meio) : c;
        // Até onde o centro do alvo pode ir com este zoom sem o print deixar faixa vazia.
        const novo = limitar(desejado, tamanho - zoom * (tamanho - c), zoom * c);
        const foco = zoom - 1 < 1e-9 ? c : (novo - zoom * c) / (1 - zoom);
        return { novo, foco: limitar(foco, 0, tamanho) };
    };
    const ex = enquadrar(centro.x, area.largura, ocupa.x);
    const ey = enquadrar(centro.y, area.altura, ocupa.y);
    return {
        alvo: { x: ex.novo - largura / 2, y: ey.novo - altura / 2, largura, altura },
        zoom,
        foco: { x: ex.foco, y: ey.foco },
    };
}

// Forma que contorna o alvo: círculo para alvo quase quadrado (ícone), cápsula para o resto (botão, campo).
export function formaDoAlvo(alvo, folga) {
    const r = { x: alvo.x - folga, y: alvo.y - folga, largura: alvo.largura + 2 * folga, altura: alvo.altura + 2 * folga };
    const razao = alvo.largura / alvo.altura;
    if (razao > 0.7 && razao < 1.45) {
        return {
            tipo: 'circulo',
            cx: r.x + r.largura / 2,
            cy: r.y + r.altura / 2,
            raio: (Math.max(r.largura, r.altura) / 2) * 1.08,
        };
    }
    return { tipo: 'retangulo', ...r, raio: Math.min(Math.min(r.largura, r.altura) / 2, 18) };
}

const num = (v) => String(Math.round(v * 100) / 100);

// Caminho SVG da forma (sentido horário).
export function caminhoDaForma(forma) {
    if (forma.tipo === 'circulo') {
        const { cx, cy, raio } = forma;
        return `M${num(cx - raio)} ${num(cy)}A${num(raio)} ${num(raio)} 0 1 1 ${num(cx + raio)} ${num(cy)}`
            + `A${num(raio)} ${num(raio)} 0 1 1 ${num(cx - raio)} ${num(cy)}Z`;
    }
    const { x, y, largura: l, altura: a, raio: r } = forma;
    return `M${num(x + r)} ${num(y)}H${num(x + l - r)}A${num(r)} ${num(r)} 0 0 1 ${num(x + l)} ${num(y + r)}`
        + `V${num(y + a - r)}A${num(r)} ${num(r)} 0 0 1 ${num(x + l - r)} ${num(y + a)}`
        + `H${num(x + r)}A${num(r)} ${num(r)} 0 0 1 ${num(x)} ${num(y + a - r)}`
        + `V${num(y + r)}A${num(r)} ${num(r)} 0 0 1 ${num(x + r)} ${num(y)}Z`;
}

// Seta: lado com mais espaço (em cima, embaixo, à esquerda ou à direita do alvo), ponta encostada no alvo.
// Em cima/embaixo pesa 1,4× (a seta não cobre o texto da mesma linha). Empate fica com o primeiro da lista.
const LADOS = [
    { nome: 'cima', dx: 0, dy: -1 },
    { nome: 'baixo', dx: 0, dy: 1 },
    { nome: 'esquerda', dx: -1, dy: 0 },
    { nome: 'direita', dx: 1, dy: 0 },
];

export function seta(area, alvo, folga, escala, entrada, pulso, parado) {
    const comprimento = limitar(44 * escala, 26, 64);
    const largura = comprimento * 0.62;
    const balanco = parado ? 0 : Math.sin(pulso * 2 * Math.PI) * 5 * escala;
    const chegada = (1 - entrada) * 18 * escala;
    const espaco = folga + 6 * escala + balanco + chegada;

    const espacos = {
        cima: alvo.y,
        baixo: area.altura - (alvo.y + alvo.altura),
        esquerda: alvo.x,
        direita: area.largura - (alvo.x + alvo.largura),
    };
    const candidatos = LADOS.map((l) => ({ ...l, livre: espacos[l.nome] }));
    const cabem = candidatos.filter((l) => l.livre >= comprimento + espaco);
    const lado = (cabem.length > 0 ? cabem : candidatos).reduce((a, b) => {
        const va = a.dy !== 0 ? a.livre * 1.4 : a.livre;
        const vb = b.dy !== 0 ? b.livre * 1.4 : b.livre;
        return va >= vb ? a : b;
    });

    const cx = alvo.x + alvo.largura / 2;
    const cy = alvo.y + alvo.altura / 2;
    const ponta = {
        cima: { x: cx, y: alvo.y - espaco },
        baixo: { x: cx, y: alvo.y + alvo.altura + espaco },
        esquerda: { x: alvo.x - espaco, y: cy },
        direita: { x: alvo.x + alvo.largura + espaco, y: cy },
    }[lado.nome];

    // Seta desenhada apontando para baixo (ponta em 0,0) e girada para a direção certa.
    const cabeca = comprimento * 0.48;
    const haste = largura * 0.36;
    const d = `M0 0L${num(-largura / 2)} ${num(-cabeca)}L${num(-haste / 2)} ${num(-cabeca)}`
        + `L${num(-haste / 2)} ${num(-comprimento)}L${num(haste / 2)} ${num(-comprimento)}`
        + `L${num(haste / 2)} ${num(-cabeca)}L${num(largura / 2)} ${num(-cabeca)}Z`;
    const graus = ((Math.atan2(-lado.dy, -lado.dx) - Math.PI / 2) * 180) / Math.PI;

    return {
        lado: lado.nome,
        ponta,
        comprimento,
        graus,
        d,
        transform: `translate(${num(ponta.x)} ${num(ponta.y)}) rotate(${num(graus)})`,
        tracoContorno: limitar(3 * escala, 2, 4),
        opacidade: limitar(entrada, 0, 1),
    };
}

// ---------- Desenho de um quadro ----------

// area: tamanho do print na tela, em pixels. quadro: { entrada (linear), pulso }. parado: "reduzir movimento".
// Devolve tudo o que o componente aplica: zoom da imagem, véu, contorno (com a onda) e seta, ou null por efeito.
export function desenhoDaMarcacao(area, marcacao, quadro, parado = false) {
    if (!marcacao || !(area.largura > 0) || !(area.altura > 0)) return null;
    const entrada = easeOutCubic(parado ? 1 : quadro.entrada);
    const pulso = parado ? 0 : quadro.pulso;
    const geo = geometria(area, marcacao, entrada);
    const { escala, traco, folga } = medidas(area); // traços proporcionais ao print na tela
    const forma = caminhoDaForma(formaDoAlvo(geo.alvo, folga));
    const visivelNaEntrada = limitar(entrada, 0.4, 1);

    return {
        alvo: geo.alvo,
        zoom: tem(marcacao, 'zoom')
            ? {
                escala: geo.zoom,
                origem: `${num((geo.foco.x / area.largura) * 100)}% ${num((geo.foco.y / area.altura) * 100)}%`,
            }
            : null,
        veu: tem(marcacao, 'escurecer')
            ? { d: `M0 0H${num(area.largura)}V${num(area.altura)}H0Z${forma}`, opacidade: entrada }
            : null,
        circulo: tem(marcacao, 'circulo')
            ? {
                d: forma,
                traco,
                tracoContorno: traco + 3,
                opacidade: visivelNaEntrada,
                // Onda que sai do contorno e some (só com animação).
                onda: !parado && pulso > 0
                    ? { d: caminhoDaForma(formaDoAlvo(geo.alvo, folga + 14 * escala * pulso)), opacidade: (1 - pulso) * 0.8 }
                    : null,
            }
            : null,
        seta: tem(marcacao, 'seta') ? seta(area, geo.alvo, folga, escala, entrada, pulso, parado) : null,
    };
}
