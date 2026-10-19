// Telas reais do app (prints da Central de Ajuda, com dados de exemplo), em public/telas/<idioma>/.
export const TELAS = ['obra', 'rdo', 'equipe', 'etapas', 'financeiro', 'portal', 'acesso'];

export function enderecoDaTela(codigo, nome) {
    return `/telas/${codigo}/${nome}.webp`;
}
