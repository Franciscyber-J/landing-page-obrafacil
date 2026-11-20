# Publicar o site da ExpertBR no expertbr.com (troca do WordPress)

Preparado em 20/11/2026. **Nada disto foi executado.** Quem executa: o Claude, pelo conector da Hostinger e pelo
navegador, pedindo no chat o "sim" do Francis a cada passo que muda o servidor (autorização do Francis de 20/11,
07h34, para esta troca), ou o Francis pelo hPanel. Os passos que só leem não precisam de "sim".

## Como está hoje (lido pelo conector em 20/11/2026)

- Conta `u719958343`, site `expertbr.com`, pasta `/home/u719958343/domains/expertbr.com/public_html`.
- Ali está um WordPress (instalação `19954195`, título "EXPERTBR", desde 18/04/2025), com ofertas que não existem
  mais ("30 dias grátis", "Plano Fundador R$ 49,95").
- **`public_html/appobrafacil/` é o site do ObraFácil** (o subdomínio `appobrafacil.expertbr.com` aponta para essa
  pasta). É o único subdomínio do site. **Não pode ser tocado em nenhum passo.**
- `public_html/.private/` é da Hostinger: fica.
- SSL ativo (vitalício), "forçar HTTPS" ligado, CDN da Hostinger ligada, cache do servidor desligado.
- O `.htaccess` de hoje tem o bloco do plugin LiteSpeed Cache e o do WordPress. O ObraFácil não usa nada dele (a
  pasta dele tem o próprio `.htaccess`, e as respostas dele não passam pelo cache do LiteSpeed:
  `x-hcdn-cache-status: DYNAMIC`, sem `x-litespeed-cache`).

## Nunca usar no expertbr.com

Estes caminhos **apagam ou trocam a `public_html` inteira, com a pasta do ObraFácil dentro**:

- `hostinger up` (CLI), deploy pelo Git (`hosting_deploy`), "Importar site de arquivo" do hPanel;
- "Excluir site" do hPanel (`hosting_websites_delete`);
- "Desinstalar WordPress" com "apagar arquivos" (`wordpress_installations_delete` com `delete_files`).

Os arquivos do WordPress saem **movidos** (Gerenciador de Arquivos), nunca apagados nesta troca.

## 0. Antes (no computador do Francis, pasta do site)

1. Merge da branch `site-expertbr` na `main` (com o "sim" do Francis: tem código).
2. Um comando por vez, no PowerShell:

```powershell
cd D:\Projetos\landing_page
git switch main
git pull
npm ci
npm test
npm run expertbr:build
npm run expertbr:pacote -- D:\Projetos\pacotes_site
```

- `npm test` tem que terminar com `# fail 0`; o `expertbr:build`, com `ExpertBR: 29 página(s) pronta(s) ... conferência
  sem problema.`
- O pacote grava `D:\Projetos\pacotes_site\site_expertbr_<data>_<commit>.zip` (o conteúdo de `sites/expertbr/dist`,
  sem a pasta `appobrafacil`, que ele recusa) e, ao lado, `site_expertbr_<data>_<commit>.htaccess` (o `.htaccess` novo).

## 1. Endereços do WordPress que têm visitas (só leitura, antes de desligar)

O `.htaccess` novo já leva para o lugar certo: o artigo "O Fim da Desorganização..." (qualquer endereço que comece
com `o-fim-da-desorganiza`, com ou sem data na frente, e o `?p=<número>`) para a página do ObraFácil em português;
termos, privacidade, suporte e volta do pagamento para o mesmo endereço no site do ObraFácil (que escolhe o idioma);
o mapa do site do WordPress para o sitemap novo; painel, login, feeds, API, uploads, busca, categorias e autores com
**410** (removido de vez); e **qualquer outra página do WordPress** (endereço terminado em "/") para o site do
ObraFácil. Mesmo assim, conferir a lista antes de desligar, porque um endereço com visitas pode merecer um destino
melhor (ex.: um artigo sobre diário de obra → o artigo da Central sobre o RDO):

1. Abrir no navegador `https://expertbr.com/wp-sitemap.xml` (e `https://expertbr.com/sitemap_index.xml`, se o
   primeiro não existir) e anotar todos os endereços de posts e páginas. Guardar a lista em
   `D:\Projetos\backups_expertbr\enderecos_wordpress.txt`.
2. Search Console (propriedade de domínio `expertbr.com`) → **Desempenho** → aba **Páginas**, últimos 16 meses,
   filtro "URL que começa com" `https://expertbr.com/`. Anotar as que têm clique ou impressão.
