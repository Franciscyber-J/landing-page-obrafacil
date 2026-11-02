// Idiomas em que os artigos da Central de Ajuda são publicados: os mesmos do publicador no gestao_obras
// (ajuda/listas/idiomas.json, os que têm "ativo": true), na mesma ordem. Desde a 2.0 são os 29 idiomas do site.
// Um idioma do site sem artigos próprios mostra os artigos do primeiro idioma da cadeia dele que tiver (ex.: um
// idioma futuro do site, antes dos artigos dele, mostra os artigos em inglês, com a tela no idioma dele).
//
// Artigo de ferramenta só do Brasil (CUB, PCI, cronograma automático) existe só no índice do pt-BR: os outros
// idiomas não o mostram nem o citam (o publicador já tira dos relacionados e pré-requisitos de cada idioma).

import { cadeia, REFERENCIA } from '../i18n/idiomas.js';

export const IDIOMAS_AJUDA = Object.freeze([
    'pt-BR', 'pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX',
    'fr-FR', 'de-DE', 'ar-SA', 'it-IT', 'tr-TR', 'pl-PL', 'id-ID', 'ja-JP', 'hi-IN', 'vi-VN', 'nl-NL', 'ko-KR',
    'zh-TW', 'ro-RO', 'th-TH', 'uk-UA', 'ru-KZ', 'cs-CZ', 'el-GR', 'hu-HU', 'he-IL',
]);

export function ehIdiomaDaAjuda(codigo) {
    return IDIOMAS_AJUDA.includes(codigo);
}

// Idioma dos artigos para um idioma do site.
export function idiomaDoConteudo(codigoSite) {
    return cadeia(codigoSite).find(ehIdiomaDaAjuda) ?? REFERENCIA;
}
