---
name: publicar-site
description: Gerar o site do ObraFácil e publicar na Hostinger (conteúdo de dist com as páginas prontas, robots.txt, sitemap.xml, llms.txt e o .htaccess), conferir no ar e avisar o Google pelo Search Console. Use ao preparar ou revisar qualquer publicação do site.
---

# Publicar o site

Quem publica é o Francis. A Hostinger não gera o site a partir do GitHub: ele envia os arquivos pelo
Gerenciador de Arquivos, em `public_html/appobrafacil`. Passe os passos um por um no chat, na ordem.

## Antes

1. Tudo na `main` (merge feito por ele).
2. Se a Central de Ajuda ou os Termos mudaram, os artigos/textos já publicados no Firestore (gestao_obras): as
   páginas prontas são feitas a partir do que está publicado lá. A Central precisa estar publicada em **todos** os
   idiomas de `src/ajuda/idiomas.js` (29 desde a 2.0); faltando um, o build para (ver abaixo).
3. Pasta dos pacotes fora do projeto: `D:\Projetos\pacotes_site` (o `npm run pacote` cria se não existir e recusa
   pasta dentro do projeto).

## Gerar o pacote (no computador dele, que lê o Firestore)

Um comando por vez, no PowerShell:

```powershell
cd D:\Projetos\landing_page
git switch main
git pull
npm ci
npm test
npm run lint
npm run build
npm run pacote -- D:\Projetos\pacotes_site
```

O `npm run build` faz tudo: confere os idiomas, gera o site, desenha as páginas prontas de cada idioma (lendo a
Central e os Termos no Firestore, só leitura) e grava o `sitemap.xml` (índice), um `sitemap-<idioma>.xml` por idioma,
`robots.txt` e `llms.txt`. No fim ele confere todas as páginas e para com erro se alguma estiver errada.

- Tem que terminar com `Conferência: ... página(s) pronta(s) sem problema.` A linha `Páginas prontas: ...` mostra
  quantas saíram (com os 29 idiomas e a Central de 02/11/2026: `ajuda 29, assunto 406, artigo 4705`).
- `ERRO: Central de Ajuda não lida` ou `ERRO: Termos e Política não lidos` = o computador não conseguiu ler o
  Firestore (internet). O build para sem gravar as páginas: **não publique**; rode `npm run build` de novo com
  internet. (A opção `--sem-firestore` e as `--ajuda-local`/`--legal-local` do gerador existem só para teste: o
  `npm run pacote` recusa um `dist` gerado assim.)
- `ERRO: Central de Ajuda sem N idioma(s) publicado(s) (...)` = os artigos desses idiomas ainda não foram
  publicados (gestao_obras, publicador). Publique os artigos antes e rode o build de novo.
- `ERRO: assunto renomeado ...` ou `ERRO: artigo retirado ...` = a lista dos endereços que mudaram
  (`src/ajuda/antigos.js`) não bate com o que foi publicado. Não publique: mande a mensagem para o Claude.
- O `gerar_site.bat` precisa rodar `npm run build` (e não `vite build` direto); senão as páginas prontas, os
  sitemaps, o robots.txt e o llms.txt não são gerados.

O `npm run pacote` confere o `dist` de novo e grava `D:\Projetos\pacotes_site\site_obrafacil_<data>_<commit>.zip`
com **o conteúdo** de `dist` (não a pasta): as pastas dos 29 idiomas, `dados/`, `assets/`, `bandeiras/`, `telas/`,
`fontes/`, `email/`, `index.html`, imagens, `tema.js`, `tag-google.js`, `robots.txt`, `sitemap.xml`, os
`sitemap-<idioma>.xml` e `llms.txt`. O `.htaccess` e a pasta `dist-ssr` não vão no zip. Tem que terminar com
`Pacote pronto: ...` e `zip relido e conferido arquivo por arquivo`. Ele recusa: pasta dentro do projeto, `dist` de
teste, `dist` de outro commit, branch diferente da `main` e mudança não gravada no código.

