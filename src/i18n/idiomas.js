// Regras dos idiomas do site: cadeia de textos, escolha pelo navegador e endereços.
// Os dados ficam em registro.js; aqui não há nada para editar ao incluir um idioma.
// Sem React e sem navegador: os testes (idiomas.test.js) rodam no Node.

import { IDIOMAS as CADASTRO, INTERNACIONAL, REFERENCIA } from './registro.js';

export { INTERNACIONAL, REFERENCIA };

const SECOES = ['sobre', 'recursos', 'equipe', 'precos', 'faq'];

function completar(entrada, porCodigo) {
    const base = entrada.base ? porCodigo.get(entrada.base) : null;
    const rotasBase = base?.rotas ?? {};
    const rotas = entrada.rotas ?? {};
    return {
        ...entrada,
        base: entrada.base ?? null,
        direcao: entrada.direcao ?? base?.direcao ?? 'ltr',
        regioes: entrada.regioes ?? [],
        prefixo: entrada.codigo.toLowerCase(),
        rotas: {
            ajuda: rotas.ajuda ?? rotasBase.ajuda,
            assunto: rotas.assunto ?? rotasBase.assunto,
            secoes: { ...(rotasBase.secoes ?? {}), ...(rotas.secoes ?? {}) },
        },
    };
}

const BRUTOS = new Map(CADASTRO.map((i) => [i.codigo, i]));

export const IDIOMAS = CADASTRO.map((i) => completar(i, BRUTOS));
export const CODIGOS = IDIOMAS.map((i) => i.codigo);

const POR_CODIGO = new Map(IDIOMAS.map((i) => [i.codigo.toLowerCase(), i]));

export function idioma(codigo) {
    return codigo ? POR_CODIGO.get(String(codigo).toLowerCase()) ?? null : null;
}

// Ordem em que um texto é procurado: o próprio idioma, a base, o inglês e o português.
export function cadeia(codigo) {
    const lista = [];
    let atual = idioma(codigo);
    while (atual && !lista.includes(atual.codigo)) {
        lista.push(atual.codigo);
        atual = atual.base ? idioma(atual.base) : null;
    }
    for (const extra of [INTERNACIONAL, REFERENCIA]) if (!lista.includes(extra)) lista.push(extra);
    return lista;
}

function partes(pedido) {
    let canonico;
    try {
        [canonico] = Intl.getCanonicalLocales(pedido);
    } catch {
        return null;
    }
    if (!canonico) return null;
    try {
        const l = new Intl.Locale(canonico);
        return { exato: canonico.toLowerCase(), lingua: l.language, regiao: l.region ?? null };
    } catch {
        return null;
    }
}

// Melhor idioma do site para a lista de idiomas do navegador (navigator.languages),
// respeitando a ordem de preferência da pessoa. Ex.: ['es-AR', 'en'] → es-MX.
export function escolherIdioma(pedidos) {
    for (const pedido of pedidos ?? []) {
        const p = partes(pedido);
        if (!p) continue;
        const exato = POR_CODIGO.get(p.exato);
        if (exato) return exato.codigo;
        const mesmaLingua = IDIOMAS.filter((i) => i.codigo.split('-')[0].toLowerCase() === p.lingua);
        if (!mesmaLingua.length) continue;
        if (p.regiao) {
            const daRegiao = mesmaLingua.find((i) => i.regioes.includes(p.regiao));
            if (daRegiao) return daRegiao.codigo;
        }
        return (mesmaLingua.find((i) => !i.base) ?? mesmaLingua[0]).codigo;
    }
    return INTERNACIONAL;
}

// ---------- Endereços ----------

export function caminhoInicio(codigo, secao) {
    const i = idioma(codigo) ?? idioma(REFERENCIA);
    const ancora = secao ? i.rotas.secoes[secao] : null;
    return `/${i.prefixo}/${ancora ? `#${ancora}` : ''}`;
}

export function caminhoAjuda(codigo) {
    const i = idioma(codigo) ?? idioma(REFERENCIA);
    return `/${i.prefixo}/${i.rotas.ajuda}`;
}

export function caminhoAssunto(codigo, modulo) {
    const i = idioma(codigo) ?? idioma(REFERENCIA);
    return `${caminhoAjuda(i.codigo)}/${i.rotas.assunto}/${modulo}`;
}

export function caminhoArtigo(codigo, slug) {
    return `${caminhoAjuda(codigo)}/${slug}`;
}

