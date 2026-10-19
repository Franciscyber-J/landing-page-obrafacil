---
name: ObraFácil — site
description: Placa de obra. Campo azul, letra alta e estreita, faixa laranja, campos com rótulo e valor.
colors:
  placa: "#0f3a63"
  placa-funda: "#0a2b4a"
  placa-texto: "#ffffff"
  placa-texto-2: "#c7d8ea"
  laranja: "#f28a1f"
  laranja-forte: "#d9720a"
  sobre-laranja: "#13212f"
  chao: "#f2f5f8"
  superficie: "#ffffff"
  tinta: "#10243a"
  tinta-2: "#3f5468"
  linha: "#c5d1dd"
  chao-escuro: "#07111c"
  superficie-escura: "#0e1c2b"
  tinta-escura: "#e8eef5"
  tinta-2-escura: "#a8b8c9"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3.1rem, 7.4vw, 6.4rem)"
    fontWeight: 700
    lineHeight: 0.86
    letterSpacing: "-0.005em"
  titulo-secao:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.4rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 0.92
  rotulo:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  corpo:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  raio: "2px"
  aparelho: "26px"
spacing:
  borda: "2px"
  borda-placa: "3px"
  secao: "96px"
  secao-celular: "64px"
  margem: "24px"
  margem-celular: "16px"
components:
  acao:
    backgroundColor: "{colors.laranja}"
    textColor: "{colors.sobre-laranja}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.raio}"
    height: "48px"
    padding: "0 22px"
  acao-hover:
    backgroundColor: "{colors.laranja-forte}"
  acao-contorno:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.raio}"
    height: "48px"
  acao-clara:
    backgroundColor: "transparent"
    textColor: "{colors.placa-texto}"
    rounded: "{rounded.raio}"
    height: "48px"
  placa:
    backgroundColor: "{colors.placa}"
    textColor: "{colors.placa-texto}"
    rounded: "0"
  faixa:
    backgroundColor: "{colors.laranja}"
    textColor: "{colors.sobre-laranja}"
    typography: "{typography.rotulo}"
---

# ObraFácil — sistema visual do site

Fonte normativa dos valores: `src/styles/design-tokens.css`. Este arquivo explica como usar. Direção e
contrato: `docs/design/BRIEF_SITE.md`. Verdade do produto: `PRODUCT.md`.

## Overview

O site é a placa de obra: o quadro azul que toda obra tem na frente, com os campos da obra em letra alta e
legível. Azul e laranja são os do logotipo. Nada de fundo escuro com brilho, vidro, gradiente ou fileira de
cartões iguais. A página inicial persuade (modo Persuadir); a Central de Ajuda, os Termos e a Política são
para ler (modo Ler) e usam o mesmo mundo com menos volume.

## Colors

- `placa` (igual nos dois temas, para o laranja pequeno sobre ela ficar em 4,67:1) cobre as grandes áreas: barra do topo, primeira dobra, seção de recursos, depoimento em destaque,
  plano PRO, cabeça dos Termos e da Central, rodapé (`placa-funda`).
- `laranja` é a faixa no alto das placas e a ação principal. Texto sobre laranja é sempre `sobre-laranja`
  (7,4:1), nunca branco.
- O chão é frio e claro (`chao`, `superficie`); no tema escuro vira azul-noite. A placa continua azul nos
  dois temas.
- Texto secundário: `tinta-2` (7:1) e, sobre a placa, `placa-texto-2` (8:1).
- Os nomes antigos (`--bg-primary`, `--color-accent`...) só existem como apelidos para a Central; código
  novo usa os nomes do mundo.

## Typography

- Barlow Condensed (600 e 700, servida pelo próprio site via @fontsource) em caixa alta para títulos,
  rótulos, botões, faixas e números. Barlow (400 a 700) para o texto corrido.
- Título da primeira dobra até 6,4 rem, entrelinha 0,86; títulos de seção até 4 rem.
- Rótulos de placa com espaçamento de 0,06 a 0,14 em. Nunca espaçamento negativo na letra estreita.
- Números (preço, passo, ordem) em Barlow Condensed 700.

## Layout

- Largura máxima 1240 px, margem 24 px (16 px no celular). Seções com 96 px de respiro (64 px no celular).
- Abertura de seção: faixa laranja de 64 × 8 px acima do título (`.secao-cabeca`).
- Campos da placa: rótulo estreito à esquerda, valor à direita, separados por fio de 2 px; no celular o
  valor desce para baixo do rótulo.
- Ordem da página inicial (venda): placa com a tela real → o cliente acompanha (antes/agora) → recursos →
  papéis → depoimentos → preços → perguntas → chamada laranja → rodapé.
