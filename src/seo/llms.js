// llms.txt (formato de https://llmstxt.org): o resumo do ObraFácil para os assistentes de IA (ChatGPT,
// Claude, Perplexity, Gemini) entenderem o produto e citarem as páginas certas. Gerado no build a partir dos
// mesmos textos, preços e endereços do site: muda sozinho quando eles mudam.
// Inglês primeiro (o idioma internacional do site) e depois português (o idioma de referência).

import { IDIOMAS, INTERNACIONAL, REFERENCIA, caminhoAjuda, caminhoInicio, caminhoLegal, caminhoSuporte, idioma } from '../i18n/idiomas.js';
import { precosDoIdioma } from '../i18n/pricing.js';
import { EMAIL_SUPORTE, WINDOWS, appStore, googlePlay, linkWhatsApp } from '../links.js';
import { idiomaDoConteudo } from '../ajuda/idiomas.js';
import { criarRotas } from '../ajuda/enderecos.js';
import { NOME, absoluto } from './paginas.js';

const RECURSOS = ['cronograma', 'diario', 'financeiro', 'equipe', 'compras', 'marca', 'offline', 'aparelhos'];
const PAPEIS = ['gestor', 'engenheiro', 'equipe', 'cliente'];
const PERGUNTAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Uma linha só (o formato é Markdown: nada de quebra no meio de um item) e sem os ** de destaque dos títulos.
const limpo = (texto) => String(texto ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
const lista = (valor) => (Array.isArray(valor) ? valor : []);

function preco(codigo, valor, moeda) {
    try {
        return new Intl.NumberFormat(codigo, { style: 'currency', currency: moeda }).format(Number(valor));
    } catch {
        return `${moeda} ${valor}`;
    }
}

function secaoDoIdioma(t, codigo, indice) {
    const s = [];
    const titulo = (texto) => s.push('', `## ${limpo(texto)}`, '');
    const nomeDoIdioma = idioma(codigo).nome;

    titulo(`${t('seo.llms.sobre')} (${nomeDoIdioma})`);
    s.push(limpo(t('seo.app.descricao')), '', limpo(t('seo.llms.paraQuem')), '', limpo(t('hero.subtitulo')), '');
    s.push(`- ${limpo(t('seo.llms.plataformas'))}: ${limpo(t('hero.plataformas'))}`);
    s.push(`- Google Play: ${googlePlay(codigo)}`, `- App Store: ${appStore()}`, `- Windows: ${WINDOWS}`);

    titulo(t('seo.llms.recursos'));
    for (const id of RECURSOS) s.push(`- **${limpo(t(`recursos.itens.${id}.titulo`))}**: ${limpo(t(`recursos.itens.${id}.texto`))}`);
    s.push(`- **${limpo(t('cliente.titulo'))}** ${limpo(t('cliente.texto'))}`);

    titulo(t('seo.llms.papeis'));
    s.push(limpo(t('equipe.texto')), '');
    for (const id of PAPEIS) s.push(`- **${limpo(t(`equipe.papeis.${id}.nome`))}**: ${limpo(t(`equipe.papeis.${id}.desc`))}`);

    titulo(t('seo.llms.planos'));
    s.push(`- **${limpo(t('pricing.gratis.nome'))}** (${limpo(t('pricing.gratisPreco'))}): ${limpo(t('pricing.gratis.desc'))} ${lista(t('pricing.gratis.itens', { returnObjects: true })).map(limpo).join('; ')}.`);
    s.push(`- **PRO**: ${limpo(t('pricing.pro.desc'))} ${lista(t('pricing.pro.itens', { returnObjects: true })).map(limpo).join('; ')}.`);
    s.push(`- ${limpo(t('pricing.renovacao'))}`, `- ${limpo(t('pricing.lojas'))}`, `- ${limpo(t('pricing.addons'))}`);
    s.push('', `${limpo(t('seo.llms.precosPorIdioma'))}:`, '');
    for (const i of IDIOMAS) {
        const p = precosDoIdioma(i.codigo);
        const linha = t('seo.llms.precoLinha', { mensal: preco(i.codigo, p.mensal, p.moeda), anual: preco(i.codigo, p.anual, p.moeda) });
        s.push(`- [${i.nome}](${absoluto(caminhoInicio(i.codigo, 'precos'))}): ${limpo(linha)}`);
    }

    titulo(t('faq.title'));
    for (const n of PERGUNTAS) s.push(`- **${limpo(t(`faq.q${n}`))}** ${limpo(t(`faq.a${n}`))}`);

    titulo(t('seo.llms.paginas'));
    s.push(`- [${limpo(t('seo.inicio.titulo'))}](${absoluto(caminhoInicio(codigo))}): ${limpo(t('seo.inicio.descricao'))}`);
    s.push(`- [${limpo(t('seo.ajuda.titulo'))}](${absoluto(caminhoAjuda(codigo))}): ${limpo(t('seo.ajuda.descricao'))}`);
    s.push(`- [${limpo(t('suporte.metaTitulo'))}](${absoluto(caminhoSuporte(codigo))}): ${limpo(t('suporte.metaDescricao'))}`);
    s.push(`- [${limpo(t('footer.terms'))}](${absoluto(caminhoLegal(codigo, 'termos'))})`);
    s.push(`- [${limpo(t('footer.privacy'))}](${absoluto(caminhoLegal(codigo, 'privacidade'))})`);

    if (indice) {
        const rotas = criarRotas(codigo);
        const essenciais = indice.artigos.filter((a) => a.prioritario);
        if (essenciais.length) {
            titulo(`${t('ajuda.titulo')}: ${t('ajuda.essenciaisTitulo')}`);
            for (const a of essenciais) s.push(`- [${limpo(a.titulo)}](${absoluto(rotas.artigo(a.slug))}): ${limpo(a.resumo)}`);
        }
        titulo(`${t('ajuda.titulo')}: ${t('ajuda.assuntosTitulo')}`);
        for (const m of indice.modulos) s.push(`- [${limpo(m.nome)}](${absoluto(rotas.assunto(m))})${m.descricao ? `: ${limpo(m.descricao)}` : ''}`);
    }

    titulo(t('footer.contato'));
    s.push(`- [${limpo(t('suporte.metaTitulo'))}](${absoluto(caminhoSuporte(codigo))})`);
    s.push(`- ${limpo(t('suporte.emailTitulo'))}: ${EMAIL_SUPORTE}`);
    s.push(`- ${limpo(t('suporte.whatsappTitulo'))}: ${linkWhatsApp(t('whatsapp.message'))}`);
    return s;
}

// tradutor(codigo) → t do idioma; indices: { <idioma dos artigos>: índice da Central } (pode faltar).
export function gerarLlms({ tradutor, indices = {} }) {
    const en = tradutor(INTERNACIONAL);
    const linhas = [`# ${NOME}`, '', `> ${limpo(en('seo.app.descricao'))}`, ''];
    linhas.push(`${limpo(en('seo.llms.idiomas'))}:`, '');
    for (const i of IDIOMAS) linhas.push(`- [${i.nome}](${absoluto(caminhoInicio(i.codigo))})`);
    for (const codigo of [INTERNACIONAL, REFERENCIA]) {
        linhas.push(...secaoDoIdioma(tradutor(codigo), codigo, indices[idiomaDoConteudo(codigo)] ?? null));
    }
    const todos = indices[idiomaDoConteudo(INTERNACIONAL)];
    if (todos) {
        const rotas = criarRotas(INTERNACIONAL);
        const modulos = new Map(todos.modulos.map((m) => [m.id, m.nome]));
        linhas.push('', '## Optional', '', `${limpo(en('seo.llms.todosArtigos'))}:`, '');
        for (const a of todos.artigos) linhas.push(`- [${limpo(a.titulo)}](${absoluto(rotas.artigo(a.slug))}) (${limpo(modulos.get(a.modulo) ?? '')}): ${limpo(a.resumo)}`);
    }
    linhas.push('');
    return linhas.join('\n');
}