// Nome do assunto no endereço: o nome do módulo no idioma, sem acento ("Financeiro da obra"
// → financeiro-da-obra). Letras de outros alfabetos ficam como estão.
export function slugDoTexto(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '');
}

function decodificar(parte) {
    try {
        return decodeURIComponent(parte);
    } catch {
        return parte;
    }
}

const PALAVRAS_AJUDA = new Set(IDIOMAS.map((i) => i.rotas.ajuda.toLowerCase()));
const PALAVRAS_ASSUNTO = new Set(IDIOMAS.map((i) => i.rotas.assunto.toLowerCase()));

// Lê um endereço do site. Resultado:
//   { tipo: 'raiz' }                                   → /
//   { tipo: 'antigo', codigo|null, pagina, modulo, slug } → /ajuda/... (endereços de antes)
//   { tipo: 'pagina', codigo, pagina, modulo, slug, canonico }
//       pagina: inicio | ajuda | assunto | artigo | nao-encontrado
//       canonico: endereço certo quando o pedido veio com outra grafia (/PT-BR/help → /pt-br/ajuda)
//   { tipo: 'desconhecido' }
export function analisarCaminho(pathname) {
    const segs = String(pathname ?? '/').split('/').filter(Boolean).map(decodificar);
    if (segs.length === 0) return { tipo: 'raiz' };

    if (segs[0].toLowerCase() === 'ajuda' && !idioma(segs[0])) {
        const resto = segs.slice(1);
        const cod = resto.length && idioma(resto[0]) ? idioma(resto[0]).codigo : null;
        const r = cod ? resto.slice(1) : resto;
        if (r.length === 0) return { tipo: 'antigo', codigo: cod, pagina: 'ajuda' };
        if (r.length === 2 && r[0] === 'assunto') return { tipo: 'antigo', codigo: cod, pagina: 'assunto', modulo: r[1] };
        if (r.length === 1) return { tipo: 'antigo', codigo: cod, pagina: 'artigo', slug: r[0] };
        return { tipo: 'antigo', codigo: cod, pagina: 'ajuda' };
    }

    const i = idioma(segs[0]);
    if (!i) return { tipo: 'desconhecido' };
    const resto = segs.slice(1);
    const r = i.rotas;
    const pagina = (dados, canonico) => ({ tipo: 'pagina', codigo: i.codigo, ...dados, canonico });
    const prefixoErrado = segs[0] !== i.prefixo;

    if (resto.length === 0) return pagina({ pagina: 'inicio' }, prefixoErrado ? caminhoInicio(i.codigo) : null);

    const palavra = resto[0].toLowerCase();
    if (!PALAVRAS_AJUDA.has(palavra)) return pagina({ pagina: 'nao-encontrado' }, null);
    const ajudaErrada = prefixoErrado || resto[0] !== r.ajuda;

    if (resto.length === 1) return pagina({ pagina: 'ajuda' }, ajudaErrada ? caminhoAjuda(i.codigo) : null);
    if (resto.length === 3 && PALAVRAS_ASSUNTO.has(resto[1].toLowerCase())) {
        const errado = ajudaErrada || resto[1] !== r.assunto;
        return pagina({ pagina: 'assunto', modulo: resto[2] }, errado ? caminhoAssunto(i.codigo, resto[2]) : null);
    }
    if (resto.length === 2) {
        return pagina({ pagina: 'artigo', slug: resto[1] }, ajudaErrada ? caminhoArtigo(i.codigo, resto[1]) : null);
    }
    return pagina({ pagina: 'nao-encontrado' }, null);
}

// Âncora da página inicial (#precos, #pricing...) → seção (precos). Aceita a palavra de
// qualquer idioma e o nome interno, para links antigos e compartilhados continuarem valendo.
export function secaoDaAncora(hash) {
    const palavra = decodificar(String(hash ?? '').replace(/^#/, '')).toLowerCase();
    if (!palavra) return null;
    if (SECOES.includes(palavra)) return palavra;
    for (const i of IDIOMAS) {
        for (const [secao, valor] of Object.entries(i.rotas.secoes)) if (valor.toLowerCase() === palavra) return secao;
    }
    return null;
}

export function idDaSecao(codigo, secao) {
    return (idioma(codigo) ?? idioma(REFERENCIA)).rotas.secoes[secao] ?? secao;
}

export { SECOES };
