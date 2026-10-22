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
   páginas prontas são feitas a partir do que está publicado lá.

## Gerar

```powershell
cd D:\Projetos\landing_page
git switch main
git pull
npm ci
npm test
npm run lint
npm run build
```

O `npm run build` faz tudo: confere os idiomas, gera o site, desenha as páginas prontas de cada idioma (lendo a
Central e os Termos no Firestore, só leitura) e grava `sitemap.xml`, `robots.txt` e `llms.txt`. No fim ele confere
todas as páginas e para com erro se alguma estiver errada.

- Tem que terminar com `Conferência: ... página(s) pronta(s) sem problema.` e sem nenhuma linha `AVISO`.
- `AVISO: Central de Ajuda sem páginas prontas` ou `AVISO: Termos e Política sem páginas prontas` = o computador não
  conseguiu ler o Firestore (internet). **Não publique**: rode `npm run build` de novo com internet. Publicar assim
  tira os artigos do sitemap e deixa no servidor as páginas antigas deles.
- O `gerar_site.bat` precisa rodar `npm run build` (e não `vite build` direto); senão as páginas prontas, o
  sitemap, o robots.txt e o llms.txt não são gerados.

## Enviar

1. Só se `hospedagem/.htaccess` mudou: baixar antes o `.htaccess` atual para o computador (é a volta) e enviar o novo.
2. Apagar no servidor as pastas dos idiomas (`pt-br`, `pt-pt`, `en-us`, `en-gb`, `en-au`, `en-ca`, `es-es`, `es-mx`)
   e a pasta `dados`. Elas só têm páginas geradas, e o build novo traz todas de novo; assim não sobra página de
   artigo que saiu da Central. Nunca apagar `download/` (instalador do Windows), `email/` nem o `.htaccess`.
3. Enviar **o conteúdo** de `dist` (não a pasta), substituindo: as pastas dos idiomas, `dados/`, `index.html`,
   `assets/`, `bandeiras/`, `telas/`, `email/` (o logo dos e-mails do app: nunca muda de nome nem sai do ar),
   imagens, `tema.js`, `tag-google.js`, `robots.txt`, `sitemap.xml` e `llms.txt`. A pasta `dist-ssr` não vai.
   No Gerenciador de Arquivos, o mais rápido é compactar o conteúdo de `dist` num zip (fora da pasta do projeto),
   enviar o zip para `public_html/appobrafacil`, extrair lá e apagar o zip do servidor.

## Conferir no ar

```powershell
node hospedagem/verificar.mjs
```

Tem que terminar com "Tudo certo.". Depois, no navegador: `/` leva ao idioma certo, a troca de idioma mantém a
página, a Central abre um artigo, `/termos-de-uso/` abre os Termos no idioma do navegador, e o console (F12) não
mostra erro (avisos de `Content-Security-Policy-Report-Only` são anotados para a decisão de ativar a CSP).
O logo dos e-mails abre como imagem: `https://appobrafacil.expertbr.com/email/logo-obrafacil.png` (352 × 78, PNG).

## Avisar o Google (Search Console, propriedade do domínio expertbr.com)

Só na primeira publicação com as páginas prontas, e depois quando o sitemap mudar muito:

1. **Sitemaps** (menu da esquerda) → "Adicionar um novo sitemap" → `https://appobrafacil.expertbr.com/sitemap.xml`
   → Enviar. Em alguns minutos o status fica "Processado com sucesso", com o número de páginas encontradas.
2. **Páginas** (Indexação) → abrir o motivo "Cópia, o Google e o usuário selecionaram uma página canônica
   diferente" → **Validar correção**. A validação leva dias ou semanas; o Search Console avisa por e-mail.
   Faça o mesmo nos outros motivos que citam endereços antigos ("Página com redirecionamento" é normal e esperado
   para `/`, `/termos-de-uso/`, `/perfil` etc.: não precisa validar).
3. **Inspeção de URL** (barra do topo) em 2 ou 3 endereços, um de cada vez:
   `https://appobrafacil.expertbr.com/pt-br/`, `https://appobrafacil.expertbr.com/en-us/help` e um artigo
   (ex.: `https://appobrafacil.expertbr.com/pt-br/ajuda/criar-rdo`). Clique em **Testar URL publicado** e confira:
   "URL disponível para o Google", "Canônico declarado pelo usuário" igual ao próprio endereço, e em
   "Ver página testada" → HTML com o texto da página. Se estiver tudo certo, **Solicitar indexação**.
4. Opcional, para o Bing (que alimenta o Copilot e parte das buscas do ChatGPT): no Bing Webmaster Tools, importar
   o site do Search Console e enviar o mesmo sitemap.

## Voltar atrás

Enviar o `.htaccess` guardado e reenviar o `dist` do commit anterior (`git switch --detach <commit>`, `npm ci`,
`npm run build`), apagando antes as pastas dos idiomas e `dados` como no envio normal.
