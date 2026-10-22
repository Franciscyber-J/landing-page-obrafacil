# Hospedagem (Hostinger) — appobrafacil.expertbr.com

A pasta `public_html/appobrafacil` tem só o **site**: o conteúdo de `dist/` que o `npm run build` gera (páginas
prontas de cada idioma, `index.html`, `assets/`, imagens, `robots.txt`, `sitemap.xml`, `llms.txt`), mais a pasta
`download/` (instalador do Windows, enviado à parte) e o `.htaccess` desta pasta. O WordPress foi desligado: as
páginas que ele servia estão no site, em cada idioma, e os endereços antigos levam a elas.

| Arquivo aqui | Vai para |
| --- | --- |
| `.htaccess` | `public_html/appobrafacil/.htaccess` (substitui o atual inteiro) |
| `verificar.mjs` | não vai para o servidor: roda no computador e confere o site no ar |

## Páginas prontas (Google e buscadores com IA)

O build grava uma página de verdade para cada endereço público, em cada idioma, com o texto já dentro do HTML
(`ferramentas/paginas/gerar.mjs`): início, Central de Ajuda (início, assuntos e artigos), Termos, Política,
Suporte, Perfil e volta do pagamento. Robôs que não rodam JavaScript (GPTBot, ClaudeBot, PerplexityBot) leem
tudo; o Google lê na hora, sem esperar a fila de renderização. Cada página tem título, descrição, `canonical`,
`hreflang` dos 8 idiomas e `x-default`, Open Graph e dados estruturados (aplicativo com os preços do país,
empresa, site, perguntas frequentes, trilha nos artigos). O site, ao abrir, "hidrata" a página (liga os botões)
sem desenhar de novo.

| Endereço | Arquivo no servidor |
| --- | --- |
| `/pt-br/` | `pt-br/index.html` |
| `/pt-br/ajuda` | `pt-br/ajuda.html` |
| `/pt-br/ajuda/criar-rdo` | `pt-br/ajuda/criar-rdo.html` |
| `/pt-br/termos-de-uso` | `pt-br/termos-de-uso.html` |

O `.htaccess` entrega o `.html` sem mudar o endereço. Endereço que não tem página pronta (artigo publicado depois
do último build, nome antigo de um artigo) abre o `index.html` e o site desenha a página no navegador, como antes.

## Um endereço só para cada página

O Search Console avisava "Cópia, o Google e o usuário selecionaram uma página canônica diferente". As causas eram
endereços diferentes com a mesma página: `/` e `/pt-br/`, com e sem barra no fim, maiúsculas, os endereços antigos
do WordPress abrindo o site com 200, e os Termos com `canonical` sem barra num endereço que o servidor mandava para
o com barra. Agora:

| Pedido | Resposta |
| --- | --- |
| `/` | 302 para a página inicial no idioma do navegador (sem idioma conhecido, inglês). 302 porque o destino muda conforme quem abre; a raiz é a `x-default` do `hreflang` |
| `/index.html`, `/pt-br/index.html`, `/pt-br/ajuda.html` | 301 para `/`, `/pt-br/`, `/pt-br/ajuda` |
| `/PT-BR/...` | 301 para `/pt-br/...` |
| `/pt-br` | 301 para `/pt-br/` (só a página inicial do idioma tem barra no fim) |
| `/pt-br/ajuda/`, `/pt-br/termos-de-uso/` | 301 para o mesmo endereço sem a barra |
| `/ajuda`, `/ajuda/pt-BR/criar-rdo` | 301 para `/pt-br/ajuda`, `/pt-br/ajuda/criar-rdo` |

## Endereços antigos do WordPress

Estão no app, nas lojas, nas sessões de pagamento da Stripe, num Payment Link e em e-mails já enviados, e não
podem mudar. Todos respondem **301** para a página no idioma do navegador (cabeçalho `Accept-Language`, mesma
escolha do site). Sem idioma conhecido (o Google não manda nenhum), **pt-BR**: eram páginas em português e o 301
passa o histórico delas para a página nova. A resposta não fica guardada (`Cache-Control: no-cache`,
`Vary: Accept-Language`), então cada pessoa cai no idioma dela.

