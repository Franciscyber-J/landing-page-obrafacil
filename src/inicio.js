// O que a página inicial lista, e em que ordem: os recursos (cada um com a tela real do app que o mostra) e as
// perguntas frequentes. A página (Recursos.jsx, Perguntas.jsx), os dados estruturados (src/seo/dadosEstruturados.js)
// e o llms.txt (src/seo/llms.js) leem daqui, para as três listas nunca ficarem diferentes.
// Sem React e sem navegador: o build e os testes usam (src/inicio.test.js confere com os textos e as telas).

// id: textos em recursos.itens.<id> (titulo e texto). tela: nome da tela em public/telas/<idioma>/ (src/telas.js);
// alt: texto alternativo dela. Tela que ainda não chegou a todos os idiomas fica em TELAS_NOVAS (src/telas.js), com a
// tela que aparece no lugar.
export const RECURSOS = [
    { id: 'cronograma', tela: 'etapas', alt: 'hero.telas.cronograma' },
    { id: 'diario', tela: 'rdo', alt: 'hero.telas.diario' },
    { id: 'checklists', tela: 'checklist', alt: 'recursos.itens.checklists.tela' },
    { id: 'financeiro', tela: 'financeiro', alt: 'hero.telas.financeiro' },
    { id: 'equipe', tela: 'equipe', alt: 'equipe.tela' },
    { id: 'compras', tela: 'obra', alt: 'recursos.tela' },
    { id: 'marca', tela: 'obra', alt: 'recursos.tela' },
    { id: 'offline', tela: 'obra', alt: 'recursos.tela' },
    { id: 'aparelhos', tela: 'obra', alt: 'recursos.tela' },
];

// Perguntas frequentes (faq.q<n> e faq.a<n>), na ordem em que aparecem. O número é o da chave, não a posição: a
// pergunta dos Checklists (11, app 2.0.1) fica junto das que falam do que o app faz.
export const PERGUNTAS = [1, 2, 3, 4, 5, 11, 6, 7, 8, 9, 10];