3. Para cada endereço: confere com a regra que pega ele (seção 3 do `.htaccess`). Se algum pedir destino
   diferente, a regra própria entra no `sites/expertbr/hospedagem/.htaccess` antes da regra "3e", com teste no
   `verificar.mjs`, e o pacote é refeito (passo 0). Anotar no `gestao_obras/docs/ONDE_ESTAMOS.md` o que foi achado.

## 2. Fotografia do ObraFácil (só leitura)

```powershell
node sites/expertbr/ferramentas/verificar.mjs --fotografar-obrafacil D:\Projetos\pacotes_site\obrafacil_antes.json
```

Guarda como o `appobrafacil.expertbr.com` responde agora (18 endereços: páginas, raiz, endereços antigos, arquivos,
404). No passo 6 a mesma lista é pedida de novo e qualquer diferença aparece.

## 3. Cópia guardada do WordPress (arquivos e banco) — antes de qualquer mudança

Tudo em `D:\Projetos\backups_expertbr\wordpress_20261120\` (fora do projeto; nunca no GitHub: o `wp-config.php`
tem a senha do banco).

1. **`.htaccess` de hoje:** baixar `public_html/.htaccess` (Gerenciador de Arquivos → botão direito → Download) e
   guardar como `htaccess_wordpress.txt`. É a volta mais rápida.
2. **Arquivos:** hPanel → Sites → expertbr.com → Gerenciador de Arquivos → `public_html`. Selecionar **só** os itens
   da lista "O que sai" (abaixo), botão direito → **Compactar** → `wordpress_arquivos_20261120.zip`. Baixar o zip e
   conferir no computador que ele abre e tem `wp-content\uploads`. Depois apagar o zip do servidor.
3. **Banco de dados:** hPanel → Bancos de dados → Gerenciamento → o banco do WordPress (é o único ligado ao
   expertbr.com; o hPanel mostra qual está em uso em "WordPress → Visão geral") → **phpMyAdmin** → Exportar →
   Rápido, formato SQL → Executar. Guardar o `.sql` e conferir que ele tem `CREATE TABLE` das tabelas `..._posts`.
   (O Claude não abre o `wp-config.php`: o nome do banco vem do hPanel.)
4. **Cópia da Hostinger:** hPanel → Sites → expertbr.com → Arquivos → **Backups** → "Gerar novo backup" (é a cópia
   completa do lado da Hostinger, além das duas acima). Esperar terminar.

Só segue com as quatro cópias conferidas.

## 4. O que sai e o que entra

**O que sai de `public_html`** (movido, não apagado, para `/home/u719958343/domains/expertbr.com/wordpress_desligado_20261120/`,
fora da `public_html`, onde ninguém abre pela internet): `.htaccess.bk`, `default.php`, `index.php`, `license.txt`,
`readme.html`, `wp-activate.php`, `wp-admin/`, `wp-blog-header.php`, `wp-cache.php`, `wp-comments-post.php`,
`wp-config.php`, `wp-config-sample.php`, `wp-content/`, `wp-cron.php`, `wp-includes/`, `wp-links-opml.php`,
`wp-load.php`, `wp-login.php`, `wp-mail.php`, `wp-settings.php`, `wp-signup.php`, `wp-trackback.php`, `xmlrpc.php`.
O `.htaccess` não é movido: é substituído (o antigo já está guardado).

**O que fica, intocado:** `appobrafacil/` (site do ObraFácil) e `.private/` (Hostinger). O banco de dados do
WordPress também fica (sem uso; apagar só depois, com o "sim" do Francis e a cópia do passo 3 guardada).

**O que entra:** o conteúdo do zip do passo 0: as 29 pastas dos idiomas (`pt-br/` ... `he-il/`), `assets/`,
`bandeiras/`, `telas/`, `marcas/`, `index.html`, `tema.js`, `favicon.svg`, `apple-touch-icon.png`, `logo.png`,
`og.png`, `robots.txt`, `sitemap.xml`, `llms.txt`. E o `.htaccess` novo.

## 5. A troca, nesta ordem (sem o site ficar fora do ar)

1. **Enviar e extrair o zip** em `public_html` (Gerenciador de Arquivos → Enviar → botão direito no zip → Extrair,
   ali mesmo). Os arquivos novos convivem com o WordPress: nenhum nome se repete (o WordPress não tem
   `index.html` nem pastas de idioma). A raiz `https://expertbr.com/` pode já passar a abrir a lista de idiomas do
   site novo (que leva ao idioma do navegador), se o servidor preferir o `index.html` ao `index.php`: não é
   problema. Apagar o zip do servidor. Conferir: `appobrafacil/` continua lá, com a mesma
   data.
   Pelo conector, o envio é arquivo por arquivo (`hosting_files_generate-upload-url`, enviando para o caminho de
   cada arquivo dentro de `public_html`); o "Extrair" é do Gerenciador de Arquivos.
