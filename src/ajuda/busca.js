// Busca da Central de Ajuda. Roda no navegador, sobre o índice do idioma (sem servidor).
// Sem diferença de acento nem de maiúscula; título pesa mais que tag, tag mais que resumo
// e resumo mais que o texto dos passos. Todas as palavras importantes da busca precisam
// aparecer em algum lugar do artigo. Vale para qualquer escrita (latina, grega, cirílica,
// árabe, hebraica, indianas, tailandesa, chinesa, japonesa, coreana).

const PESOS = { titulo: 10, tags: 6, resumo: 3, busca: 1 };

// Sinais de vogal opcionais do árabe e do hebraico: a mesma palavra com e sem eles é a mesma na busca
// ("صورًا" acha "صورا" e o contrário; "שָׁלוֹם" acha "שלום"). Árabe: tatweel U+0640 (o traço que só alonga a
// letra), harakat e os outros sinais de vogal U+064B–U+065F e o alef sobrescrito U+0670. Hebraico: niqqud,
// cantilação e pontos U+0591–U+05C7 (e o ponto varika U+FB1E), menos a pontuação que fica nessa faixa (maqaf
// U+05BE, paseq U+05C0, sof pasuq U+05C3, nun hafukha U+05C6), que continua separando palavras. Saem depois
// do NFC: as letras com hamza ou madda (أ إ آ ؤ ئ) são letras próprias e ficam. O tatweel (que não é marca)
// fica no fim da lista: dentro dos colchetes, nenhuma marca vem logo depois de uma letra.
const VOGAIS_OPCIONAIS = /[\u064B-\u065F\u0670\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\uFB1E\u0640]/g;

// Palavras curtas e comuns que não ajudam a achar nada (pt, en, es).
const PALAVRAS_VAZIAS = new Set([
    'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas',
    'para', 'pra', 'por', 'com', 'como', 'que', 'meu', 'minha', 'eu', 'se', 'ao', 'aos',
    'the', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'how', 'do', 'i', 'my', 'is', 'can',
    'el', 'la', 'los', 'las', 'un', 'una', 'del', 'en', 'y', 'con', 'cómo', 'mi', 'es',
].map(normalizar));

// Escritas sem espaço entre as palavras (tailandês, chinês, japonês). Faixas fixas de código, e
// não \p{Script}, para o app (Dart) conferir exatamente igual. O coreano tem espaço: fica de fora.
const SEM_ESPACO = [
    [0x0E00, 0x0E7F], // tailandês
    [0x3005, 0x3007], // 々 〆 〇
    [0x3021, 0x3029], // numerais de Hangzhou
    [0x3038, 0x303B], // 〸 〹 〺 〻
    [0x3040, 0x30FF], // hiragana e katakana (com ー)
    [0x31F0, 0x31FF], // katakana: extensão fonética
    [0x3400, 0x4DBF], // ideogramas: extensão A
    [0x4E00, 0x9FFF], // ideogramas
    [0xF900, 0xFAFF], // ideogramas de compatibilidade
    [0xFF66, 0xFF9F], // katakana de meia largura
    [0x1B000, 0x1B16F], // kana: suplemento e extensões
    [0x20000, 0x3FFFF], // ideogramas: extensões B em diante
];

// NFD e retirada das marcas U+0300–U+036F: tira o acento do latim, do grego e do cirílico
// ("é" → "e", "ά" → "α", "й" → "и"). As outras marcas (vogais e sinais das escritas indianas e do
// tailandês, por exemplo) fazem parte da palavra e ficam. Volta para NFC para o coreano não ficar
// decomposto e tira os sinais de vogal opcionais do árabe e do hebraico (VOGAIS_OPCIONAIS).
// É o passo que o app (sem NFD/NFC) recebe pronto, caractere a caractere, na tabela gerada.
export function semMarcas(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .normalize('NFC')
        .replace(VOGAIS_OPCIONAIS, '');
}

