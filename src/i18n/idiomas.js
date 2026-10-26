// Regras dos idiomas do site: cadeia de textos, escolha pelo navegador e endereços.
// Os dados ficam em registro.js; aqui não há nada para editar ao incluir um idioma.
// Sem React e sem navegador: os testes (idiomas.test.js) rodam no Node.

import { IDIOMAS as CADASTRO, INTERNACIONAL, REFERENCIA } from './registro.js';

export { INTERNACIONAL, REFERENCIA };

const SECOES = ['sobre', 'recursos', 'equipe', 'precos', 'faq'];
// Compras com página própria de volta do pagamento (rotas.compras no cadastro).
const COMPRAS = ['pro', 'acesso', 'downloads', 'armazenamento'];

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
            termos: rotas.termos ?? rotasBase.termos,
            privacidade: rotas.privacidade ?? rotasBase.privacidade,
            pagamento: rotas.pagamento ?? rotasBase.pagamento,
            compras: { ...(rotasBase.compras ?? {}), ...(rotas.compras ?? {}) },
            perfil: rotas.perfil ?? rotasBase.perfil,
            suporte: rotas.suporte ?? rotasBase.suporte,
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

// Termos de Uso e Política de Privacidade (documento: 'termos' | 'privacidade').
export const DOCUMENTOS_LEGAIS = ['termos', 'privacidade'];

export function caminhoLegal(codigo, documento) {
    const i = idioma(codigo) ?? idioma(REFERENCIA);
    if (!DOCUMENTOS_LEGAIS.includes(documento)) throw new Error(`Documento legal desconhecido: ${documento}`);
    return `/${i.prefixo}/${i.rotas[documento]}`;
}

// Página de volta do pagamento pelo navegador (compra: pro | acesso | downloads | armazenamento; sem compra,
// o texto geral) e as páginas do Perfil e do Suporte.
export function caminhoPagamento(codigo, compra) {
    const i = idioma(codigo) ?? idioma(REFERENCIA);
    if (compra && !COMPRAS.includes(compra)) throw new Error(`Compra desconhecida: ${compra}`);
    return `/${i.prefixo}/${i.rotas.pagamento}${compra ? `/${i.rotas.compras[compra]}` : ''}`;
}

export function caminhoPerfil(codigo) {
    const i = idioma(codigo) ?? idioma(REFERENCIA);
    return `/${i.prefixo}/${i.rotas.perfil}`;
}

export function caminhoSuporte(codigo) {
    const i = idioma(codigo) ?? idioma(REFERENCIA);
    return `/${i.prefixo}/${i.rotas.suporte}`;
}

// Endereços que o WordPress usava (e que estão nas lojas de aplicativos): continuam valendo.
const LEGAIS_ANTIGOS = { 'termos-de-uso': 'termos', 'politicas-de-privacidade': 'privacidade' };

// Endereços sem idioma que o WordPress servia e que estão nas sessões de pagamento da Stripe, no Payment Link
// do site e em e-mails já enviados (gestao_obras, functions/src/index.ts). Não podem mudar: o .htaccess
// entrega o site neles e o site leva à página no idioma da pessoa.
export const PAGINAS_ANTIGAS = {
    'pagamento-ok': { pagina: 'pagamento', compra: 'acesso' },
    'pacote-downloads-extras': { pagina: 'pagamento', compra: 'downloads' },
    'primeiros-passos': { pagina: 'pagamento', compra: 'pro' },
    'expansao-20gb-ok': { pagina: 'pagamento', compra: 'armazenamento' },
    perfil: { pagina: 'perfil' },
    suporte: { pagina: 'suporte' },
};

// Palavra de endereço na escrita do idioma (o slug dos artigos, o nome do assunto e as palavras do cadastro, como
// "ajuda"/"help"): letras (minúsculas onde a escrita tem maiúscula), as marcas da escrita (vogais do hindi e do
// tailandês, dakuten do japonês...) e números, com hífen só entre as palavras; sem espaço, pontuação nem barra;
// em NFC (um jeito só de escrever a mesma palavra, que é também o nome da pasta da página pronta). Mesmo formato
// do slug dos artigos no gestao_obras (ajuda/esquema/artigo.schema.json, ferramentas/ajuda/src/validar.mjs).
export const FORMATO_DE_ENDERECO = /^[\p{Ll}\p{Lm}\p{Lo}\p{N}][\p{Ll}\p{Lm}\p{Lo}\p{M}\p{N}]*(?:-[\p{Ll}\p{Lm}\p{Lo}\p{N}][\p{Ll}\p{Lm}\p{Lo}\p{M}\p{N}]*)*$/u;

