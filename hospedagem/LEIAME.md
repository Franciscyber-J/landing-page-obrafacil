# Hospedagem (Hostinger) — appobrafacil.expertbr.com

A pasta `public_html/appobrafacil` tem duas coisas juntas:

- o **site** (React): `index.html`, `assets/`, imagens; é o que o `npm run build` gera em `dist/`;
- o **WordPress**, que ainda serve **Termos de Uso**, **Política de Privacidade** e **Suporte**
  (`/termos-de-uso/`, `/politicas-de-privacidade/`, `/suporte/`), usados pelo app e pelas lojas.

| Arquivo aqui | Vai para |
| --- | --- |
| `.htaccess` | `public_html/appobrafacil/.htaccess` (substitui o atual inteiro) |
| `wordpress/mu-plugins/obrafacil-seguranca.php` | `public_html/appobrafacil/wp-content/mu-plugins/obrafacil-seguranca.php` |
| `verificar.mjs` | não vai para o servidor: roda no computador e confere o site no ar |

## O que o `.htaccess` faz

- **Links do site abrem direto.** Antes, abrir `/ajuda` pelo link ou apertar F5 caía na página
  "não encontrada" do WordPress. Agora qualquer endereço do site (o antigo `/ajuda` e os novos com idioma,
  `/pt-br/...`, `/en-us/...`) abre o `index.html`. Os endereços do WordPress continuam iguais.
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
5. Abra o site, a Central, Termos, Privacidade e Suporte no navegador; entre no WordPress (`/wp-admin`) e
   confira que o editor abre normalmente.
6. Com o site aberto, aperte F12 → Console: avisos "Content-Security-Policy-Report-Only" mostram o que a
   política bloquearia. Mande para o Claude ajustar antes de ativar de verdade.

Se o site ou o WordPress der erro 500 depois do passo 2: suba de volta o backup do passo 1.

## Ainda no WordPress (só você)

- Senha do administrador longa e única, e verificação em duas etapas no login.
- Manter WordPress, Elementor e Site Kit atualizados (o hPanel atualiza o WordPress sozinho).
- Plano: levar Termos, Privacidade e Suporte para dentro do site (traduzidos, com endereço em cada idioma) e
  então apagar o WordPress, com redirecionamento dos endereços antigos.
