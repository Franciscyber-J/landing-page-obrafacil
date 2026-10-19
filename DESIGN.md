---
name: ObraFácil — site
description: Obra de dia / Obra de noite. Luzes azul e laranja do logotipo, vidro, cantos arredondados, pílulas.
colors:
  fundo: "#f4f7fb"
  fundo-2: "#eaf0f7"
  superficie: "#ffffff"
  texto: "#0d2136"
  texto-2: "#4a5f75"
  azul: "#0f3a63"
  azul-vivo: "#1a5fb8"
  laranja: "#f28a1f"
  laranja-forte: "#e0700f"
  laranja-texto: "#a84f08"
  sobre-laranja: "#1a1206"
  painel: "#0f3a63"
  painel-texto-2: "#c7d8ea"
  fundo-escuro: "#08172a"
  superficie-escura: "#0f2238"
  texto-escuro: "#eef3f9"
  texto-2-escuro: "#a9bccf"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Manrope, system-ui, sans-serif"
    fontSize: "clamp(2.8rem, 6.4vw, 5rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  titulo-secao:
    fontFamily: "Bricolage Grotesque, Manrope, sans-serif"
    fontSize: "clamp(2.2rem, 4.6vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.06
  corpo:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  p: "12px"
  m: "20px"
  g: "28px"
  xg: "40px"
  pilula: "999px"
spacing:
  secao: "104px"
  secao-celular: "72px"
  margem: "24px"
  margem-celular: "16px"
components:
  acao:
    backgroundColor: "{colors.laranja}"
    textColor: "{colors.sobre-laranja}"
    rounded: "{rounded.pilula}"
    height: "50px"
    padding: "0 26px"
  acao-hover:
    backgroundColor: "{colors.laranja-forte}"
  painel:
    backgroundColor: "{colors.painel}"
    textColor: "#ffffff"
    rounded: "{rounded.xg}"
---

# ObraFácil — sistema visual do site

Fonte normativa dos valores: `src/styles/design-tokens.css`. Este arquivo explica como usar. Produto:
`PRODUCT.md`. Escolha do Francis em 19/10/2026: estilo A ("Noite de obra") como tema escuro, com o tema claro
("Obra de dia") na mesma forma. Substitui a direção "placa de obra" (cantos retos), que ele recusou.

## Overview

Página moderna e viva: luzes desfocadas azul e laranja (as cores do logotipo) se movendo devagar atrás do
conteúdo, cartões de vidro fosco, cantos arredondados, botões em pílula e as telas reais do app em celulares
flutuando. O escuro é o mundo principal; o claro tem a mesma forma com luzes mais suaves.

## Colors

- Fundo e superfícies trocam com o tema (`--fundo`, `--vidro`, `--texto`...); o painel azul (`--painel`) é o
  mesmo nos dois e leva os recursos, o plano PRO, o depoimento em destaque e a chamada final.
- Laranja é a ação principal (texto escuro `--sobre-laranja` em cima, 7,4:1) e o destaque de palavras nos
  títulos (`--destaque`, gradiente; no claro um laranja mais escuro para ter contraste; sobre o painel, o
  laranja claro, por `data-painel`).
- Texto laranja pequeno usa `--laranja-texto` (5,2:1 no claro, 10:1 no escuro).

## Typography

- Bricolage Grotesque (600 a 800) nos títulos, com letra apertada (-0,02 a -0,035 em) e entrelinha 1,02 a 1,1;
  Manrope (400 a 800) no texto, botões e rótulos. As duas servidas pelo próprio site (@fontsource).
- Palavra em destaque nos títulos por `**...**` na tradução (`src/texto.jsx`).

## Layout

- Largura 1200 px, margem 24 px (16 no celular); seções com 104 px de respiro (72 no celular).
- Barra do topo em cápsula de vidro que flutua sobre a página; a primeira dobra sobe por baixo dela.
- Ordem da página inicial: abertura com os celulares → fitas de obra → o cliente acompanha → recursos (painel
  azul, celular parado na tela larga) → papéis → depoimentos → preços → perguntas → chamada → rodapé.
- 360 e 390 px sem rolagem lateral.

## Elevation & Depth

- Profundidade por vidro (desfoque do que está atrás), luzes e sombras longas e suaves (`--sombra`,
  `--sombra-forte`); o botão laranja tem uma sombra laranja.

## Shapes

- Cantos: 12 px (itens pequenos), 20 px (cartões), 28 px (cartões grandes), 40 px (painéis), pílula (botões,
  abas, selos). Celulares com 38 px e moldura de 6 px.

## Components

- Ações: `.acao` (laranja), `.acao-contorno` (vidro), `.acao-clara` (vidro sobre o painel). Altura 50 px.
- Abertura (`Placa.jsx`): selo de plataformas, título com destaque, abas em cápsula que trocam a tela do
  celular do meio, ações, lojas; três celulares em leque com a planta baixa desenhando atrás.
- Cartões de vidro nas listas (pontos do cliente, papéis, depoimentos, perguntas, plano grátis).
- Central de Ajuda e Termos/Política no mesmo mundo (luzes no topo da Central, cabeça em painel nos Termos).

## Motion

- GSAP 3.15 (com ScrollTrigger, SplitText e DrawSVG), empacotado com o site; tudo em `src/movimento/`.
- Uma regra só: `COM_MOVIMENTO` (`prefers-reduced-motion: no-preference`). Com "menos movimento", o
  site fica parado e completo. Nada começa escondido no CSS: a animação parte do estado escondido só
  quando roda.
- Saída exponencial (`expo.out`), 0,6 a 1,4 s; trocas de tela por máscara vertical (280 a 320 ms).
- Momentos: a placa monta ao abrir; fitas de obra cruzadas; mensagens do cliente chegando; celular
  parado com a tela trocando nos recursos (tela larga); títulos que sobem linha por linha (máscara
  com folga para o acento); inclinação 3D e botões magnéticos só com mouse; linha de leitura na barra.
- Luzes do fundo (`.luzes`) vagam devagar (16 a 20 s) e param com "menos movimento".
- O que não fazer: animação que esconde texto para sempre, efeito que dispara sozinho em loop sem
  parar quando a pessoa interage (as abas da placa param ao primeiro toque), parallax em texto.

## Do's and Don'ts

- Faça: tela real do app no idioma da página; vidro para agrupar; laranja só para ação e destaque.
- Faça: todo texto por chave de tradução; endereços pelas funções de `src/i18n/idiomas.js`.
- Não faça: cantos retos, fios grossos, caixa alta em títulos, roxo, foto de banco de imagens, mais de um
  destaque laranja no mesmo título.
- Não faça: número, garantia ou prazo que não esteja em `PRODUCT.md`, nos artigos da Central ou não tenha
  sido confirmado pelo Francis. Planos e Acesso Cliente seguem os artigos `gratis-x-pro`, `acesso-cliente` e
  `com-e-sem-acesso-cliente`.

## Origem das imagens

| Imagem | Origem |
| --- | --- |
| `public/telas/<idioma>/*.webp` | Prints do app gerados para a Central de Ajuda (pasta `prints_5b_visual3` do Francis), com dados de demonstração ("Construtora Horizonte", "Residencial Jardim das Acácias"); reduzidos para 720 px de largura |
| `public/logo_transparente.png` | Logotipo do ObraFácil (já existia no site) |
| `public/bandeiras/*.svg` | Pacote `flag-icons`, copiadas no build |
