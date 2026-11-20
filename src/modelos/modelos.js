// Modelos grátis (decisão do Francis, 20/11/2026): os 27 checklists de qualidade (FVS) prontos do app e o diário de
// obra (RDO), para ler no site, baixar em PDF e imprimir. O que o site dá de graça é o modelo (a lista para usar no
// papel); a página leva ao app, onde o mesmo modelo vira checklist de verdade.
//
// Os dados vêm do app (src/modelos/dados/<idioma>.json, copiados por "npm run modelos -- copiar"; ver LEIAME.md).
// Aqui ficam só as regras, sem React e sem navegador: o site, o build das páginas prontas, os PDFs e os testes usam.

import { caminhoModelo, caminhoModelos, idioma, slugDoTexto } from '../i18n/idiomas.js';

// O id do diário de obra (os checklists usam o id do serviço no app: alvenaria_estrutural...).
export const DIARIO = 'diario_de_obra';

// Ordem das seções dos itens, igual à do app (SecaoDoItem em lib/checklists/checklist.dart), com o texto do app.
export const SECOES = [
    { codigo: 'A', chave: 'checklistSecaoAntes' },
    { codigo: 'D', chave: 'checklistSecaoDurante' },
    { codigo: 'C', chave: 'checklistSecaoConclusao' },
];

// Campos do diário de obra, na ordem do PDF do RDO do app (rdo_pdf_service.dart). rotulo: texto do app; o texto
// do que vai em cada campo é do site (modelos.diario.campos.<id>).
export const CAMPOS_DO_DIARIO = [
    { id: 'data', rotulo: 'pdfRdoDateClient' },
    { id: 'clima', rotulo: 'rdoFormWeatherTitle', opcoes: ['weatherSunny', 'weatherCloudy', 'weatherRainy', 'weatherShowers', 'weatherVariable'] },
    { id: 'avanco', rotulo: 'pdfRdoPhysicalProgress' },
    { id: 'efetivo', rotulo: 'pdfRdoWorkforceTitle', opcoes: ['pdfRdoPresenceFull', 'pdfRdoPresenceHalf', 'rdoFormLaborAbsent'] },
    { id: 'avulsa', rotulo: 'rdoFormLaborExtraTitle' },
    { id: 'atividades', rotulo: 'pdfRdoActivitiesTitle' },
    { id: 'observacoes', rotulo: 'rdoFormObsTitle' },
    { id: 'fotos', rotulo: 'pdfRdoPhotosTitle' },
    { id: 'responsavel', rotulo: 'rdoFormSignatureTitle' },
];

// Texto do app com os {nome} trocados: pelo valor dado ou, sem valor, por nada (o rótulo de um campo em branco).
// "Clima: {weather}" → "Clima:"; "Data: {date} | cliente: {client}" com { date: '___' } → "Data: ___ | cliente:".
export function textoDoApp(dados, chave, valores = {}) {
    const texto = dados?.app?.[chave];
    if (typeof texto !== 'string') throw new Error(`Texto do app ${chave} não copiado (src/modelos/dados)`);
    return texto.replace(/\{(\w+)\}/g, (_, nome) => valores[nome] ?? '').replace(/\s+([|:;·,)])/g, ' $1').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
}

