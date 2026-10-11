# Idiomas do site

Mesmo modelo do app (`gen_locale_arbs.py`): um cadastro, textos-base completos, variantes só com o que
muda e uma lista de pendências gerada.

| Arquivo | Para quê |
| --- | --- |
| `registro.js` | **Único lugar para cadastrar um idioma**: código, nome, bandeira, moeda, palavras dos endereços |
| `textos/<código>.json` | Textos. Idioma-base: completo. Variante (pt-PT, en-GB, es-MX...): só o que é diferente da base |
| `textos/PENDENCIAS.md` | Gerado por `npm run idiomas`: o que falta traduzir, textos repetidos, textos sem uso |
| `idiomas.js` | Regras (cadeia de textos, escolha pelo navegador, endereços). Não precisa mexer |
| `preferencia.js` | Idioma escolhido no menu (fica no navegador) e idioma com que o site abre |
| `RotaDoIdioma.jsx` | Troca de idioma levando para a mesma página, e `hreflang`/`canonical` para o Google |
| `config.js` | i18next: cada idioma é um arquivo separado no build, baixado só quando usado |
| `pricing.js` | Preços; a moeda de cada idioma vem do campo `moeda` do cadastro |

## Endereços

O idioma é o começo do endereço e as palavras vêm do cadastro:

| pt-BR | en-US | es-ES |
| --- | --- | --- |
| `/pt-br/` | `/en-us/` | `/es-es/` |
| `/pt-br/#precos` | `/en-us/#pricing` | `/es-es/#precios` |
| `/pt-br/ajuda` | `/en-us/help` | `/es-es/ayuda` |
| `/pt-br/ajuda/assunto/financeiro-da-obra` | `/en-us/help/topic/project-finances` | `/es-es/ayuda/tema/finanzas-de-la-obra` |
| `/pt-br/ajuda/criar-rdo` | `/en-us/help/create-daily-report` | `/es-es/ayuda/crear-informe-diario` |

- `/` leva ao idioma da pessoa: o que ela escolheu antes no menu; senão, o do navegador, respeitando a
  região (`es-AR` → es-MX, `pt-AO` → pt-PT, `en-NZ` → en-AU); sem nenhum parecido, inglês (en-US).
- Endereço antigo (`/ajuda/pt-BR/...`), âncora de outro idioma (`/en-us/#precos`) ou palavra de outro
  idioma (`/en-us/ajuda`) vai sozinho para o endereço certo. O `?utm_...`/`?gclid=...` dos anúncios é mantido.
- O idioma do endereço manda: `lang`/`dir` da página, textos, preços e títulos seguem ele.

## Incluir um idioma

1. Em `registro.js`, acrescente a entrada (o comentário no topo explica cada campo).
2. `npm run idiomas -- novo fr-FR` cria `textos/fr-FR.json` e o pacote `ferramentas/idiomas/a-traduzir/fr-FR.json`
   com todos os textos em inglês (já com as formas de plural que o francês usa).
3. Traduza os valores do pacote (Codex/Claude ou tradutor) e rode `npm run idiomas -- importar fr-FR`.
   A importação recusa o pacote se algum `{{...}}` estiver diferente e apaga o pacote no fim.
4. `npm run idiomas` confere tudo. Enquanto faltar texto, o site mostra o do próximo idioma da cadeia
   (francês → inglês → português), então dá para publicar um idioma parcialmente traduzido.

Variante regional (ex.: `en-NZ` com base `en-US`): o pacote vem com os textos da base; mude só o que é
diferente e importe. O que ficar igual à base é descartado.

Os artigos da Central de Ajuda são publicados por outro caminho (`gestao_obras/ajuda`). Um idioma do site
sem artigos próprios mostra os artigos do primeiro idioma da cadeia que tiver (ver `src/ajuda/LEIAME.md`).

## Conferência no build

`npm run build` roda antes `npm run idiomas -- --build`. Para o build se houver: chave que não existe no
pt-BR, `{{...}}` diferente, texto vazio, lista no lugar de texto (ou o contrário), cadastro inválido
(código, bandeira, moeda, palavras dos endereços). Texto faltando não para o build: entra em `PENDENCIAS.md`.

## Hospedagem

O `.htaccess` (`hospedagem/.htaccess`) entrega o `index.html` para `/<idioma de 2 letras>-<região de 2 letras>/...`,
por isso o código do idioma tem sempre esse formato. As bandeiras são servidas pelo próprio site
(`/bandeiras/<país>.svg`, copiadas do pacote `flag-icons` no build), sem CDN de terceiros.
