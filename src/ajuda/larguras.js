// Prints da Central por largura da tela (desde a 2.0.2; o formato é do publicador, gestao_obras
// ferramentas/ajuda/src/larguras.mjs). Cada passo com print tem o de celular e pode ter, em "larguras", o da largura
// média e o de computador, cada um com a marcação medida nele. A escolha é pela largura da tela, nunca pelo aparelho,
// com os mesmos limites do app (gestao_obras lib/utils/faixas_de_largura.dart):
//   celular    abaixo de 600 px;
//   media      de 600 a 1023 px (iPhone Duo aberto, tablet em pé, dobráveis);
//   computador a partir de 1024 px.
// Sem a versão da largura, aparece o print de celular. No site a escolha é do CSS (media queries em Ajuda.module.css,
// .printNaFaixa): a página pronta e a hidratação desenham a mesma coisa em qualquer tela, sem depender do navegador.
// Sem React e sem navegador: os testes rodam no Node.

export const FAIXAS = Object.freeze(['celular', 'media', 'computador']);
export const FAIXAS_MAIORES = Object.freeze(['media', 'computador']);

// Onde cada faixa começa, em px (iguais às do app).
export const INICIO_DA_FAIXA = Object.freeze({ media: 600, computador: 1024 });

// O aparelho desenhado em volta do print de cada faixa: o celular, o dobrável (a tela de dentro do iPhone Duo, ou um
// tablet em pé) e o notebook.
export const APARELHO_DA_FAIXA = Object.freeze({ celular: 'celular', media: 'dobravel', computador: 'computador' });

// Proporção (largura / altura) dos prints de cada faixa, para o espaço ficar reservado antes de a imagem chegar: o
// celular do roteiro (1080 x 2400), o iPhone Duo aberto (669 x 951 pontos) e a janela de computador (1280 x 800).
export const PROPORCAO_DA_FAIXA = Object.freeze({ celular: 1080 / 2400, media: 669 / 951, computador: 1280 / 800 });
