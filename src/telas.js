// Telas reais do app (prints da Central de Ajuda, com dados de exemplo), em public/telas/<idioma>/.
export const TELAS = ['obra', 'rdo', 'equipe', 'etapas', 'financeiro', 'portal', 'acesso'];

import { publico } from './publico.js';

export function enderecoDaTela(codigo, nome) {
    return publico(`telas/${codigo}/${nome}.webp`);
}