| Endereço antigo | Quem usa | Vai para (exemplo sem idioma) |
| --- | --- | --- |
| `/termos-de-uso/`, `/politicas-de-privacidade/` | App Store, Google Play, app | `/pt-br/termos-de-uso`, `/pt-br/politica-de-privacidade` |
| `/primeiros-passos` | volta do PRO pago pelo site, prêmio do Primeiros passos, Payment Link | `/pt-br/pagamento-confirmado/pro` |
| `/pagamento-ok/` | volta do Acesso Cliente da obra | `/pt-br/pagamento-confirmado/acesso-cliente` |
| `/pacote-downloads-extras/` | volta do pacote de downloads extras | `/pt-br/pagamento-confirmado/downloads-extras` |
| `/expansao-20gb-ok/` | volta da expansão de +20 GB | `/pt-br/pagamento-confirmado/mais-20-gb` |
| `/perfil` | e-mails de pagamento não processado | `/pt-br/perfil` |
| `/suporte/` | rodapé do site, links antigos | `/pt-br/suporte` |

Com e sem barra no fim, maiúsculas ou não. Na volta do pagamento e no `/perfil`, o que vem depois do `?` é
descartado (pode ser o identificador da sessão da Stripe); no Suporte e nos Termos, o `?utm_...` segue. As páginas
de pagamento e do Perfil têm `noindex` (não vão para o Google nem para o sitemap); o Suporte vai.

As regras de idioma ficam no bloco `ENDEREÇOS POR IDIOMA` do `.htaccess`, gerado por `npm run htaccess` a partir de
`src/i18n/registro.js`. Idioma novo: rode `npm run htaccess` e envie o `.htaccess` (o `npm test` avisa se o bloco
estiver desatualizado).

## robots.txt, sitemap.xml e llms.txt

Gerados no build, na raiz do site:

- `robots.txt`: libera tudo para todos, com linhas próprias para Googlebot, Google-Extended, Bingbot, GPTBot,
  OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot e Perplexity-User, e aponta
  o sitemap. Nada é bloqueado: as páginas que não devem aparecer (pagamento, Perfil) têm `noindex` na própria
  página, e o robô precisa abri-las para ver o aviso.
- `sitemap.xml`: todas as páginas públicas dos 8 idiomas, com as versões de cada idioma (`hreflang`) e a data da
  última mudança (artigos: data da publicação no Firestore).
- `llms.txt`: resumo do ObraFácil para os assistentes de IA (o que é, para quem, recursos, plataformas, planos e
  preços de cada idioma, páginas principais, Central, Termos, Política e contato), em inglês e português.

## O que o `.htaccess` faz

- **Páginas prontas** entregues sem o `.html` e sem barra no fim; o resto do site abre o `index.html`.
- **Um endereço só por página** e **endereços antigos** (tabelas acima).
- **Cabeçalhos de segurança** em tudo: HTTPS obrigatório no navegador (HSTS), proibição de abrir o site dentro de
  outro site, `nosniff`, política de referência e de permissões; esconde a versão do PHP.
- **Política de conteúdo (CSP) em modo de teste**: só avisa no console do navegador, não bloqueia nada. Depois de
  conferir que o site, o Google Ads e a Central funcionam sem aviso, troque `Content-Security-Policy-Report-Only`
  por `Content-Security-Policy`.
- Páginas `.html`, `robots.txt`, `sitemap.xml` e `llms.txt` sem cache longo, para cada build aparecer na hora.
- Bloqueia arquivos de backup e de log.

## Como aplicar (Gerenciador de Arquivos da Hostinger)

Passo a passo completo na skill `publicar-site` (`.claude/skills/publicar-site/SKILL.md`). Em resumo:

1. Baixe o `.htaccess` atual de `public_html/appobrafacil` para o seu computador (fora da pasta do projeto). É a
   volta: se algo der errado, é só subir ele de volta.
2. Suba o `.htaccess` desta pasta, substituindo o atual.
3. No computador, na pasta `landing_page`: `node hospedagem/verificar.mjs`. Tem que terminar com "Tudo certo.".

Se o site der erro 500 depois do passo 2: suba de volta o backup do passo 1 e mande a mensagem de erro para o Claude.

O `.htaccess` foi testado num Apache 2.4 com as mesmas regras. A Hostinger usa LiteSpeed, que lê o mesmo arquivo;
o verificador confere no ar o que o LiteSpeed responde de verdade.
