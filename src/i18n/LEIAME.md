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
| `pricing.js` | Preços; a moeda de cada idioma vem do campo `moeda` do cadastro (`precosDoIdioma` dá os números para o Google e o llms.txt). Rupia, florim e dólar de Taiwan aparecem sem centavos (`casasNaTela`), como no app |
| `formatos.js` | **Único lugar que formata número e data** (`formatarNumero`, `partesDoNumero`, `formatarData`, `anoNoIdioma`): algarismos sempre 0-9 (o `ar-SA` sairia com ٠-٩), tailandês no ano budista (2570), os outros no calendário gregoriano, como o app. O teste acusa `Intl.NumberFormat`, `Intl.DateTimeFormat` ou `toLocaleString` fora dele |

## Endereços

O idioma é o começo do endereço e as palavras vêm do cadastro:

| pt-BR | en-US | es-ES |
| --- | --- | --- |
| `/pt-br/` | `/en-us/` | `/es-es/` |
| `/pt-br/#precos` | `/en-us/#pricing` | `/es-es/#precios` |
| `/pt-br/ajuda` | `/en-us/help` | `/es-es/ayuda` |
| `/pt-br/ajuda/assunto/financeiro-da-obra` | `/en-us/help/topic/project-finances` | `/es-es/ayuda/tema/finanzas-de-la-obra` |
| `/pt-br/ajuda/criar-rdo` | `/en-us/help/create-daily-report` | `/es-es/ayuda/crear-informe-diario` |

- `/` leva ao idioma da pessoa pelo navegador, respeitando a região (`es-AR` → es-MX, `pt-AO` → pt-PT,
  `en-NZ` → en-AU); sem nenhum parecido, inglês (en-US). No servidor é um redirecionamento 302 (`.htaccess`); só
  sem o servidor (npm run dev, prévia) o site faz isso sozinho, e aí vale antes o idioma escolhido no menu.
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

## Textos para o Google e os buscadores com IA (chaves `seo.*`)

Título e descrição de cada página em cada idioma (`seo.inicio`, `seo.ajuda`, `seo.assunto`, `seo.artigo`; Suporte,
Perfil e pagamento usam `suporte.meta*`, `perfil.meta*`, `pagamento.meta*`), a descrição do aplicativo nos dados
estruturados (`seo.app`), o texto da imagem de prévia (`seo.imagemAlt`) e os títulos do `llms.txt` (`seo.llms`).
Escritos de forma nativa, com as palavras que as pessoas buscam em cada país, sem exagero: pt-BR "aplicativo de
gestão de obras", "diário de obra (RDO)"; pt-PT "aplicação de gestão de obras"; en-US "construction management
app", "daily log"; en-GB/en-AU "site diary"; es-ES "aplicación de gestión de obras", "parte diario"; es-MX
"aplicación para administrar obras", "bitácora de obra". Título até uns 60 caracteres e descrição até uns 160.
O site no navegador e as páginas prontas do build usam as mesmas funções (`src/seo/textos.js`).

## Idioma novo e o SEO

Tudo sai do cadastro: páginas prontas, `hreflang`, sitemap, `llms.txt` e dados estruturados (com a moeda do
idioma) entram sozinhos no próximo build. Falta só:

1. Traduzir as chaves `seo.*` como as outras (são textos de busca: escrever com as palavras do país, não traduzir
   ao pé da letra).
2. `npm run htaccess` e enviar o `hospedagem/.htaccess` novo: a raiz e os endereços antigos passam a levar ao idioma
   novo quem tem o navegador nele (o `npm test` avisa se esquecer).
3. Depois de publicar, o sitemap no Search Console é o mesmo (`/sitemap.xml`): não precisa enviar de novo.

## Conferência no build

`npm run build` roda antes `npm run idiomas -- --build`. Para o build se houver: chave que não existe no
pt-BR, `{{...}}` diferente, texto vazio, lista no lugar de texto (ou o contrário), cadastro inválido
(código, bandeira, moeda, palavras dos endereços). Texto faltando não para o build: entra em `PENDENCIAS.md`.

## Hospedagem

O `.htaccess` (`hospedagem/.htaccess`) entrega as páginas prontas e o `index.html` para
`/<idioma de 2 letras>-<região de 2 letras>/...`, por isso o código do idioma tem sempre esse formato. A raiz `/` e
os endereços antigos escolhem o idioma pelo navegador com a mesma regra de `escolherIdioma` (bloco gerado por
`npm run htaccess`); o idioma escolhido no menu vale para a navegação dentro do site. As bandeiras são servidas pelo próprio site
(`/bandeiras/<país>.svg`, copiadas do pacote `flag-icons` no build), sem CDN de terceiros.
