// Idiomas da Central de Ajuda e a ligação com os idiomas do site (i18n).
// A Central usa os códigos completos (pt-BR, en-US...), que são os mesmos do conteúdo
// publicado; o site usa os códigos curtos que já existiam (pt, en, es) para os idiomas padrão.

export const IDIOMAS_AJUDA = ['pt-BR', 'pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX'];

export const IDIOMA_PADRAO = 'pt-BR';

const AJUDA_PARA_SITE = {
    'pt-BR': 'pt',
    'pt-PT': 'pt-PT',
    'en-US': 'en',
    'en-GB': 'en-GB',
    'en-AU': 'en-AU',
    'en-CA': 'en-CA',
    'es-ES': 'es',
    'es-MX': 'es-MX',
};

const SITE_PARA_AJUDA = {
    pt: 'pt-BR',
    'pt-BR': 'pt-BR',
    'pt-PT': 'pt-PT',
    en: 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'en-AU': 'en-AU',
    'en-CA': 'en-CA',
    es: 'es-ES',
    'es-ES': 'es-ES',
    'es-MX': 'es-MX',
};

export const NOMES_IDIOMAS = {
    'pt-BR': 'Português (Brasil)',
    'pt-PT': 'Português (Portugal)',
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'en-AU': 'English (Australia)',
    'en-CA': 'English (Canada)',
    'es-ES': 'Español (España)',
    'es-MX': 'Español (México)',
};

export function ehIdiomaDaAjuda(codigo) {
    return IDIOMAS_AJUDA.includes(codigo);
}

// Código do i18n do site para um idioma da Central.
export function idiomaDoSite(idiomaAjuda) {
    return AJUDA_PARA_SITE[idiomaAjuda] ?? 'pt';
}

// Idioma da Central para o idioma atual do site. Aceita também variantes que o navegador
// manda (pt-BR, en-US) e cai no português do Brasil quando não reconhece.
export function idiomaDaAjuda(idiomaSite) {
    if (!idiomaSite) return IDIOMA_PADRAO;
    if (SITE_PARA_AJUDA[idiomaSite]) return SITE_PARA_AJUDA[idiomaSite];
    const base = idiomaSite.split('-')[0];
    return SITE_PARA_AJUDA[base] ?? IDIOMA_PADRAO;
}
