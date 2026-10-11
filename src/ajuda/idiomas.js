// Idiomas em que os artigos da Central de Ajuda são publicados (os mesmos do publicador no
// gestao_obras). Um idioma do site sem artigos próprios mostra os artigos do primeiro idioma
// da cadeia dele que tiver (ex.: um francês futuro mostra os artigos em inglês, com a tela em francês).

import { cadeia, REFERENCIA } from '../i18n/idiomas.js';

export const IDIOMAS_AJUDA = ['pt-BR', 'pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX'];

export function ehIdiomaDaAjuda(codigo) {
    return IDIOMAS_AJUDA.includes(codigo);
}

// Idioma dos artigos para um idioma do site.
export function idiomaDoConteudo(codigoSite) {
    return cadeia(codigoSite).find(ehIdiomaDaAjuda) ?? REFERENCIA;
}