2. **Testar antes de trocar:** `https://expertbr.com/pt-br/` já abre o site novo (o WordPress entrega arquivo que
   existe). Olhar no celular e no computador, nos dois temas.
3. **Enviar o `.htaccess` novo** (`site_expertbr_<data>_<commit>.htaccess`, renomeado para `.htaccess`) para
   `public_html`, substituindo o atual. A partir daqui `https://expertbr.com/` leva ao site novo.
   Se aparecer erro 500 (em qualquer endereço do expertbr.com **ou do appobrafacil**): voltar na hora o
   `htaccess_wordpress.txt` do passo 3 e parar.
4. **Mover os arquivos do WordPress** (lista "O que sai") para `wordpress_desligado_20261120/`, fora da `public_html`.
5. **Limpar o cache da CDN** do expertbr.com (hPanel → CDN → Limpar cache; pelo conector, `hosting_cache_clear` com
   `scope: cdn`). Se limpar também o do appobrafacil, não tem problema: ele só busca de novo.

## 6. Conferir no ar

```powershell
node sites/expertbr/ferramentas/verificar.mjs
node sites/expertbr/ferramentas/verificar.mjs --comparar-obrafacil D:\Projetos\pacotes_site\obrafacil_antes.json
node hospedagem/verificar.mjs
```

- O primeiro confere o expertbr.com (29 páginas, raiz pelo idioma, `www`, WordPress que saiu, 410, cabeçalhos de
  segurança e cache, robots, sitemap, llms.txt): **"Tudo certo."**
- O segundo prova que o ObraFácil responde igual a antes: **"Tudo certo."** Qualquer diferença: voltar o
  `.htaccess` do WordPress (passo 7) e mandar a lista para o Claude.
- O terceiro é a conferência completa do site do ObraFácil: **"Tudo certo."**
- No navegador: `https://expertbr.com/` cai no idioma certo; o menu de idiomas troca a página; o botão do tema
  troca claro/escuro; F12 → Console sem erro (a política de segurança vale de verdade aqui: um bloqueio aparece
  como erro).

## 7. Voltar atrás

- **Rápido (minutos):** enviar `htaccess_wordpress.txt` como `public_html/.htaccess` e mover de volta os arquivos de
  `wordpress_desligado_20261120/` para `public_html`. O WordPress volta como era (o banco não foi mexido). As pastas
  novas podem ficar ou sair (`pt-br/` ... `he-il/`, `assets/`, `bandeiras/`, `telas/`, `marcas/` e os arquivos da
  lista "O que entra"); com o `.htaccess` do WordPress, a raiz volta a ser o WordPress.
- **Se faltar arquivo do WordPress:** extrair `wordpress_arquivos_20261120.zip` na `public_html`.
- **Se o banco tiver mudado** (não faz parte deste plano): phpMyAdmin → Importar o `.sql` do passo 3.
- **Último caso:** restaurar o backup da Hostinger do passo 3.4 (hPanel → Backups → arquivos e banco). Atenção: a
  restauração de arquivos da Hostinger é da `public_html` inteira, **com a pasta do ObraFácil**: só usar se o
  ObraFácil não tiver sido publicado depois da cópia, ou republicar o ObraFácil em seguida (skill `publicar-site`).

## 8. Avisar o Google (Search Console, propriedade de domínio expertbr.com)

1. **Sitemaps** → adicionar `https://expertbr.com/sitemap.xml` → Enviar. Se o sitemap antigo do WordPress
   (`/wp-sitemap.xml` ou `/sitemap_index.xml`) estiver na lista, removê-lo (ele agora leva ao novo).
2. **Inspeção de URL** → `https://expertbr.com/pt-br/` → Testar URL publicado → canonical igual ao endereço e o texto
   no HTML → **Solicitar indexação**. O mesmo para `https://expertbr.com/en-us/`.
3. Em **Páginas**, os endereços do WordPress aparecem como "Página com redirecionamento" e "Não encontrada (404)"
   (os 410): é o esperado, não precisa validar.
4. Opcional: Bing Webmaster Tools → importar do Search Console e enviar o mesmo sitemap.

## 9. Depois (registrar)

- `gestao_obras/docs/ONDE_ESTAMOS.md`: a troca feita, com a data, onde estão as cópias e o resultado das três
  conferências.
- Em 30 dias sem problema: o Francis decide apagar `wordpress_desligado_20261120/` e o banco do WordPress (as cópias
  do passo 3 continuam guardadas no computador).
- A instalação ainda aparece como "WordPress" no hPanel enquanto o banco existir: não clicar em atualizar nem
  reinstalar por lá.
