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

Idiomas dos artigos: `pt-BR`, `pt-PT`, `en-US`, `en-GB`, `en-AU`, `en-CA`, `es-ES`, `es-MX`
(`src/ajuda/idiomas.js`). Um idioma do site sem artigos próprios mostra os artigos do primeiro idioma
da cadeia dele que tiver (ex.: francês → inglês), com a tela no idioma do site.

## Páginas prontas

O build grava cada página da Central (início, assuntos e artigos) em cada idioma com o texto já no HTML
(`ferramentas/paginas/gerar.mjs`), para o Google e os buscadores com IA, e põe tudo no `sitemap.xml` com a data da
publicação de cada artigo no Firestore. O índice de cada idioma vai junto em `dados/ajuda/<idioma>.<código>.json`:
a página pronta o lê antes de ligar os botões (a busca funciona na hora) e depois confere o Firestore como sempre.
Artigo publicado depois do último build não tem página pronta: o `.htaccess` devolve o `index.html` e o site
desenha o artigo no navegador. Por isso, depois de publicar artigos novos, vale gerar e publicar o site de novo
(skill `publicar-site`).

## De onde vem o conteúdo

- **Produção:** `ajuda_indices/{idioma}` e `ajuda_artigos/{id}` pela API REST do Firestore
  (leitura pública pelas regras; o site não usa chave nem SDK). Prints pelo endereço público do
  Storage (`ajuda/prints/...`).
- **Cache:** o índice e os artigos ficam guardados no navegador. O índice aparece na hora e é
  conferido em segundo plano; o artigo só é baixado de novo quando o hash dele muda.
- **Desenvolvimento:** sem tocar no Firestore, a partir da saída do publicador:

```powershell
# no gestao_obras\ferramentas\ajuda
node bin/publicar.mjs --saida D:\Projetos\ajuda_saida
# aqui
$env:AJUDA_SAIDA = "D:\Projetos\ajuda_saida"
$env:AJUDA_PRINTS = "D:\Projetos\ajuda_prints"   # opcional: <idioma>\<id>\<arquivo>
npm run dev
```

## Arquivos

| Arquivo | Faz |
| --- | --- |
| `src/ajuda/dados.js` | Lê índice e artigo (Firestore ou local), cache e endereço dos prints |
| `src/ajuda/busca.js` | Busca sem acento e sem maiúscula; título > tag > resumo > texto dos passos |
| `src/ajuda/texto.js` | Lê o texto dos passos: só `**negrito**`, lista `- ` e `[texto](artigo:id)`; nunca HTML |
| `src/ajuda/marcacao.js` | Marcação animada dos prints: leitura conferida do campo `marcacao` e as contas do desenho (iguais às do app) |
| `src/ajuda/idiomas.js` | Idiomas em que os artigos são publicados e qual usar para cada idioma do site |
| `src/ajuda/enderecos.js` | Endereços da Central no idioma do site (assunto pelo nome do módulo) |
| `src/components/ajuda/` | Páginas (início, assunto, artigo), busca e estados (carregando, erro, vazio) |

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