Use sempre o zip do `npm run pacote`, não o "Compactar" do Windows nem o `Compress-Archive`: com os 29 idiomas há
arquivos com nome em japonês, árabe, hebraico, hindi..., e esses compactadores podem gravar o nome com `\` ou em outra
codificação; extraído na Hostinger, o arquivo ficaria com o nome errado e a página pronta não abriria. O zip do
pacote grava os nomes em UTF-8 com `/` (conferido extraindo no Linux, como no servidor). Tamanho: perto de 110 MB.

## Enviar (Gerenciador de Arquivos da Hostinger, em `public_html/appobrafacil`, nesta ordem)

O zip é extraído **por cima** do que está no servidor. **Não apague as pastas dos idiomas antes**: sem elas o site
fica alguns minutos sem nenhuma página pronta, e o Google, se passar nessa hora, lê cada endereço sem o texto no
HTML (decisão de 11/2026, na arrumação do Search Console).

1. Baixar o `.htaccess` atual para `D:\Projetos\pacotes_site` (fora do projeto). É a volta.
2. Enviar o zip para `public_html/appobrafacil`, clicar nele com o botão direito → **Extract** (extrair ali mesmo,
   substituindo os arquivos que já existem) e, depois de extraído, apagar o zip do servidor.
3. Abrir o arquivo `site_obrafacil_<data>_<commit>_apagar.txt`, gravado ao lado do zip pelo `npm run pacote`. Ele
   lista as páginas que estão no servidor e não existem mais no site (artigo que saiu da Central, endereço que mudou
   de nome), comparando com o site no ar e com o pacote anterior. Quase sempre diz "Nada a apagar". Se listar
   arquivos, apague só esses, um por um. Nunca apagar `download/` (instalador do Windows), `email/`, `fontes/`
   (versões antigas do app baixam as fontes dos PDFs de lá), `assets/`, `dados/` nem o `.htaccess`.
4. **Por último**, só se `hospedagem/.htaccess` mudou: enviar o `.htaccess` novo, substituindo o atual. Se der erro
   500, suba de volta o `.htaccess` do passo 1.

O `npm run pacote` lê os sitemaps do site no ar para montar a lista do passo 3; sem internet ele para (o zip não fica
gravado). Só para voltar a uma versão antiga ou gerar sem internet: `npm run pacote -- D:\Projetos\pacotes_site
--sem-comparar` (a lista sai só da comparação com o pacote anterior da pasta, com aviso).

## Conferir no ar

```powershell
node hospedagem/verificar.mjs
```

Tem que terminar com "Tudo certo." (inclui os 29 idiomas, a direção da escrita do árabe e do hebraico, os sitemaps
de cada idioma, os 301 e os 410 da Central e o instalador do Windows). Depois, no navegador: `/` leva ao idioma certo, a troca de idioma mantém a
página, a Central abre um artigo, `/termos-de-uso/` abre os Termos no idioma do navegador, e o console (F12) não
mostra erro (avisos de `Content-Security-Policy-Report-Only` são anotados para a decisão de ativar a CSP).
O logo dos e-mails abre como imagem: `https://appobrafacil.expertbr.com/email/logo-obrafacil.png` (352 × 78, PNG).

## Avisar o Google (Search Console, propriedade do domínio expertbr.com)

Só na primeira publicação com as páginas prontas, e depois quando o sitemap mudar muito (a publicação dos 29 idiomas
é uma dessas: no passo 1, envie de novo o mesmo `/sitemap.xml`, que agora é o índice dos sitemaps de cada idioma; o
Google lê os 29 sozinho). Os endereços com 410 aparecem em **Páginas** como "Não encontrada (404)": é o esperado,
não precisa validar.

1. **Sitemaps** (menu da esquerda) → "Adicionar um novo sitemap" → `https://appobrafacil.expertbr.com/sitemap.xml`
   → Enviar. Em alguns minutos o status fica "Processado com sucesso", com o número de páginas encontradas.
2. **Páginas** (Indexação) → abrir o motivo "Cópia, o Google e o usuário selecionaram uma página canônica
   diferente" → **Validar correção**. A validação leva dias ou semanas; o Search Console avisa por e-mail.
   Faça o mesmo em "Erro soft 404". "Página com redirecionamento" é normal e esperado para `/`, `/termos-de-uso/`,
   `/perfil` etc.: não precisa validar. O que é esperado nessa lista de "cópia" e **não é erro**: os artigos em
   en-GB, en-AU e en-CA (o texto é quase igual ao en-US; o Google guarda um só e, pelo hreflang, mostra a cada país o
   endereço dele). A validação desse motivo pode terminar em "Falha" só por causa deles.
3. **Inspeção de URL** (barra do topo) em 2 ou 3 endereços, um de cada vez:
   `https://appobrafacil.expertbr.com/pt-br/`, `https://appobrafacil.expertbr.com/en-us/help` e um artigo
   (ex.: `https://appobrafacil.expertbr.com/pt-br/ajuda/criar-rdo`). Clique em **Testar URL publicado** e confira:
   "URL disponível para o Google", "Canônico declarado pelo usuário" igual ao próprio endereço, e em
   "Ver página testada" → HTML com o texto da página. Se estiver tudo certo, **Solicitar indexação**.
4. Opcional, para o Bing (que alimenta o Copilot e parte das buscas do ChatGPT): no Bing Webmaster Tools, importar
   o site do Search Console e enviar o mesmo sitemap.

## Voltar atrás

Enviar o `.htaccess` guardado e reenviar o `dist` do commit anterior (`git switch --detach <commit>`, `npm ci`,
`npm run build`, `npm run pacote -- D:\Projetos\pacotes_site --fora-da-main`), na mesma ordem do envio normal (extrair
por cima e apagar só o que a lista `_apagar.txt` mandar). Depois, `git switch main`.
