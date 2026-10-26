# Pendências dos idiomas do site

Gerado por `npm run idiomas`. Não edite: é refeito a cada execução.

Para traduzir o que falta: `npm run idiomas -- exportar <idioma>`, traduza o arquivo em
`ferramentas/idiomas/a-traduzir/` e rode `npm run idiomas -- importar <idioma>`.
Enquanto um texto faltar, o site mostra o do próximo idioma da cadeia.

## pt-BR — Português (Brasil) (referência) — 0 a traduzir

Cadeia: pt-BR → en-US

## pt-PT — Português (Portugal) (variante de pt-BR) — 0 a traduzir

Cadeia: pt-PT → pt-BR → en-US

## en-US — English (US) (base) — 0 a traduzir

Cadeia: en-US → pt-BR

## en-GB — English (UK) (variante de en-US) — 0 a traduzir

Cadeia: en-GB → en-US → pt-BR

## en-AU — English (Australia) (variante de en-US) — 0 a traduzir

Cadeia: en-AU → en-US → pt-BR

## en-CA — English (Canada) (variante de en-US) — 0 a traduzir

Cadeia: en-CA → en-US → pt-BR

## es-ES — Español (España) (base) — 0 a traduzir

Cadeia: es-ES → en-US → pt-BR

## es-MX — Español (México/LATAM) (variante de es-ES) — 0 a traduzir

Cadeia: es-MX → es-ES → en-US → pt-BR

## Plurais

Textos com plural: `ajuda.artigos`, `ajuda.passos`. Cada idioma escreve as formas que a língua dele usa
(regra do `Intl.PluralRules`, a mesma que o i18next usa para escolher a forma pelo `count`). Variante herda as formas da
base com a regra dela (`src/i18n/plurais.js`). Para um idioma ainda não cadastrado: `npm run idiomas -- plurais ar-SA`.

| Idioma | Formas (exemplos de números) | Faltam |
| --- | --- | --- |
| pt-BR | one (0–1), many (só em decimal ou número abreviado, como "1 mi": o site não mostra), other (2–1000) | — |
| pt-PT | one (1), many (só em decimal ou número abreviado, como "1 mi": o site não mostra), other (0, 2–1000) | — |
| en-US | one (1), other (0, 2–1000) | — |
| en-GB | one (1), other (0, 2–1000) | — |
| en-AU | one (1), other (0, 2–1000) | — |
| en-CA | one (1), other (0, 2–1000) | — |
| es-ES | one (1), many (só em decimal ou número abreviado, como "1 mi": o site não mostra), other (0, 2–1000) | — |
| es-MX | one (1), many (só em decimal ou número abreviado, como "1 mi": o site não mostra), other (0, 2–1000) | — |
