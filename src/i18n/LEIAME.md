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
| `pricing.js` | Preços; a moeda de cada idioma vem do campo `moeda` do cadastro (`precosDoIdioma` dá os números para o Google e o llms.txt) |

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
- As palavras do cadastro (`rotas`) ficam na escrita do idioma (`ヘルプ`, `مساعدة`, `सहायता`), sem transliterar:
  letras (minúsculas onde a escrita tem maiúscula), as marcas da escrita, números e hífen entre as palavras, em NFC
  (`palavraDeEnderecoValida` em `idiomas.js`, a mesma regra do `slug` dos artigos; ver `src/ajuda/LEIAME.md`,
  "Endereço na escrita do idioma"). O `npm run idiomas` recusa palavra fora da regra.

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

## Plurais

Texto com número que muda (`{{count}}`) é sempre plural: `chave_one`, `chave_other` e as outras formas que a língua usa
(`_zero`, `_two`, `_few`, `_many`), pela regra do `Intl.PluralRules`, a mesma que o i18next usa para escolher a forma
pelo `count` (`t('ajuda.artigos', { count })`). Português e espanhol usam one/many/other; inglês one/other; árabe as
seis; hebraico one/two/other; polonês one/few/many/other; japonês só other.

- `npm run idiomas` acusa `{{count}}` fora de plural no pt-BR (erro) e lista em `PENDENCIAS.md` ("Plurais") as formas
  de cada idioma, com exemplos de números, e as que faltam. `npm run idiomas -- plurais ar-SA he-IL` mostra as formas
  de um idioma ainda não cadastrado.
- O `{{count}}` é obrigatório nas formas que valem para vários números; na que vale para um número só (zero, one do
  inglês, two do árabe) ele pode dar lugar à palavra ("one article", "مقالان").
- Variante regional: não precisa repetir os plurais da base. Ao carregar, as formas da base entram na variante e são
  escolhidas pela regra dela (`plurais.js`: em Portugal "0 artigos", no Brasil "0 artigo").

## Direção da escrita

`direcao: 'rtl'` no cadastro (árabe, hebraico) põe `dir="rtl"` no `<html>` (páginas prontas e site). O CSS só usa lados
lógicos e as animações espelham sozinhas (ver "Direita para a esquerda" no `DESIGN.md`).

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

## Fontes de cada escrita

A Manrope (texto) e a Bricolage Grotesque (títulos) cobrem latim e vietnamita; a Manrope também cirílico e grego
(nos títulos, essas letras saem na Manrope). Japonês, coreano, chinês tradicional, árabe (e persa e urdu), hebraico,
devanágari (hindi) e tailandês usam a Noto Sans da escrita, dos pacotes `@fontsource-variable/noto-sans-*` (versão
exata no `package.json`), servida pelo próprio site.

- O idioma diz a escrita no campo `escrita` do `registro.js` (`'japonesa'`, `'coreana'`, `'chinesaTradicional'`,
  `'arabe'`, `'hebraica'`, `'devanagari'`, `'tailandesa'`); sem o campo, latina. A variante herda o da base. Valor
  que não existe para o build com a mensagem.
- `src/fontes/escritas.js` monta no build o módulo `virtual:fontes-das-escritas` só com as escritas que algum idioma
  usa. Cada escrita é um CSS (`src/fontes/<escrita>.css`) baixado só nas páginas dela: põe a Noto depois da Manrope
  nas variáveis `--fonte-texto` e `--fonte-titulo` (`<html data-escrita="...">`). O CSS do pacote divide a fonte por
  `unicode-range`: o navegador baixa só os pedaços das letras que estão na página.
- Com os 8 idiomas de hoje o módulo é uma função vazia e o `dist/` sai igual, byte a byte, ao de antes das fontes.
- A fonte entra depois do JavaScript abrir (a página pronta mostra antes a fonte do sistema para essas letras).

## Fontes dos PDFs do app (`public/fontes/pdf/`)

O app baixa daqui, na primeira vez que a pessoa gera um PDF em japonês, coreano, chinês tradicional, árabe, hebraico,
hindi ou tailandês, a Noto Sans da escrita (normal e negrito), e confere o SHA-256 fixo no código dele
(`gestao_obras/lib/services/pdf/escrita_do_pdf.dart`). Os arquivos são gerados por `ferramentas/fontes-pdf/gerar.py`
(como usar no começo do arquivo), com o OFL de cada família e a `lista.json` (nome, bytes e SHA-256).

- Arquivo novo tem nome novo (o começo do SHA-256 vai no nome). Nunca apague nem troque um arquivo que já foi
  publicado: as versões antigas do app continuam buscando o dele.
- Publique o site com os arquivos **antes** da versão do app que os usa.

## Hospedagem

O `.htaccess` (`hospedagem/.htaccess`) entrega as páginas prontas e o `index.html` para
`/<idioma de 2 letras>-<região de 2 letras>/...`, por isso o código do idioma tem sempre esse formato. A raiz `/` e
os endereços antigos escolhem o idioma pelo navegador com a mesma regra de `escolherIdioma` (bloco gerado por
`npm run htaccess`); o idioma escolhido no menu vale para a navegação dentro do site. As bandeiras são servidas pelo próprio site
(`/bandeiras/<país>.svg`, copiadas do pacote `flag-icons` no build), sem CDN de terceiros.