// Rótulo de campo a partir do texto do app que tem um valor depois de ":" ("Clima: {weather}" → "Clima"). Sem os
// dois-pontos (ou com o valor no meio, como no japonês), o texto sem o valor.
export function rotuloDoApp(dados, chave) {
    const texto = dados?.app?.[chave];
    if (typeof texto !== 'string') throw new Error(`Texto do app ${chave} não copiado (src/modelos/dados)`);
    const m = /^([^{]+?)\s*[:：]\s*%?\{\w+\}\s*%?$/.exec(texto);
    return m ? m[1].trim() : textoDoApp(dados, chave);
}

// O texto do app em pedaços, para desenhar o campo em branco do formulário: [{ texto }, { branco: 'date' }, ...].
// valores: os {nome} que já têm valor (ex.: { numero: '1' } na reinspeção); os outros viram linha para preencher.
export function partesDoTexto(dados, chave, valores = {}) {
    const texto = dados?.app?.[chave];
    if (typeof texto !== 'string') throw new Error(`Texto do app ${chave} não copiado (src/modelos/dados)`);
    const partes = [];
    let resto = texto;
    for (const m of texto.matchAll(/\{(\w+)\}/g)) {
        const [antes] = resto.split(m[0], 1);
        if (antes) partes.push({ texto: antes });
        partes.push(Object.hasOwn(valores, m[1]) ? { texto: String(valores[m[1]]) } : { branco: m[1] });
        resto = resto.slice(antes.length + m[0].length);
    }
    if (resto) partes.push({ texto: resto });
    // Pedaços de texto vizinhos juntos (o valor dado entre dois textos).
    return partes.reduce((lista, p) => {
        const ultimo = lista[lista.length - 1];
        if (p.texto !== undefined && ultimo?.texto !== undefined) ultimo.texto += p.texto;
        else lista.push({ ...p });
        return lista;
    }, []);
}

export function slugDoModelo(modelo) {
    return slugDoTexto(modelo.nome);
}

// Os modelos do idioma, na ordem da página: o diário de obra primeiro e depois os 27 checklists (ordem do app).
// Cada um: { id, tipo: 'diario' | 'checklist', slug, nome?, grupo?, itens? }.
export function modelosDoIdioma(dados, codigo) {
    const i = idioma(codigo);
    if (!i) throw new Error(`Idioma desconhecido: ${codigo}`);
    const lista = [{ id: DIARIO, tipo: 'diario', slug: i.rotas.diario }];
    for (const m of dados.biblioteca.modelos) lista.push({ ...m, tipo: 'checklist', slug: slugDoModelo(m) });
    return lista;
}

export function modeloPeloSlug(dados, codigo, slug) {
    const alvo = String(slug ?? '').normalize('NFC').toLowerCase();
    return modelosDoIdioma(dados, codigo).find((m) => m.slug === alvo) ?? null;
}

export function modeloPeloId(dados, codigo, id) {
    return modelosDoIdioma(dados, codigo).find((m) => m.id === id) ?? null;
}

// Os grupos do app com os checklists de cada um, na ordem do app.
export function gruposComModelos(dados, codigo) {
    const checklists = modelosDoIdioma(dados, codigo).filter((m) => m.tipo === 'checklist');
    return dados.biblioteca.grupos
        .map((g) => ({ ...g, modelos: checklists.filter((m) => m.grupo === g.id) }))
        .filter((g) => g.modelos.length);
}

export function nomeDoGrupo(dados, grupo) {
    return dados.biblioteca.grupos.find((g) => g.id === grupo)?.nome ?? grupo;
}

// Os itens do checklist em seções (Antes de começar, Durante a execução, Na conclusão), com o número de cada item
// contado na ordem em que aparecem (o mesmo Nº da ficha em PDF).
export function itensPorSecao(modelo) {
    let numero = 0;
    return SECOES.map((s) => ({
        ...s,
        itens: modelo.itens.filter((i) => i.secao === s.codigo).map((i) => ({ ...i, numero: ++numero })),
    })).filter((s) => s.itens.length);
}

export function contagem(modelo) {
    return {
        itens: modelo.itens.length,
        criticos: modelo.itens.filter((i) => i.critico).length,
        fotos: modelo.itens.filter((i) => i.foto).length,
    };
}

// Papel do PDF no idioma ('a4' | 'carta'), do cadastro (src/i18n/registro.js), como o app faz pelo país da conta.
export function papelDoIdioma(codigo) {
    return idioma(codigo)?.papel ?? 'a4';
}

// Medidas de cada papel (o PDF do Chromium recebe a largura e a altura).
export const PAPEIS = {
    a4: { largura: '210mm', altura: '297mm' },
    carta: { largura: '8.5in', altura: '11in' },
};

// Endereço do PDF de um modelo: /modelos-pdf/<idioma>/<slug>.pdf. Fica fora das pastas dos idiomas (lá só ficam
// páginas) e tem o mesmo nome do endereço da página do modelo.
export function caminhoDoPdf(codigo, slug) {
    const i = idioma(codigo);
    if (!i) throw new Error(`Idioma desconhecido: ${codigo}`);
    return `/modelos-pdf/${i.prefixo}/${slug}.pdf`;
}

// Nome com que o PDF é salvo no aparelho (atributo download): "Alvenaria estrutural - ObraFácil.pdf". Sem as
// letras que os sistemas não aceitam em nome de arquivo.
export function nomeDoArquivo(nome) {
    return `${String(nome).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()} - ObraFácil.pdf`;
}

// Endereço da página do modelo no idioma.
export function caminhoDoModelo(codigo, modelo) {
    return caminhoModelo(codigo, modelo.slug);
}

export { caminhoModelos };

// Problemas dos dados de um idioma (o teste e o build conferem): endereços repetidos ou fora da regra, modelo do
// diário com o mesmo endereço de um checklist, textos do app que faltam. Lista vazia = tudo certo.
export function problemasDoIdioma(dados, codigo, palavraValida) {
    const problemas = [];
    const lista = modelosDoIdioma(dados, codigo);
    const vistos = new Map();
    for (const m of lista) {
        if (!m.slug || (palavraValida && !palavraValida(m.slug))) problemas.push(`${codigo}: endereço inválido "${m.slug}" (${m.id})`);
        if (vistos.has(m.slug)) problemas.push(`${codigo}: ${m.id} e ${vistos.get(m.slug)} com o mesmo endereço "${m.slug}"`);
        vistos.set(m.slug, m.id);
    }
    if (lista.filter((m) => m.tipo === 'checklist').length !== 27) problemas.push(`${codigo}: não tem os 27 checklists do app`);
    for (const m of lista) if (m.tipo === 'checklist' && !m.itens?.length) problemas.push(`${codigo}: ${m.id} sem itens`);
    return problemas;
}
