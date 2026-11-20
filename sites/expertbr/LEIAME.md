# Site da ExpertBR (expertbr.com)

A casa da marca ExpertBR, o estúdio dos aplicativos: apresenta a ExpertBR em poucas linhas, um painel por aplicativo
(ObraFácil no ar; Orbit "em breve"), "sobre", contato e as políticas. Feito em 20/11/2026 (decisão do Francis,
`gestao_obras/docs/ONDE_ESTAMOS.md`, entradas de 20/11 07h29 e 07h34), na branch `site-expertbr`.

**A empresa ainda não existe formalmente.** O site não tem CNPJ, razão social, endereço, telefone, número de
pessoas, clientes, prêmios nem nenhum dado inventado, e os dados estruturados também não (o build confere:
`ferramentas/conferir.mjs`, `CAMPOS_PROIBIDOS`). O logotipo é provisório: o nome "ExpertBR" em letra (a fonte dos
títulos do site), até haver um logotipo aprovado.

Publicação na Hostinger e caminho de volta: **`PUBLICAR.md`** (nesta pasta).

## O que tem e de onde vem

| Parte | Origem |
| --- | --- |
| Aplicativos (cartões, menu, dados para o Google, llms.txt) | `src/produtos.js`: um item por app. **App novo = um item a mais** e os textos dele |
| Textos da ExpertBR | `src/textos/<idioma>.json` (29 idiomas, mesmo modelo do site do ObraFácil: base completa, variante só com o que muda) |
| Textos do ObraFácil no cartão dele (frase, descrição, recursos, plataformas, "plano grátis sem prazo") | os do site do ObraFácil (`src/i18n/textos`), pela chave `obrafacil:...`: os mesmos textos e números do site dele, sem cópia |
| Telas do ObraFácil | prints reais do app (`public/telas/<idioma>` do site do ObraFácil), copiados no build |
| Idiomas, endereços (`/pt-br/`), escolha pelo navegador | cadastro do site do ObraFácil (`src/i18n/registro.js`, `src/i18n/idiomas.js`): idioma novo lá entra aqui também |
| Cores, medidas, fontes, botões | `src/styles/design-tokens.css` e `src/index.css` do site do ObraFácil (importados em `src/estilos.css`) |
| Fontes do japonês, árabe, hindi... | `src/fontes/<escrita>.css` do site do ObraFácil: cada página liga só a da escrita dela |
| Política de segurança, cache e endereços | `hospedagem/.htaccess` (vai para `public_html/.htaccess`) |

Os aplicativos ficam cada um num subdomínio do expertbr.com, que não muda (decisão do Francis, 20/11/2026, 07h34):
ObraFácil em `appobrafacil.expertbr.com`, Orbit em `orbit.expertbr.com`, os próximos no mesmo padrão (o teste
confere o formato do endereço). O Orbit está "em breve": o endereço fica guardado em `src/produtos.js`, mas o cartão
não tem link, preço nem data, e o Orbit não entra nos dados estruturados nem no llms.txt com endereço.

Contato: `suporte@appobrafacil.expertbr.com` (o e-mail oficial do suporte do ObraFácil, `src/links.js`). Políticas:
os Termos de Uso e a Política de Privacidade do ObraFácil, no idioma da página, até a ExpertBR ter os dela.

## Comandos (na raiz do repositório)

| Comando | O que faz |
| --- | --- |
| `npm run expertbr:build` | confere os textos, gera o site em `sites/expertbr/dist` (uma página pronta por idioma, sitemap.xml, robots.txt, llms.txt) e confere tudo; qualquer problema para o build |
| `npm run expertbr:test` | testes do site (também rodam no `npm test` da raiz) |
| `npm run expertbr:idiomas` | só a conferência dos textos dos 29 idiomas |
| `npm run expertbr:htaccess` | regrava o bloco dos idiomas do `hospedagem/.htaccess` (idioma novo no cadastro) |
| `npm run expertbr:previa` | abre o `dist` em `http://localhost:4174` (a raiz escolhe o idioma pelo navegador) |
| `npm run expertbr:pacote -- D:\Projetos\pacotes_site` | zip do `dist` e cópia do `.htaccess` para enviar (só da `main`, sem mudança pendente) |
| `node sites/expertbr/ferramentas/verificar.mjs` | confere o expertbr.com no ar; com `--fotografar-obrafacil`/`--comparar-obrafacil`, prova que o ObraFácil não mudou |
| `py sites/expertbr/ferramentas/imagens.py` | refaz as imagens da marca (ver "Imagens") |

