// Idiomas do site da ExpertBR: os mesmos 29 do site do ObraFácil, do mesmo cadastro (src/i18n/registro.js), com
// as mesmas regras (cadeia de textos, escolha pelo navegador, endereço /pt-br/). Idioma novo no cadastro entra aqui
// sozinho; falta só escrever os textos dele em src/textos (o "npm run expertbr:idiomas" avisa).
// Sem React e sem navegador: o build, o gerador do .htaccess e os testes usam no Node.

import {
    IDIOMAS, INTERNACIONAL, REFERENCIA, cadeia, caminhoInicio, escolherIdioma, idioma, palavraDeEnderecoValida,
} from '../../../src/i18n/idiomas.js';
import { escritasDoCadastro } from '../../../src/fontes/escritas.js';

export { IDIOMAS, INTERNACIONAL, REFERENCIA, cadeia, caminhoInicio, escolherIdioma, idioma, palavraDeEnderecoValida };

// Endereço do site no ar. Canonical, hreflang, sitemap e dados estruturados usam sempre o endereço absoluto.
export const SITE = 'https://expertbr.com';
export const NOME = 'ExpertBR';

export function absoluto(caminho) {
    return new URL(caminho, SITE).href;
}

// Escrita de cada idioma que não é latina ({ 'ja-JP': 'japonesa' }), a mesma do site do ObraFácil.
export const ESCRITAS = escritasDoCadastro(IDIOMAS);

// Seções da página (âncoras, com a palavra de cada idioma em src/textos: "ancoras.<secao>").
export const SECOES = ['produtos', 'sobre', 'contato'];
