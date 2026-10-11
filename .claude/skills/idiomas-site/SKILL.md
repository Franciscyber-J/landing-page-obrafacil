---
name: idiomas-site
description: Textos, idiomas e endereços no idioma do site do ObraFácil (cadastro em src/i18n/registro.js, npm run idiomas, novo/exportar/importar). Use ao criar ou mudar texto do site ou ao incluir um idioma.
---

# Idiomas do site

Referência completa: `src/i18n/LEIAME.md`. Resumo do que fazer em cada caso.

## Texto novo ou alterado

1. Chave nova primeiro em `src/i18n/textos/pt-BR.json` (referência), depois nos idiomas-base (`en-US`, `es-ES`).
   Plural: `_one`, `_many` e `_other` onde a língua usa (o `npm run idiomas` diz quais faltam).
2. Variante regional (pt-PT, en-GB, en-AU, en-CA, es-MX) só recebe a chave se o texto for diferente da base.
3. `{{placeholders}}` iguais em todos os idiomas.
4. `npm run idiomas` sem erros. Ver `src/i18n/textos/PENDENCIAS.md` (o que falta, o que repete a base, o que não é usado).

## Idioma novo

1. Entrada em `src/i18n/registro.js`: código `xx-YY`, nome no próprio idioma, `curto`, `pais` (bandeira), `moeda`
   (tem de existir em `pricing.js`), `direcao` (`rtl` para árabe e hebraico), `regioes` e as palavras dos endereços
   (`ajuda`, `assunto` e as seções da página inicial). Variante regional leva `base`.
2. `npm run idiomas -- novo xx-YY` → pacote em `ferramentas/idiomas/a-traduzir/xx-YY.json`.
3. Traduzir o pacote nativo (sem trocar palavra por palavra de outro idioma), mantendo chaves e `{{...}}`.
4. `npm run idiomas -- importar xx-YY` (recusa o pacote se algum `{{...}}` vier diferente) e `npm run idiomas`.
5. Conferir no navegador: `/xx-yy/`, troca de idioma pelo menu, preço na moeda certa, `hreflang` com o idioma novo.
6. Os artigos da Central só existem nos idiomas publicados pelo gestao_obras; um idioma novo do site mostra os
   artigos do primeiro idioma da cadeia dele que tiver.

## Endereços

- Montar sempre com `caminhoInicio`, `caminhoAjuda`, `caminhoAssunto`, `caminhoArtigo` (`src/i18n/idiomas.js`)
  ou `criarRotas` (`src/ajuda/enderecos.js`).
- O código do idioma tem sempre 2 letras + região de 2 letras: é o formato que o `.htaccess` entrega ao site.
- Mudar uma palavra de endereço já publicada quebra links salvos: os endereços antigos continuam funcionando só
  se a palavra antiga for de algum idioma cadastrado (o site aceita a palavra de qualquer idioma e corrige).
