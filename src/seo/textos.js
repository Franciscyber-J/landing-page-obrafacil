// Título da aba (<title>) e descrição (<meta name="description">) de cada página. A página pronta do build e o
// site no navegador usam estas mesmas funções, então o texto é sempre o mesmo nos dois.
// t: tradução do idioma da página (i18next). Textos em src/i18n/textos (chaves "seo.*" e "<página>.meta*").

import { NOME } from './paginas.js';

// Primeiro parágrafo dos Termos/Política, cortado numa palavra (até 160 letras).
function primeiroParagrafo(blocos) {
    const p = (blocos ?? []).find((b) => b.tipo === 'paragrafo');
    const texto = p ? p.trechos.map((x) => x.texto).join('') : '';
    return texto.length > 160 ? `${texto.slice(0, 157).replace(/\s+\S*$/, '')}...` : texto;
}

// dados: { modulo } no assunto, { entrada } (item do índice) no artigo, { titulo, blocos } nos Termos/Política.
export function tituloDaPagina(t, pagina, dados = {}) {
    switch (pagina.tipo) {
        case 'inicio': return t('seo.inicio.titulo');
        case 'ajuda': return t('seo.ajuda.titulo');
        case 'assunto': return t('seo.assunto.titulo', { assunto: dados.modulo?.nome ?? '' });
        case 'artigo': return t('seo.artigo.titulo', { titulo: dados.entrada?.titulo ?? '' });
        case 'legal': return `${dados.titulo} · ${NOME}`;
        case 'suporte': return t('suporte.metaTitulo');
        case 'perfil': return t('perfil.metaTitulo');
        case 'pagamento': return t('pagamento.metaTitulo');
        default: return NOME;
    }
}

export function descricaoDaPagina(t, pagina, dados = {}) {
    switch (pagina.tipo) {
        case 'inicio': return t('seo.inicio.descricao');
        case 'ajuda': return t('seo.ajuda.descricao');
        case 'assunto': return dados.modulo?.descricao
            ? t('seo.assunto.descricao', { descricao: dados.modulo.descricao })
            : t('seo.ajuda.descricao');
        case 'artigo': return dados.entrada?.resumo ?? t('seo.ajuda.descricao');
        case 'legal': return primeiroParagrafo(dados.blocos);
        case 'suporte': return t('suporte.metaDescricao');
        case 'perfil': return t('perfil.metaDescricao');
        case 'pagamento': return t('pagamento.metaDescricao');
        default: return t('seo.inicio.descricao');
    }
}
