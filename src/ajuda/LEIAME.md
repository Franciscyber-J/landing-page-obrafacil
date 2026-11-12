# Central de Ajuda do site

O conteúdo não fica neste projeto: ele é escrito em `gestao_obras/ajuda/` e publicado no
Firestore pelo publicador (`gestao_obras/ferramentas/ajuda`). O site só lê.

## Endereços

| Endereço | Página |
| --- | --- |
| `/pt-br/ajuda` · `/en-us/help` · `/es-es/ayuda` | Início: busca, guias completos, assuntos e essenciais |
| `/pt-br/ajuda/assunto/diario-de-obra-rdo` · `/en-us/help/topic/daily-reports` | Todos os artigos de um assunto (nome do módulo no idioma) |
| `/pt-br/ajuda/criar-rdo` · `/en-gb/help/create-daily-report` | Artigo (o final é o `slug` do artigo naquele idioma) |
| `/ajuda`, `/ajuda/pt-BR/...` | Endereços antigos: levam ao endereço novo no idioma certo |

As palavras `ajuda`/`help`/`ayuda` e `assunto`/`topic`/`tema` vêm de `src/i18n/registro.js`
(ver `src/i18n/LEIAME.md`). O nome do assunto no endereço é o nome do módulo sem acento; para isso o
índice publicado traz `modulos[].nomes` (nome em todos os idiomas). Trocar o idioma no menu leva para a
mesma página no idioma novo. Endereço com o `id` do artigo ou do módulo, ou com o nome em outro idioma
(ex.: `/en-us/help/criar-rdo`), é corrigido sozinho para o endereço certo.

### Endereço na escrita do idioma

O `slug` do artigo, o nome do assunto e as palavras do cadastro ficam na escrita do próprio idioma, sem
transliterar (`/ja-jp/ヘルプ/写真を追加`, `/ar-sa/مساعدة/إضافة-صورة`). A regra é uma só (`palavraDeEnderecoValida`
em `src/i18n/idiomas.js`, a mesma do esquema dos artigos no gestao_obras): letras (minúsculas onde a escrita tem
maiúscula), as marcas da escrita, números e hífen entre as palavras, sem espaço, pontuação nem barra, em NFC.
O nome do assunto (`slugDoTexto`) tira só o acento do latim, do grego e do cirílico e os sinais de vogal opcionais
do árabe e do hebraico; as vogais do hindi e do tailandês e o dakuten do japonês ficam.

| Onde | Como fica |
| --- | --- |
| Links do site (`rotas.artigo`, `caminhoArtigo`) e o React Router | As letras como são; o navegador põe os `%XX` |
| Leitura do endereço (`analisarCaminho`) | Tira os `%XX` e passa para NFC; endereço que chega em NFD vai para o NFC |
| Páginas prontas (`arquivoDaPagina`) | Pasta e arquivo com o nome em UTF-8 (`pt-br/ajuda/写真を追加.html`) |
| canonical, hreflang, sitemap.xml, llms.txt, dados estruturados (`absoluto`) | Com os `%XX` (só ASCII), como pedem os padrões de URL e de sitemap |
| Hostinger | O Apache tira os `%XX` e acha a pasta pelo nome em UTF-8: o `.htaccess` de hoje já serve (conferido com o Apache 2.4 e o próprio `.htaccess`) |

Idiomas dos artigos: os 29 do site, os mesmos do publicador (`src/ajuda/idiomas.js`, desde a 2.0). Um idioma do
site sem artigos próprios mostraria os artigos do primeiro idioma da cadeia dele que tiver (ex.: um idioma futuro →
inglês), com a tela no idioma do site; hoje todos têm os próprios.

Artigo de ferramenta só do Brasil (CUB, cronograma automático; regra no publicador, `traducoes.mjs`) existe só no
índice do pt-BR: nos outros idiomas ele não tem página, não aparece na busca nem no "Também em", e os relacionados
e pré-requisitos de cada idioma já vêm sem ele.

