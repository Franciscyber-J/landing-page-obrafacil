// Busca da Central de Ajuda. Roda no navegador, sobre o índice do idioma (sem servidor).
// Sem diferença de acento nem de maiúscula; título pesa mais que tag, tag mais que resumo
// e resumo mais que o texto dos passos. Todas as palavras importantes da busca precisam
// aparecer em algum lugar do artigo.

const PESOS = { titulo: 10, tags: 6, resumo: 3, busca: 1 };

// Palavras curtas e comuns que não ajudam a achar nada (pt, en, es).
const PALAVRAS_VAZIAS = new Set([
    'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas',
    'para', 'pra', 'por', 'com', 'como', 'que', 'meu', 'minha', 'eu', 'se', 'ao', 'aos',
    'the', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'how', 'do', 'i', 'my', 'is', 'can',
    'el', 'la', 'los', 'las', 'un', 'una', 'del', 'en', 'y', 'con', 'cómo', 'mi', 'es',
].map(normalizar));

export function normalizar(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
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

export function termosDaConsulta(consulta) {
    const todos = normalizar(consulta).split(' ').filter(Boolean);
    const importantes = todos.filter((t) => !PALAVRAS_VAZIAS.has(t));
    return importantes.length ? importantes : todos;
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