- Tudo funciona em 360 e 390 px sem rolagem lateral; a barra do topo mostra "Começar grátis" no celular
  (abaixo de 370 px o logotipo encolhe para caber).
- Foco: contorno de 3 px em `--foco` (azul da placa no chão claro, laranja sobre a placa e no tema escuro).
- Títulos em letra de placa com entrelinha 1: menos que isso, o acento (Ó, Á) bate na linha de cima.

## Elevation & Depth

- Profundidade vem de chapa sobre chapa, não de sombra: moldura branca de 3 px por dentro da placa
  (`outline` com recuo de 9 px), painel `placa-funda` dentro da placa.
- Sombra só em coisa que flutua: aviso de cookies, botão do WhatsApp, segunda tela sobreposta, painel da
  busca.

## Shapes

- Cantos retos (`--raio`: 2 px) em tudo. A única curva é a moldura do aparelho (26 px), porque é a forma
  do celular.
- Fios: 2 px (`--borda`) para separar; 3 px (`--borda-placa`) para emoldurar.

## Components

- Ações: `.acao` (laranja, principal), `.acao-contorno` (fio escuro, no chão), `.acao-clara` (fio branco,
  sobre a placa). Altura mínima 48 px; pressão desce 1 px.
- Placa (`src/components/Placa.jsx`): os campos são abas (setas, Home, End); passar o mouse ou tocar troca
  a tela do app no painel, com a chapa nova descendo sobre a anterior (máscara vertical, 280 ms). Sem
  animação com "menos movimento".
- Telas do app: `public/telas/<idioma>/*.webp`, sempre com a legenda "tela do app, com dados de exemplo".
- Preços (`inicio/Precos.jsx`): o anual abre primeiro; economia e equivalência mensal calculadas de
  `src/i18n/pricing.js`; nenhum preço "de" inventado.
- Oferta de saída (`ExitIntentPopup.jsx`): uma vez por visita, só na página inicial, depois da escolha de
  cookies; diálogo com foco no fechar e Esc.
- Aviso de cookies: recusar e aceitar com o mesmo peso visual.
- Central de Ajuda: cabeça em placa azul com faixa laranja embaixo; cartões com fio de 2 px; número do passo
  em chapa azul quadrada.
- Termos e Política: cabeça em placa pequena; texto em coluna de 72 caracteres; sumário com fio laranja no
  passar do mouse.

## Motion

- GSAP 3.15 (com ScrollTrigger, SplitText e DrawSVG), empacotado com o site; tudo em `src/movimento/`.
- Uma regra só: `COM_MOVIMENTO` (`prefers-reduced-motion: no-preference`). Com "menos movimento", o
  site fica parado e completo. Nada começa escondido no CSS: a animação parte do estado escondido só
  quando roda.
- Saída exponencial (`expo.out`), 0,6 a 1,4 s; trocas de tela por máscara vertical (280 a 320 ms).
- Momentos: a placa monta ao abrir; fitas de obra cruzadas; mensagens do cliente chegando; celular
  parado com a tela trocando nos recursos (tela larga); títulos que sobem linha por linha (máscara
  com folga para o acento); inclinação 3D e botões magnéticos só com mouse; linha de leitura na barra.
- O que não fazer: animação que esconde texto para sempre, efeito que dispara sozinho em loop sem
  parar quando a pessoa interage (as abas da placa param ao primeiro toque), parallax em texto.

## Do's and Don'ts

- Faça: tela real do app no idioma da página; rótulo + valor em fio; laranja só para ação e faixa.
- Faça: todo texto por chave de tradução; endereços pelas funções de `src/i18n/idiomas.js`.
- Não faça: gradiente, brilho, vidro, cantos arredondados grandes, cartões iguais em fila, ícone dentro de
  círculo colorido, foto de banco de imagens.
- Não faça: número, garantia ou prazo que não esteja em `PRODUCT.md`, nos artigos da Central ou não tenha
  sido confirmado pelo Francis. Planos e Acesso Cliente seguem os artigos `gratis-x-pro`, `acesso-cliente` e
  `com-e-sem-acesso-cliente`.

## Origem das imagens

| Imagem | Origem |
| --- | --- |
| `public/telas/<idioma>/*.webp` | Prints do app gerados para a Central de Ajuda (pasta `prints_5b_visual3` do Francis), com dados de demonstração ("Construtora Horizonte", "Residencial Jardim das Acácias"); reduzidos para 720 px de largura |
| `public/logo_transparente.png` | Logotipo do ObraFácil (já existia no site) |
| `public/bandeiras/*.svg` | Pacote `flag-icons`, copiadas no build |