// Sem marcas (semMarcas) e em minúsculas. O "ς" (sigma do fim da palavra) vira "σ": a mesma palavra em
// maiúsculas e em minúsculas fica igual, aqui e no app. Fica só letra, marca e número, de qualquer escrita.
export function normalizar(texto) {
    return semMarcas(texto)
        .toLowerCase()
        .replace(/ς/g, 'σ')
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
        .trim();
}

// Prepara o índice uma vez por idioma: guarda os campos já normalizados.
export function prepararBusca(artigos) {
    return artigos.map((artigo, posicao) => ({
        artigo,
        posicao,
        campos: {
            titulo: ` ${normalizar(artigo.titulo)} `,
            tags: ` ${normalizar((artigo.tags ?? []).join(' '))} `,
            resumo: ` ${normalizar(artigo.resumo)} `,
            busca: ` ${normalizar(artigo.busca)} `,
        },
    }));
}

// "fotos" também acha "foto"; "relatorios" acha "relatorio".
function variantes(termo) {
    const lista = [termo];
    if (termo.length > 4 && termo.endsWith('es')) lista.push(termo.slice(0, -2));
    if (termo.length > 3 && termo.endsWith('s')) lista.push(termo.slice(0, -1));
    return lista;
}

function semEspaco(codigo) {
    return SEM_ESPACO.some(([de, ate]) => codigo >= de && codigo <= ate);
}

// Na consulta, cada pedaço contínuo de escrita sem espaço vira pares de letras vizinhas
// ("写真を追加" → "写真", "真を", "を追", "追加"); pedaço de uma letra fica como está. O resto da
// palavra fica inteiro ("rdoの写真" → "rdo", "の写", "写真"). No texto do artigo nada muda: o
// pedaço de palavra já é achado.
function pedacos(palavra) {
    const termos = [];
    let outra = '';
    let seguidas = [];
    const fecharSeguidas = () => {
        if (seguidas.length === 1) termos.push(seguidas[0]);
        for (let i = 0; i + 1 < seguidas.length; i++) termos.push(seguidas[i] + seguidas[i + 1]);
        seguidas = [];
    };
    for (const letra of palavra) {
        if (semEspaco(letra.codePointAt(0))) {
            if (outra) termos.push(outra);
            outra = '';
            seguidas.push(letra);
        } else {
            fecharSeguidas();
            outra += letra;
        }
    }
    fecharSeguidas();
    if (outra) termos.push(outra);
    return termos;
}

export function termosDaConsulta(consulta) {
    const todos = normalizar(consulta).split(' ').filter(Boolean);
    const importantes = todos.filter((t) => !PALAVRAS_VAZIAS.has(t));
    return (importantes.length ? importantes : todos).flatMap(pedacos);
}

function pontuarCampo(texto, termo) {
    // Palavra inteira vale mais que pedaço de palavra.
    if (texto.includes(` ${termo} `)) return 1;
    if (texto.includes(` ${termo}`)) return 0.8;
    if (texto.includes(termo)) return 0.5;
    return 0;
}

// Devolve os artigos encontrados, do mais para o menos parecido.
// opcoes.limite: quantos devolver (padrão 8).
export function buscar(preparado, consulta, opcoes = {}) {
    const limite = opcoes.limite ?? 8;
    const termos = termosDaConsulta(consulta);
    if (!termos.length) return [];

    const achados = [];
    for (const item of preparado) {
        let total = 0;
        let todos = true;
        for (const termo of termos) {
            let melhor = 0;
            for (const v of variantes(termo)) {
                for (const [campo, peso] of Object.entries(PESOS)) {
                    const p = pontuarCampo(item.campos[campo], v) * peso;
                    if (p > melhor) melhor = p;
                }
            }
            if (melhor === 0) { todos = false; break; }
            total += melhor;
        }
        if (!todos) continue;
        if (item.artigo.prioritario) total += 0.5;
        achados.push({ artigo: item.artigo, pontos: total, posicao: item.posicao });
    }
    achados.sort((a, b) => (b.pontos - a.pontos) || (a.posicao - b.posicao));
    return achados.slice(0, limite).map((a) => a.artigo);
}