### Endereços que mudaram

Endereço da Central que já esteve no ar e deixou de existir fica em `src/ajuda/antigos.js`:

| Caso | Servidor (`.htaccess`, `npm run htaccess`) | Site no navegador |
| --- | --- | --- |
| Assunto com nome novo (ex.: `/en-us/help/topic/calculators-and-estimates`) | 301 para o endereço novo (`.../calculators`) | `acharModulo` acha pelo nome antigo e troca o endereço |
| Artigo que saiu do idioma (ex.: `/en-us/help/cub-cost-estimate`) | 410 (removido de vez), com o site no corpo | leva ao início da Central do idioma |

Por que 410 e não 301 para o início da Central: o artigo não tem equivalente no idioma (a ferramenta não existe fora
do Brasil). Um 301 para uma página que não fala do mesmo assunto o Google trata como "soft 404" e demora a tirar do
índice; o 410 diz "removido de vez", o endereço sai mais depressa e não fica marcado como erro do site. A pessoa que
abre o link antigo não vê página de erro: o servidor entrega o site com o 410 e o site a leva ao início da Central.

O build confere a lista contra o que foi publicado e para se ela não bater (nome novo do assunto diferente do da
lista, artigo retirado que voltou ao idioma, endereço antigo que virou página de novo). Ao renomear um assunto ou
tirar um artigo de um idioma já publicado: acrescente em `antigos.js`, rode `npm run htaccess` e envie o `.htaccess`
junto com o site. O verificador (`hospedagem/verificar.mjs`) confere cada endereço da lista no ar.

## Páginas prontas

O build grava cada página da Central (início, assuntos e artigos) em cada idioma com o texto já no HTML
(`ferramentas/paginas/gerar.mjs`), para o Google e os buscadores com IA, e põe tudo no `sitemap.xml` com a data da
publicação de cada artigo no Firestore. O índice de cada idioma vai junto em `dados/ajuda/<idioma>.<código>.json`:
a página pronta o lê antes de ligar os botões (a busca funciona na hora) e depois confere o Firestore como sempre.
Artigo publicado depois do último build não tem página pronta: o `.htaccess` devolve o `index.html` e o site
desenha o artigo no navegador. Por isso, depois de publicar artigos novos, vale gerar e publicar o site de novo
(skill `publicar-site`).

Regras que mantêm o Google lendo certo (achados no Search Console em 11/11/2026):

- **Página pronta nunca vira tela de erro.** Se os textos do idioma ou o índice não baixarem, o `src/main.jsx` deixa
  na tela o que veio no HTML e tenta de novo (2, 6 e 15 segundos, e quando a internet volta); ele não desenha do zero.
  Antes, a falha levava a "Não foi possível carregar a Central" no lugar do artigo, igual em todos os endereços do
  idioma: é a causa mais provável de o Google ter tratado 13 artigos como cópia de outro artigo do mesmo idioma
  (ex.: `/fr-fr/aide/deplacer-supprimer-fichier` com a canônica escolhida `/fr-fr/aide/materiaux-calcules`).
- **Tela de erro, Central vazia e endereço que não existe levam `noindex`** (`src/components/ajuda/Estados.jsx`).
- **Link do site para um artigo sai com o endereço do idioma.** As páginas Suporte, Perfil e volta do pagamento
  apontam artigos pelo id; o build entrega a cada uma o endereço do artigo no idioma dela
  (`src/ajuda/artigosDoSite.js`, lista `ARTIGOS_DO_SITE`; id novo entra na lista e o build para se o artigo não
  estiver publicado em algum idioma). Antes o link ia para `/fr-fr/aide/cancelar-assinatura` (id em português), que
  não tem página pronta.
- **O build confere todos os links** entre páginas prontas (`conferirLinks`, em `ferramentas/paginas/conferir.mjs`):
  link para endereço sem página pronta para o build.
- Endereço pelo id continua funcionando para as pessoas (o site troca pelo endereço certo no navegador), mas não
  pode aparecer em link nem em sitemap.

