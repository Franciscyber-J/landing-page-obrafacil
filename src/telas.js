// Telas reais do app (prints da Central de Ajuda, com dados de exemplo), em public/telas/<idioma>/.
export const TELAS = ['obra', 'rdo', 'equipe', 'etapas', 'financeiro', 'portal', 'acesso'];

// Idiomas que já têm as telas em public/telas/<idioma>/ (as 7 de TELAS). Idioma novo entra aqui quando os prints
// dele forem copiados (docs/CHECKLIST_IDIOMAS_NOVOS.md do gestao_obras, B6); até lá, mostra as telas do primeiro
// idioma da cadeia dele que tiver (a base, o inglês dos EUA e, por fim, o português do Brasil). O teste
// (telas.test.js) confere esta lista com as pastas.
export const IDIOMAS_COM_TELAS = ['pt-BR', 'pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX'];

import { publico } from './publico.js';
import { cadeia } from './i18n/idiomas.js';

export function idiomaDasTelas(codigo) {
    return cadeia(codigo).find((c) => IDIOMAS_COM_TELAS.includes(c)) ?? 'pt-BR';
}

export function enderecoDaTela(codigo, nome) {
    return publico(`telas/${idiomaDasTelas(codigo)}/${nome}.webp`);
}