## Páginas e endereços

- `/pt-br/`, `/en-us/`, `/ja-jp/`... uma página por idioma, com o texto no HTML (React só no build, em
  `src/servidor.jsx`; o navegador recebe a página pronta). O único script no navegador é `src/cliente.js` (botão do
  tema e menu de idiomas, 1 KB); a página funciona inteira sem ele. Sem nada de terceiros.
- `/` leva ao idioma do navegador (302 no servidor, igual ao site do ObraFácil); sem servidor (prévia), o script faz.
- Seções com a palavra do idioma (`#aplicativos`, `#apps`, `#アプリ`): `ancoras.*` nos textos.
- Cada página: título, descrição, canonical, hreflang dos 29 idiomas + x-default (a raiz), Open Graph com a imagem
  `og.png` e dados estruturados (Organization, WebSite, WebPage e um SoftwareApplication por app no ar).

## Idioma novo

O idioma entra pelo cadastro do site do ObraFácil (`src/i18n/LEIAME.md`). Aqui falta: `src/textos/<código>.json`
(base: todas as chaves, escritas de forma nativa, sem tradução palavra por palavra; variante: só o que muda),
`npm run expertbr:idiomas` sem erro, `npm run expertbr:htaccess` e enviar o `.htaccess` novo. O teste acusa o que
faltar.

## Direção visual

Mesmo mundo do site do ObraFácil (tokens, Bricolage Grotesque nos títulos e Manrope no texto, laranja só na ação e no
destaque, claro e escuro), com composição de estúdio: título grande ("Um aplicativo para cada **trabalho**."), o
elenco dos apps em linha logo na primeira dobra (como os créditos de um estúdio) e um painel por app na cor dele. O
ObraFácil no painel azul do site dele, com as telas reais subindo da borda; o Orbit em coral (a cor do ícone dele,
`marcas/orbit.svg`, desenhado a partir de `orbit/public/app-icon.html`), com um desenho simples das três conversas
chegando numa caixa só (sem tela inventada e sem logotipo de outra empresa). Sem gradiente no texto, sem selo em
cima dos títulos, sem cartões iguais de ícone e texto.

- Árabe e hebraico da direita para a esquerda (só lados lógicos no CSS); japonês e chinês quebram a linha entre
  palavras; nas escritas fora do latim os títulos não têm a letra apertada.
- Celular de 360 e 390 px sem rolagem para o lado (conferido nos 29 idiomas, com o menu aberto).
- Movimento: só o giro lento da órbita do Orbit, parado com "menos movimento".

## Imagens

Todas geradas por `ferramentas/imagens.py` (o script diz como), nada de banco de imagens:
`favicon.svg` e `apple-touch-icon.png` (o "E" em barras, a de baixo laranja), `logo.png` (nome em letra, logotipo
provisório dos dados estruturados), `og.png` (prévia do link, sem texto de idioma), `marcas/obrafacil.webp` (reduzida
de `public/favicon.png` do site do ObraFácil). `marcas/orbit.svg` é o ícone do Orbit.

## Conferência

- O build confere cada página (título, descrição, canonical, hreflang, dados estruturados sem dado inventado, links
  internos, âncoras, imagem sem texto alternativo, script ou estilo embutido) e o sitemap, robots e llms.txt.
- **Teste do `.htaccess` num Apache local** (feito em 20/11/2026): um Apache 2.4 com as duas pastas como na Hostinger
  (`public_html` do expertbr.com e `public_html/appobrafacil` do ObraFácil, com o `.htaccess` de verdade de cada
  um). `verificar.mjs --endereco http://127.0.0.1:8088` passou inteiro (29 páginas, raiz por idioma, WordPress, 410,
  cabeçalhos). E o ObraFácil respondeu **igual** (status, destino e todos os cabeçalhos de 18 endereços) com o
  `.htaccess` do WordPress de hoje, sem nenhum `.htaccess` em cima e com o novo; um cabeçalho posto de propósito
  sem a marca `env=EXPERTBR` apareceu nos 18 (prova de que o teste pega vazamento).
- A política de segurança (`Content-Security-Policy`, valendo de verdade, não só aviso) foi conferida no navegador
  nas 29 páginas e na raiz: nenhum bloqueio, tema e menu funcionando.
