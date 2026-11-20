// Telas reais do app (prints da Central de Ajuda, com dados de exemplo), em public/telas/<idioma>/<nome>.webp.
// Visual 2.0 do app (20/11/2026): prints da rodada "prints-dados-engenheiros" (construtora de demonstração de cada
// idioma), sem a barra de status do celular (o print da Central já vem cortado no alto), reduzidos para 720 x 1515 px.
// De onde vem cada tela (artigo da Central e passo):
//   obra       painel-de-prazo, passo 1 (capa da obra com o Cronograma aberto)
//   rdo        criar-rdo, passo 3 (clima, atividades e observações)
//   equipe     criar-rdo, passo 4 (presença da equipe no diário)
//   etapas     controlar-custos, passo 1 (etapas com orçado, medido, a pagar e avanço)
//   financeiro controlar-custos, passo 5 (saldo, entradas, saídas, custo por m²)
//   portal     cliente-no-portal, passo 3 (novidades da obra no Portal do Cliente)
//   acesso     permissoes-do-cliente, passo 2 (Acesso Liberado: o que o cliente vê)
//   checklist  preencher-checklist, passo 1 (checklist em preenchimento)
// Tamanho da imagem: as molduras de celular do site usam a mesma proporção (aspect-ratio 720 / 1515 em
// src/index.css e src/components/Placa.module.css; width e height das <img>). O teste (telas.test.js) confere.
export const TELAS = ['obra', 'rdo', 'equipe', 'etapas', 'financeiro', 'portal', 'acesso', 'checklist'];
export const LARGURA_DA_TELA = 720;
export const ALTURA_DA_TELA = 1515;

// Idiomas que já têm as telas em public/telas/<idioma>/ (todas as de TELAS). Idioma novo entra aqui quando os prints
// dele forem copiados (docs/CHECKLIST_IDIOMAS_NOVOS.md do gestao_obras, B6); até lá, mostra as telas do primeiro
// idioma da cadeia dele que tiver (a base, o inglês dos EUA e, por fim, o português do Brasil). O teste
// (telas.test.js) confere esta lista com as pastas.
export const IDIOMAS_COM_TELAS = [
    'pt-BR', 'pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX',
    'fr-FR', 'it-IT', 'de-DE', 'nl-NL', 'pl-PL', 'ro-RO', 'cs-CZ', 'hu-HU', 'el-GR', 'tr-TR', 'ru-KZ', 'uk-UA',
    'ar-SA', 'he-IL', 'hi-IN', 'th-TH', 'id-ID', 'vi-VN', 'ja-JP', 'ko-KR', 'zh-TW',
];

// Telas que ainda não chegaram a todos os idiomas. Para cada uma: os idiomas que já têm o print em
// public/telas/<idioma>/<nome>.webp (mesmo tamanho das outras) e a tela de TELAS que aparece no lugar, com o texto
// alternativo dela, nos idiomas que ainda não têm. Nunca o print de outro idioma: a tela é sempre a do idioma da
// página. Quando o print de um idioma for copiado, basta pôr o idioma na lista (o teste confere o arquivo); quando
// todos os de IDIOMAS_COM_TELAS tiverem, a tela passa para TELAS e sai daqui. Hoje nenhuma: a `checklist` (app
// 2.0.1) passou para TELAS em 20/11/2026, com os 29 idiomas.
// Exemplo: novaTela: { idiomas: ['pt-BR'], noLugar: { tela: 'obra', alt: 'recursos.tela' } }
export const TELAS_NOVAS = {};

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
