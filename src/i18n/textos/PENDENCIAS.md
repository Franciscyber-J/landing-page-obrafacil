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

## fr-FR — Français (France) (base) — 0 a traduzir

Cadeia: fr-FR → en-US → pt-BR

## de-DE — Deutsch (Deutschland) (base) — 0 a traduzir

Cadeia: de-DE → en-US → pt-BR

## ar-SA — العربية (السعودية) (base) — 0 a traduzir

Cadeia: ar-SA → en-US → pt-BR

## it-IT — Italiano (Italia) (base) — 0 a traduzir

Cadeia: it-IT → en-US → pt-BR

## tr-TR — Türkçe (Türkiye) (base) — 0 a traduzir

Cadeia: tr-TR → en-US → pt-BR

## pl-PL — Polski (Polska) (base) — 0 a traduzir

Cadeia: pl-PL → en-US → pt-BR

## id-ID — Bahasa Indonesia (Indonesia) (base) — 0 a traduzir

Cadeia: id-ID → en-US → pt-BR

## ja-JP — 日本語 (日本) (base) — 0 a traduzir

Cadeia: ja-JP → en-US → pt-BR

## hi-IN — हिन्दी (भारत) (base) — 0 a traduzir

Cadeia: hi-IN → en-US → pt-BR

## vi-VN — Tiếng Việt (Việt Nam) (base) — 0 a traduzir

Cadeia: vi-VN → en-US → pt-BR

## nl-NL — Nederlands (Nederland) (base) — 0 a traduzir

Cadeia: nl-NL → en-US → pt-BR

## ko-KR — 한국어 (대한민국) (base) — 0 a traduzir

Cadeia: ko-KR → en-US → pt-BR

## zh-TW — 繁體中文 (台灣) (base) — 0 a traduzir

Cadeia: zh-TW → en-US → pt-BR

## ro-RO — Română (România) (base) — 0 a traduzir

Cadeia: ro-RO → en-US → pt-BR

## th-TH — ไทย (ประเทศไทย) (base) — 0 a traduzir

Cadeia: th-TH → en-US → pt-BR

## uk-UA — Українська (Україна) (base) — 0 a traduzir

Cadeia: uk-UA → en-US → pt-BR

## ru-KZ — Русский (Казахстан) (base) — 0 a traduzir

Cadeia: ru-KZ → en-US → pt-BR

## cs-CZ — Čeština (Česko) (base) — 0 a traduzir

Cadeia: cs-CZ → en-US → pt-BR

## el-GR — Ελληνικά (Ελλάδα) (base) — 0 a traduzir

Cadeia: el-GR → en-US → pt-BR

## hu-HU — Magyar (Magyarország) (base) — 0 a traduzir

Cadeia: hu-HU → en-US → pt-BR

## he-IL — עברית (ישראל) (base) — 0 a traduzir

Cadeia: he-IL → en-US → pt-BR

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
| fr-FR | one (0–1), many (só em decimal ou número abreviado, como "1 mi": o site não mostra), other (2–1000) | — |
| de-DE | one (1), other (0, 2–1000) | — |
| ar-SA | zero (0), one (1), two (2), few (3–10, 103–110, 203–210…), many (11–99, 111–199, 211–299…), other (100–102, 200–202, 300–302…) | — |
| it-IT | one (1), many (só em decimal ou número abreviado, como "1 mi": o site não mostra), other (0, 2–1000) | — |
| tr-TR | one (1), other (0, 2–1000) | — |
| pl-PL | one (1), few (2–4, 22–24, 32–34…), many (0, 5–21, 25–31…), other (só em decimal ou número abreviado, como "1 mi": o site não mostra) | — |
| id-ID | other (0–1000) | — |
| ja-JP | other (0–1000) | — |
| hi-IN | one (0–1), other (2–1000) | — |
| vi-VN | other (0–1000) | — |
| nl-NL | one (1), other (0, 2–1000) | — |
| ko-KR | other (0–1000) | — |
| zh-TW | other (0–1000) | — |
| ro-RO | one (1), few (0, 2–19, 101–119…), other (20–100, 120–200, 220–300…) | — |
| th-TH | other (0–1000) | — |
| uk-UA | one (1, 21, 31…), few (2–4, 22–24, 32–34…), many (0, 5–20, 25–30…), other (só em decimal ou número abreviado, como "1 mi": o site não mostra) | — |
| ru-KZ | one (1, 21, 31…), few (2–4, 22–24, 32–34…), many (0, 5–20, 25–30…), other (só em decimal ou número abreviado, como "1 mi": o site não mostra) | — |
| cs-CZ | one (1), few (2–4), many (só em decimal ou número abreviado, como "1 mi": o site não mostra), other (0, 5–1000) | — |
| el-GR | one (1), other (0, 2–1000) | — |
| hu-HU | one (1), other (0, 2–1000) | — |
| he-IL | one (1), two (2), other (0, 3–1000) | — |
