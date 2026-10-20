# Hospedagem (Hostinger) — appobrafacil.expertbr.com

A pasta `public_html/appobrafacil` tem duas coisas juntas:

- o **site** (React): `index.html`, `assets/`, imagens; é o que o `npm run build` gera em `dist/`;
- o **WordPress**, que **não serve mais nada que o app, as lojas ou a Stripe usem** (ver "O que o WordPress
  ainda serve", abaixo).

| Arquivo aqui | Vai para |
| --- | --- |
| `.htaccess` | `public_html/appobrafacil/.htaccess` (substitui o atual inteiro) |
| `wordpress/mu-plugins/obrafacil-seguranca.php` | `public_html/appobrafacil/wp-content/mu-plugins/obrafacil-seguranca.php` |
| `verificar.mjs` | não vai para o servidor: roda no computador e confere o site no ar |

## Endereços antigos que passaram para o site

Estão no app, nas lojas, nas sessões de pagamento da Stripe, num Payment Link e em e-mails já enviados, e não
podem mudar. Todos abrem o site, que leva à página no idioma da pessoa:

| Endereço antigo | Quem usa | Vai para (exemplo em pt-BR) |
| --- | --- | --- |
| `/termos-de-uso/`, `/politicas-de-privacidade/` | App Store, Google Play, app | `/pt-br/termos-de-uso` (redirecionamento 302 pelo `.htaccess`, idioma do navegador) |
| `/primeiros-passos` | volta do PRO pago pelo site, prêmio do Primeiros passos, Payment Link | `/pt-br/pagamento-confirmado/pro` |
| `/pagamento-ok/` | volta do Acesso Cliente da obra | `/pt-br/pagamento-confirmado/acesso-cliente` |
| `/pacote-downloads-extras/` | volta do pacote de downloads extras | `/pt-br/pagamento-confirmado/downloads-extras` |
| `/expansao-20gb-ok/` | volta da expansão de +20 GB | `/pt-br/pagamento-confirmado/mais-20-gb` |
| `/perfil` | e-mails de pagamento não processado | `/pt-br/perfil` |
| `/suporte/` | rodapé do site, links antigos | `/pt-br/suporte` |

Os seis últimos (com e sem barra no fim) recebem o `index.html` do site pela regra do `.htaccess` que fica antes do
WordPress; o próprio site escolhe o idioma (o escolhido no menu; senão, o do navegador) e troca o endereço. O que vem
depois do `?` na volta do pagamento e no `/perfil` é descartado (pode ser o identificador da sessão da Stripe).
As páginas de pagamento e do Perfil têm `noindex` (não vão para o Google); o Suporte pode ir.

## O que o WordPress ainda serve

Nada que o app use. Continuam lá só o painel (`/wp-admin`, `/wp-login.php`), as páginas antigas que ninguém mais
abre e a página 404 dele para endereços que não existem no site.

Para desligar o WordPress de vez (só você, depois de publicar esta versão e rodar o verificador sem falhas):

1. Conferir no painel do WordPress se há alguma página, formulário ou plugin ainda usado por alguém (ex.: um
   código de conversão do Google Ads nas antigas páginas de pagamento; se havia, ele precisa ser refeito no site).
2. Fazer o backup completo do WordPress (arquivos e banco) e guardar fora da Hostinger.
3. Apagar os arquivos do WordPress de `public_html/appobrafacil` (`wp-admin/`, `wp-content/`, `wp-includes/`,
   `wp-*.php`, `index.php`, `xmlrpc.php`, `readme.html`, `license.txt`) e o banco de dados dele no hPanel.
   Nunca apagar os arquivos do site (tudo o que vem do `dist`: `index.html`, `assets/`, `bandeiras/`, `telas/`,
   `tema.js`, `tag-google.js`, imagens, as pastas dos idiomas), a pasta `download/` (instalador do Windows) nem
   o `.htaccess`.
4. Pedir ao Claude o `.htaccess` sem os blocos do WordPress (segurança do WordPress, `LSCACHE` e `WordPress`) e
   sem as conferências do WordPress no `verificar.mjs`.
5. Desativar o plugin LiteSpeed Cache não é preciso: ele some com o WordPress.

## O que o `.htaccess` faz

- **Links do site abrem direto.** Antes, abrir `/ajuda` pelo link ou apertar F5 caía na página
  "não encontrada" do WordPress. Agora qualquer endereço do site (o antigo `/ajuda` e os novos com idioma,
  `/pt-br/...`, `/en-us/...`) abre o `index.html`.
- **Endereços antigos do WordPress usados pelo app abrem o site** (tabela acima), antes das regras do WordPress.
- **Cabeçalhos de segurança** em tudo: HTTPS obrigatório no navegador (HSTS), proibição de abrir o site dentro
  de outro site, `nosniff`, política de referência e de permissões; esconde a versão do PHP.
- **WordPress fechado**: bloqueia `xmlrpc.php` (teste de senhas em massa), `readme.html`/`license.txt`
  (entregam a versão), `wp-config.php` direto, PHP dentro de uploads, arquivos de backup e a lista de usuários
  (que hoje mostra o seu login de administrador).
- **Política de conteúdo (CSP) do site em modo de teste**: só avisa no console do navegador, não bloqueia nada.
  Depois de conferir que o site, o Google Ads e a Central funcionam sem aviso, troque
  `Content-Security-Policy-Report-Only` por `Content-Security-Policy`.
- `index.html` sem cache, para cada build novo aparecer na hora.

## O que o `obrafacil-seguranca.php` faz

Fica em `wp-content/mu-plugins/` (pasta de plugins "obrigatórios": sempre ativos, não dá para desativar
sem querer). Desliga o XML-RPC, esconde a lista de usuários da API para quem não está logado (o
`.htaccess` sozinho é contornável com um cookie falso), tira a página de autor e o mapa de usuários,
deixa a mensagem de login igual para usuário e senha errados e tira a versão do WordPress do HTML.

## Como aplicar (Gerenciador de Arquivos da Hostinger)

1. Baixe o `.htaccess` atual de `public_html/appobrafacil` para o seu computador (fora da pasta do projeto).
   É o backup: se algo der errado, é só subir ele de volta.
2. Suba o `.htaccess` desta pasta para `public_html/appobrafacil`, substituindo o atual.
3. Em `public_html/appobrafacil/wp-content`, crie a pasta `mu-plugins` (se não existir) e suba
   `obrafacil-seguranca.php` para dentro dela.
4. No computador, na pasta `landing_page`: `node hospedagem/verificar.mjs`. Tem que terminar com "Tudo certo.".
5. Abra o site, a Central, Termos, Privacidade e Suporte no navegador, e os endereços antigos da tabela acima
   (cada um precisa abrir a página do site no seu idioma); entre no WordPress (`/wp-admin`) e confira que o
   painel abre normalmente.
6. Com o site aberto, aperte F12 → Console: avisos "Content-Security-Policy-Report-Only" mostram o que a
   política bloquearia. Mande para o Claude ajustar antes de ativar de verdade.

Se o site ou o WordPress der erro 500 depois do passo 2: suba de volta o backup do passo 1.

## Ainda no WordPress (só você)

- Senha do administrador longa e única, e verificação em duas etapas no login.
- Manter WordPress, Elementor e Site Kit atualizados (o hPanel atualiza o WordPress sozinho).
- Termos, Privacidade, Suporte, Perfil e as páginas de pagamento já estão no site, com endereço em cada idioma.
  Falta só desligar o WordPress (passos em "O que o WordPress ainda serve").