## De onde vem o conteúdo

- **Produção:** o formato novo, um documento por idioma (desde a `ajuda-por-idioma`, 26/10/2026;
  `src/ajuda/formato.js`), pela API REST do Firestore (leitura pública pelas regras; o site não usa chave nem
  SDK). O site lê só o idioma da página:
  - `ajuda_idiomas/{idioma}`: cabeçalho (hash e versão do índice, ~0,1 KB), conferido uma vez por visita;
  - `ajuda_idiomas/{idioma}/partes/indice`: o índice completo, só quando o hash do cabeçalho muda;
  - `ajuda_idiomas/{idioma}/artigos/{id}`: o artigo naquele idioma, com o endereço (slug) dele nos outros idiomas
    (`slugs`), para o menu de idiomas e o hreflang.
  O formato antigo (`ajuda_indices/{idioma}` e `ajuda_artigos/{id}` com os idiomas juntos) não é mais lido pelo
  site; o publicador continua gravando só para o app das lojas e o servidor. Idioma novo só existe no formato novo.
  Prints pelo endereço público do Storage (`ajuda/prints/...`).
- **Ordem de publicação:** o site novo só vai ao ar depois de o publicador gravar o formato novo em todos os idiomas
  de `IDIOMAS_AJUDA` (sem eles, o build para com "Central de Ajuda não lida" ou "Central de Ajuda sem N idioma(s)
  publicado(s)"). Ver `gestao_obras/docs/PUBLICACAO_PENDENTE.md`.
- **Cache:** o índice e os artigos ficam guardados no navegador (`ajuda:v2:`; o que o formato antigo guardou em
  `ajuda:v1:` é apagado). O índice aparece na hora (o da página pronta ou o guardado) e é conferido em segundo
  plano pelo cabeçalho; o artigo só é baixado de novo quando o hash dele no índice daquele idioma muda.
- **Desenvolvimento:** sem tocar no Firestore, a partir da saída do publicador:

```powershell
# no gestao_obras\ferramentas\ajuda (grava ajuda_idiomas\..., com as mesmas pastas do Firestore)
node bin/publicar.mjs --saida D:\Projetos\ajuda_saida
# aqui
$env:AJUDA_SAIDA = "D:\Projetos\ajuda_saida"
$env:AJUDA_PRINTS = "D:\Projetos\ajuda_prints"   # opcional: <idioma>\<id>\<arquivo>
npm run dev
```

  Para conferir as páginas prontas com essa saída (o `dist` fica marcado como teste e o `npm run pacote` o recusa):

```powershell
npx vite build; npx vite build --ssr src/ssr/entrada.jsx --outDir dist-ssr
node ferramentas/paginas/gerar.mjs --ajuda-local D:\Projetos\ajuda_saida --legal-local D:\Projetos\gestao_obras\legal
```

## Arquivos

| Arquivo | Faz |
| --- | --- |
| `src/ajuda/formato.js` | Caminhos do formato novo no Firestore, conferência dos documentos e o artigo do idioma no formato das páginas (`artigoParaPagina`); usado pelo site e pelas páginas prontas |
| `src/ajuda/dados.js` | Lê cabeçalho, índice e artigo do idioma (Firestore ou local), cache e endereço dos prints |
| `src/ajuda/busca.js` | Busca sem acento, sem maiúscula e sem os sinais de vogal opcionais do árabe e do hebraico (harakat, tatweel, niqqud); título > tag > resumo > texto dos passos |
| `src/ajuda/texto.js` | Lê o texto dos passos: só `**negrito**`, lista `- ` e `[texto](artigo:id)`; nunca HTML |
| `src/ajuda/marcacao.js` | Marcação animada dos prints: leitura conferida do campo `marcacao` e as contas do desenho (iguais às do app) |
| `src/ajuda/idiomas.js` | Idiomas em que os artigos são publicados e qual usar para cada idioma do site |
| `src/ajuda/antigos.js` | Endereços que mudaram (assunto renomeado: 301; artigo que saiu do idioma: 410) e a conferência do build |
| `src/ajuda/enderecos.js` | Endereços da Central no idioma do site (assunto pelo nome do módulo) |
| `src/ajuda/artigosDoSite.js` | Artigos que as páginas Suporte, Perfil e volta do pagamento apontam, com o endereço de cada um no idioma (vem do build) |
| `src/components/ajuda/` | Páginas (início, assunto, artigo), busca e estados (carregando, erro, vazio) |

## Moldura de celular dos prints

Os prints novos (bateria da 2.0.1) trazem só a tela do app, sem a barra do sistema: a Apple recusou os prints com a
barra do Android dentro do app do iPhone (regra 2.3.10). A "cara de celular" é desenhada pelo site e pelo app em volta
do print (decisão do Francis, 11/11/2026): corpo do aparelho, faixa de status (hora fixa `12:00`, câmera e ícones) e
barra de gestos. O print fica inteiro entre as duas faixas; a moldura nunca cobre a tela do app.

- Dois estilos, pelo aparelho de quem abre (`src/ajuda/moldura.js`): `pilula` (recorte em pílula) no iPhone, iPad e
  Mac; `furo` (furo redondo no centro) no Android e nos outros. Nenhum copia um modelo de marca.
- A página pronta do build sai sempre com `furo`; o estilo do aparelho entra depois da hidratação.
- Tudo da moldura é enfeite (`aria-hidden`); a faixa de status fica sempre da esquerda para a direita.
- Componente: `src/components/ajuda/MolduraDoCelular.jsx`; medidas em `cqw` (seguem a largura da moldura) e cores
  `--aj-celular*` em `Ajuda.module.css`. O app desenha a mesma moldura
  (`gestao_obras/lib/ajuda/widgets/moldura_do_celular.dart`): mudou lá, muda aqui.
- **Ordem de publicação:** só publicar o site com a moldura depois de a Central estar sem os prints antigos (que têm a
  barra do Android dentro da imagem); senão o print antigo aparece com duas barras de status.

## Marcação animada nos prints

Cada passo publicado traz, além do print limpo, o campo `marcacao`: onde fica o alvo, em proporção do print
(`x`, `y`, `largura`, `altura`, de 0 a 1), e os efeitos (`escurecer`, `circulo`, `seta`, `zoom`). O site desenha
por cima do print, em SVG, o mesmo destaque que o app desenha a partir da 1.9.2
(`gestao_obras/lib/ajuda/widgets/print_com_marcacao.dart`): mesmos tempos (entrada de 700 ms, pulso de 1,6 s),
curva, espessuras, forma do contorno, lado da seta e zoom. Mudou lá, muda em `src/ajuda/marcacao.js`.
Alvo perto da borda: o zoom desloca o enquadramento só o necessário para o destaque inteiro (contorno e onda
do pulso no tamanho máximo) caber no print. App (a partir da versão seguinte à 1.9.2, em
`GeometriaMarcacao.calcular` e `MedidasMarcacao`) e site fazem a mesma conta; na 1.9.2 o app ainda aumenta em
volta do centro do alvo e corta o círculo junto da borda.

- A imagem não muda; o espaço do print fica reservado (1080 × 2400) antes de ela chegar.
- Só anima com o print na tela; com "reduzir movimento" no aparelho, aparece parada no estado final.
- Para o leitor de tela a marcação não existe (`aria-hidden`); vale o texto alternativo do print.
- Número fora de 0 a 1, alvo vazio ou fora do print: print limpo. Efeito desconhecido é descartado (se não
  sobrar nenhum, print limpo), como no app.
- Cores: `--marcacao`, `--marcacao-contorno` e `--marcacao-veu` em `src/styles/design-tokens.css`.
- Componente: `src/components/ajuda/PrintComMarcacao.jsx`.

Testes da busca, do texto, dos idiomas e da marcação: `npm test`.
