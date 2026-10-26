// Plurais dos textos do site. O i18next escolhe a forma pelo número (count) com a regra de cada idioma
// (Intl.PluralRules): chave_zero, _one, _two, _few, _many e _other, só as que a língua usa (o npm run idiomas diz
// quais faltam em cada idioma).
//
// Variante regional (pt-PT, en-GB, es-MX...): o arquivo dela tem só o que muda, e o resto vem da base. Só que o
// i18next escolhe a forma do plural pela regra do idioma em que achou o texto: um plural herdado da base usaria a regra
// da base (no Brasil "0 artigo", em Portugal "0 artigos"). Por isso, ao carregar a variante, as formas de plural da
// base que ela não reescreveu entram no próprio idioma da variante, que escolhe a forma pela regra dela. Os arquivos
// não mudam. Sem React e sem navegador: o build (src/ssr/i18n.js), o site (config.js) e os testes usam.

export const CATEGORIAS = ['zero', 'one', 'two', 'few', 'many', 'other'];
const SUFIXO = new RegExp(`^(.*)_(${CATEGORIAS.join('|')})$`);

function achatar(obj, prefixo = '', saida = new Map()) {
    for (const [k, v] of Object.entries(obj ?? {})) {
        const chave = prefixo ? `${prefixo}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) achatar(v, chave, saida);
        else saida.set(chave, v);
    }
    return saida;
}

// Grupos de plural de um arquivo de textos: chave sem o sufixo → formas. Só conta como plural o grupo com _other
// (ex.: "tipo_fluxo" não é plural).
export function gruposDePlural(textos) {
    const grupos = new Map();
    for (const [chave, valor] of achatar(textos)) {
        const m = chave.match(SUFIXO);
        if (!m) continue;
        if (!grupos.has(m[1])) grupos.set(m[1], new Map());
        grupos.get(m[1]).set(m[2], valor);
    }
    for (const [base, formas] of grupos) if (!formas.has('other')) grupos.delete(base);
    return grupos;
}

// Textos da variante com as formas de plural da base que ela não reescreveu (cópia; não altera os objetos recebidos).
export function comPluraisDaBase(propria, base) {
    const saida = structuredClone(propria ?? {});
    for (const [grupo, formas] of gruposDePlural(base)) {
        const partes = grupo.split('.');
        let alvo = saida;
        let livre = true;
        for (const p of partes.slice(0, -1)) {
            if (alvo[p] === undefined) alvo[p] = {};
            if (typeof alvo[p] !== 'object' || Array.isArray(alvo[p])) { livre = false; break; }
            alvo = alvo[p];
        }
        if (!livre) continue;
        const ultima = partes[partes.length - 1];
        for (const [categoria, valor] of formas) {
            const chave = `${ultima}_${categoria}`;
            if (alvo[chave] === undefined) alvo[chave] = valor;
        }
    }
    return saida;
}