export function palavraDeEnderecoValida(palavra) {
    if (typeof palavra !== 'string') return false;
    return FORMATO_DE_ENDERECO.test(palavra) && palavra === palavra.normalize('NFC') && palavra === palavra.toLowerCase();
}

// Sinais de vogal opcionais do árabe e do hebraico (os mesmos que a busca ignora, src/ajuda/busca.js): o nome do
// assunto no endereço fica sem eles, como se escreve no dia a dia.
const VOGAIS_OPCIONAIS = /[\u064B-\u065F\u0670\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\uFB1E\u0640]/g;

// Nome do assunto no endereço: o nome do módulo no idioma, sem acento do latim, do grego e do cirílico
// ("Financeiro da obra" → financeiro-da-obra, "Ρυθμίσεις" → ρυθμισεις) e sem os sinais de vogal opcionais do
// árabe e do hebraico. As outras escritas ficam na própria escrita, com as marcas que fazem parte da palavra
// ("रिपोर्ट", "รายงาน", "ダウンロード"), em NFC e minúsculas.
export function slugDoTexto(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036F]/g, '')
        .normalize('NFC')
        .replace(VOGAIS_OPCIONAIS, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
        // Marca solta no começo de uma palavra (sem a letra a que pertence) não fica no endereço.
        .replace(/(^|-)\p{M}+/gu, '$1')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Pedaço do endereço como texto: o navegador manda "写真" como %E5%86%99%E7%9C%9F. Com % solto, fica como veio.
function decodificar(parte) {
    try {
        return decodeURIComponent(parte);
    } catch {
        return parte;
    }
}

const PALAVRAS_AJUDA = new Set(IDIOMAS.map((i) => i.rotas.ajuda.toLowerCase()));
// Palavra do endereço (de qualquer idioma) → documento legal.
const PALAVRAS_LEGAIS = new Map(IDIOMAS.flatMap((i) => DOCUMENTOS_LEGAIS.map((d) => [i.rotas[d].toLowerCase(), d])));
const PALAVRAS_ASSUNTO = new Set(IDIOMAS.map((i) => i.rotas.assunto.toLowerCase()));
// Palavra do endereço (de qualquer idioma) → página de conta (pagamento, perfil, suporte) e compra.
const PALAVRAS_CONTA = new Map(IDIOMAS.flatMap((i) => ['pagamento', 'perfil', 'suporte'].map((p) => [i.rotas[p].toLowerCase(), p])));
const PALAVRAS_COMPRA = new Map(IDIOMAS.flatMap((i) => COMPRAS.map((c) => [i.rotas.compras[c].toLowerCase(), c])));

// Lê um endereço do site. Resultado:
//   { tipo: 'raiz' }                                   → /
//   { tipo: 'antigo', codigo|null, pagina, modulo, slug } → /ajuda/... (endereços de antes)
//   { tipo: 'antigo', codigo: null, pagina: 'legal', documento } → /termos-de-uso/, /politicas-de-privacidade/
//   { tipo: 'antigo', codigo: null, pagina: 'pagamento' (com compra) | 'perfil' | 'suporte' } → PAGINAS_ANTIGAS
//   { tipo: 'pagina', codigo, pagina, modulo, slug, canonico }
//       pagina: inicio | ajuda | assunto | artigo | legal (com documento) | pagamento (com compra, ou null)
//               | perfil | suporte | nao-encontrado
//       canonico: endereço certo quando o pedido veio com outra grafia (/PT-BR/help → /pt-br/ajuda)
//   { tipo: 'desconhecido' }
export function analisarCaminho(pathname) {
    const crus = String(pathname ?? '/').split('/').filter(Boolean).map(decodificar);
    // A mesma palavra pode chegar decomposta (NFD, de um link escrito à mão ou copiado de outro sistema): ela é
    // lida em NFC, a forma dos endereços do site, e a página vai para o endereço em NFC.
    const segs = crus.map((s) => s.normalize('NFC'));
    const foraDoNfc = segs.some((s, k) => s !== crus[k]);
    if (segs.length === 0) return { tipo: 'raiz' };

    // Object.hasOwn: "/constructor" ou "/toString" não podem ser lidos como endereço antigo.
    const primeiro = segs[0].toLowerCase();
    const antigo = Object.hasOwn(LEGAIS_ANTIGOS, primeiro) ? LEGAIS_ANTIGOS[primeiro] : null;
    if (antigo && segs.length === 1) return { tipo: 'antigo', codigo: null, pagina: 'legal', documento: antigo };
    const paginaAntiga = Object.hasOwn(PAGINAS_ANTIGAS, primeiro) ? PAGINAS_ANTIGAS[primeiro] : null;
    if (paginaAntiga && segs.length === 1) return { tipo: 'antigo', codigo: null, ...paginaAntiga };

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
    const pagina = (dados, canonico) => ({
        tipo: 'pagina', codigo: i.codigo, ...dados,
        canonico: canonico ?? (foraDoNfc && dados.pagina !== 'nao-encontrado' ? `/${segs.join('/')}` : null),
    });
    const prefixoErrado = segs[0] !== i.prefixo;

    if (resto.length === 0) return pagina({ pagina: 'inicio' }, prefixoErrado ? caminhoInicio(i.codigo) : null);

    const palavra = resto[0].toLowerCase();
    const documento = PALAVRAS_LEGAIS.get(palavra);
    if (documento) {
        if (resto.length !== 1) return pagina({ pagina: 'nao-encontrado' }, null);
        const certo = caminhoLegal(i.codigo, documento);
        return pagina({ pagina: 'legal', documento }, prefixoErrado || resto[0] !== r[documento] ? certo : null);
    }
    const conta = PALAVRAS_CONTA.get(palavra);
    if (conta === 'pagamento') {
        if (resto.length > 2) return pagina({ pagina: 'nao-encontrado' }, null);
        // Compra desconhecida (ou sem compra): o texto geral, no endereço sem a compra.
        const compra = resto.length === 2 ? PALAVRAS_COMPRA.get(resto[1].toLowerCase()) ?? null : null;
        const errado = prefixoErrado || resto[0] !== r.pagamento || (resto.length === 2 && resto[1] !== r.compras[compra]);
        return pagina({ pagina: 'pagamento', compra }, errado ? caminhoPagamento(i.codigo, compra) : null);
    }
    if (conta) {
        if (resto.length !== 1) return pagina({ pagina: 'nao-encontrado' }, null);
        const certo = conta === 'perfil' ? caminhoPerfil(i.codigo) : caminhoSuporte(i.codigo);
        return pagina({ pagina: conta }, prefixoErrado || resto[0] !== r[conta] ? certo : null);
    }
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

// Endereço antigo (tipo 'antigo' de analisarCaminho) → mesma página no idioma pedido.
export function caminhoDoAntigo(lido, codigo) {
    if (lido.pagina === 'legal') return caminhoLegal(codigo, lido.documento);
    if (lido.pagina === 'pagamento') return caminhoPagamento(codigo, lido.compra);
    if (lido.pagina === 'perfil') return caminhoPerfil(codigo);
    if (lido.pagina === 'suporte') return caminhoSuporte(codigo);
    if (lido.pagina === 'assunto') return caminhoAssunto(codigo, lido.modulo);
    if (lido.pagina === 'artigo') return caminhoArtigo(codigo, lido.slug);
    return caminhoAjuda(codigo);
}

// O que vem depois do "?" ao levar um endereço antigo para o novo. Os anúncios (?utm_..., ?gclid=...) seguem.
// A volta do pagamento e o link dos e-mails não levam nada adiante: a consulta pode trazer o identificador da
// sessão de pagamento (?session_id=...), que não serve à página e não deve ficar no endereço.
export function consultaQueSegue(lido, search) {
    return lido.pagina === 'pagamento' || lido.pagina === 'perfil' ? '' : (search ?? '');
}

// Âncora da página inicial (#precos, #pricing...) → seção (precos). Aceita a palavra de
// qualquer idioma e o nome interno, para links antigos e compartilhados continuarem valendo.
export function secaoDaAncora(hash) {
    const palavra = decodificar(String(hash ?? '').replace(/^#/, '')).normalize('NFC').toLowerCase();
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

export { COMPRAS, SECOES };
