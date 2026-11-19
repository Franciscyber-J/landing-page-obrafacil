// Telas reais do app (prints da Central de Ajuda, com dados de exemplo), em public/telas/<idioma>/.
export const TELAS = ['obra', 'rdo', 'equipe', 'etapas', 'financeiro', 'portal', 'acesso'];

// Idiomas que já têm as telas em public/telas/<idioma>/ (as 7 de TELAS). Idioma novo entra aqui quando os prints
// dele forem copiados (docs/CHECKLIST_IDIOMAS_NOVOS.md do gestao_obras, B6); até lá, mostra as telas do primeiro
// idioma da cadeia dele que tiver (a base, o inglês dos EUA e, por fim, o português do Brasil). O teste
// (telas.test.js) confere esta lista com as pastas.
export const IDIOMAS_COM_TELAS = ['pt-BR', 'pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX'];

// Telas que ainda não chegaram a todos os idiomas. Para cada uma: os idiomas que já têm o print em
// public/telas/<idioma>/<nome>.webp (720 px de largura, como as outras) e a tela de TELAS que aparece no lugar, com o
// texto alternativo dela, nos idiomas que ainda não têm. Nunca o print de outro idioma: a tela é sempre a do idioma
// da página. Quando o print de um idioma for copiado, basta pôr o idioma na lista (o teste confere o arquivo); quando
// todos os de IDIOMAS_COM_TELAS tiverem, a tela passa para TELAS e sai daqui.
export const TELAS_NOVAS = {
    // Checklists de qualidade (app 2.0.1): o print do passo 1 do artigo preencher-checklist (checklist em
    // preenchimento, com o andamento e os itens), da fila de prints do gestao_obras.
    checklist: { idiomas: [], noLugar: { tela: 'obra', alt: 'recursos.tela' } },
};

import { publico } from './publico.js';
import { cadeia } from './i18n/idiomas.js';

export function idiomaDasTelas(codigo) {
    return cadeia(codigo).find((c) => IDIOMAS_COM_TELAS.includes(c)) ?? 'pt-BR';
}

// A tela que a página mostra no idioma, com o texto alternativo: a pedida ou, se for uma tela nova que o idioma das
// telas ainda não tem, a que fica no lugar. Só depende do idioma (igual no build e no navegador).
export function telaDoIdioma(codigo, tela, alt) {
    const nova = TELAS_NOVAS[tela];
    if (!nova || nova.idiomas.includes(idiomaDasTelas(codigo))) return { tela, alt };
    return { ...nova.noLugar };
}

export function enderecoDaTela(codigo, nome) {
    return publico(`telas/${idiomaDasTelas(codigo)}/${nome}.webp`);
}
