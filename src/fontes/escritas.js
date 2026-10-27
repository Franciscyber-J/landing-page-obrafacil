// Fontes das escritas que a Manrope e a Bricolage Grotesque não cobrem (docs/CHECKLIST_IDIOMAS_NOVOS.md do
// gestao_obras, item A4 do site). A Manrope cobre latim, cirílico, grego e vietnamita; japonês, coreano, chinês
// tradicional, árabe, hebraico, devanágari (hindi) e tailandês usam a Noto Sans da escrita (pacotes
// @fontsource-variable do npm, servidos pelo próprio site: nada de terceiros quando a página abre).
//
// A fonte entra só no idioma que precisa: o build gera o módulo "virtual:fontes-das-escritas" (vite.config.js)
// só com as escritas que algum idioma do cadastro usa, e cada escrita é um CSS separado (src/fontes/<escrita>.css),
// baixado quando a página está num idioma dela. O CSS de cada pacote divide a fonte em pedaços por unicode-range e o
// navegador baixa só os pedaços das letras que aparecem. Com os 8 idiomas de hoje (todos latinos) o módulo sai
// vazio e o navegador não baixa nada a mais.
//
// A escrita vem do campo "escrita" do cadastro (src/i18n/registro.js), que a variante regional herda da base. Sem o
// campo: latina. Valor que não está aqui: o build para com a mensagem (cadastro inválido).
//
// Sem React e sem navegador: o teste (escritas.test.js) roda no Node.

/** Escritas com fonte própria: o CSS em src/fontes/<escrita>.css e o pacote dele. */
export const ESCRITAS = {
    japonesa: { pacote: '@fontsource-variable/noto-sans-jp', familia: 'Noto Sans JP Variable' },
    coreana: { pacote: '@fontsource-variable/noto-sans-kr', familia: 'Noto Sans KR Variable' },
    chinesaTradicional: { pacote: '@fontsource-variable/noto-sans-tc', familia: 'Noto Sans TC Variable' },
    arabe: { pacote: '@fontsource-variable/noto-sans-arabic', familia: 'Noto Sans Arabic Variable' },
    hebraica: { pacote: '@fontsource-variable/noto-sans-hebrew', familia: 'Noto Sans Hebrew Variable' },
    devanagari: { pacote: '@fontsource-variable/noto-sans-devanagari', familia: 'Noto Sans Devanagari Variable' },
    tailandesa: { pacote: '@fontsource-variable/noto-sans-thai', familia: 'Noto Sans Thai Variable' },
};

export const LATINA = 'latina';

/**
 * Escrita de cada idioma do cadastro ({ 'ja-JP': 'japonesa' }), só as que têm fonte própria. Lê o campo
 * "escrita" (a variante herda da base); ausente = latina. Valor desconhecido: erro com o idioma e o valor.
 */
export function escritasDoCadastro(idiomas) {
    const porCodigo = new Map(idiomas.map((i) => [i.codigo, i]));
    const mapa = {};
    for (const idioma of idiomas) {
        const base = idioma.base ? porCodigo.get(idioma.base) : null;
        const escrita = idioma.escrita ?? base?.escrita ?? LATINA;
        if (escrita === LATINA) continue;
        if (!Object.hasOwn(ESCRITAS, escrita)) {
            throw new Error(
                `Cadastro de idiomas: ${idioma.codigo} tem escrita "${escrita}", que não existe. ` +
                    `Use uma de: ${[LATINA, ...Object.keys(ESCRITAS)].join(', ')} (src/fontes/escritas.js).`,
            );
        }
        mapa[idioma.codigo] = escrita;
    }
    return mapa;
}

/**
 * Código do módulo "virtual:fontes-das-escritas" para o build. Exporta usarEscritaDoIdioma(codigo): marca a
 * escrita na página (<html data-escrita="...">, que os CSS de src/fontes usam para trocar as variáveis --fonte-*)
 * e baixa o CSS da escrita. Sem idioma de outra escrita no cadastro, a função é vazia (o build a tira do pacote).
 * [pasta]: caminho dos CSS para o import (no build, '/src/fontes').
 */
export function moduloDasFontes(idiomas, pasta = '/src/fontes') {
    const mapa = escritasDoCadastro(idiomas);
    const usadas = [...new Set(Object.values(mapa))].sort();
    if (usadas.length === 0) return 'export function usarEscritaDoIdioma() {}\n';
    const carregar = usadas.map((e) => `    ${JSON.stringify(e)}: () => import(${JSON.stringify(`${pasta}/${e}.css`)}),`);
    return [
        `const ESCRITA = ${JSON.stringify(mapa)};`,
        'const CARREGAR = {',
        ...carregar,
        '};',
        'export function usarEscritaDoIdioma(codigo) {',
        `    const escrita = ESCRITA[codigo] ?? ${JSON.stringify(LATINA)};`,
        '    document.documentElement.dataset.escrita = escrita;',
        '    CARREGAR[escrita]?.().catch(() => {});',
        '}',
        '',
    ].join('\n');
}
