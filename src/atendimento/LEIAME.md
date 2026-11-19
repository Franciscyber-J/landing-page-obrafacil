# Atendimento do site (WhatsApp e conversa com o Max)

Decisão do Francis (18/11/2026): onde o WhatsApp é o canal do país, o site mostra o WhatsApp; onde não é, a conversa
com o Max no próprio site. Contrato com o servidor: `gestao_obras/docs/agencia_ia/ATENDIMENTO_CHAT.md`.

**Conversa desligada enquanto o App Check do site não estiver preenchido** em `configuracao.js` (`appId` e
`recaptchaEnterprise`): aí todos os países ficam com o WhatsApp, como o site era antes, e nada do Firebase, do mapa
dos fusos nem dos grupos é baixado (só o número do WhatsApp). O site nunca chama o servidor sem o App Check.

| Grupo | O que aparece (com a conversa ligada) |
| --- | --- |
| `so_whatsapp` | Só o WhatsApp (como sempre foi): botão flutuante, rodapé, perguntas frequentes, chamada final, Suporte e Central |
| `os_dois` | Os dois: o botão flutuante abre a conversa, e o painel oferece também o WhatsApp; nos outros lugares, os dois botões |
| `so_chat` | Só a conversa com o Max; nenhum link do WhatsApp na página |

## Como o site escolhe

1. **Página pronta e primeiro desenho:** o grupo do país do idioma da página (bandeira do `registro.js`), pelos valores
   iniciais (`grupoDaPagina`). `/pt-br/` nasce com o WhatsApp e `/ja-jp/` com a conversa, sem erro de hidratação.
2. **Depois de a página abrir** (`estado.js`): o país pelo fuso horário do navegador (`fusos.js`, gerado do banco de
   fusos da IANA por `ferramentas/atendimento/fusos.mjs`); só quando o fuso não diz o país (Etc/UTC), a região do idioma
   do navegador; sem nada, o grupo padrão (`os_dois`). Nada de localizar pela internet.
3. Os grupos e o número do WhatsApp vêm dos documentos públicos `configuracoes/atendimento_paises` e
   `configuracoes/suporte_publico` (só o campo `whatsapp`; o Francis muda no painel, sem versão nova do site). Leitura pela API pública do Firestore,
   sem SDK, quando o navegador está livre, guardada no navegador por 12 horas. Sem os documentos, ou se a leitura
   falhar, valem os valores iniciais de `grupos.js` (os mesmos do servidor e do app).

## A conversa

- `components/atendimento/Atendimento.jsx`: botão flutuante e o painel, que só é baixado quando a pessoa abre a conversa.
- `components/atendimento/Painel.jsx`: o painel (mensagens, campo, "Max está digitando", avisos). Janela não modal,
  Esc fecha, o foco volta para quem abriu; leitor de tela lê as mensagens novas e os avisos.
- `conversa.js`: as regras, sem React nem Firebase (1 a 1000 caracteres, uma mensagem por vez, a mesma mensagem não sai
  de novo em 10 minutos, erro devolve o texto para o campo, os motivos do servidor).
- `servidor.js`: o Firebase (App Check, login anônimo e a function `maxChatSite`), baixado só com o painel. Tudo
  acontece só no envio da primeira mensagem, nesta ordem: token do App Check (reCAPTCHA Enterprise; sem token, para
  ali), login anônimo, function. Escrever no campo só baixa o código.
- `configuracao.js`: o único lugar com a configuração pública do site no Firebase (chave de API, `appId` do app web do
  site e a chave do reCAPTCHA Enterprise).
- `resposta.js`: a resposta do Max (formato do WhatsApp: `*negrito*`, listas, endereços) em blocos de texto. Nada vira
  HTML; endereço vira link só se for do site, do app ou da página do ObraFácil nas lojas, sempre https.
- As mensagens ficam só na memória da página (recarregar começa outra conversa na tela; o servidor guarda a conversa
  por 90 dias). Nada da conversa vai para o localStorage, o console ou o analytics.

## Testar sem a function publicada

`VITE_ATENDIMENTO_SIMULADO=sim npm run dev` usa o servidor simulado (`simulado.js`): palavras na mensagem mudam a
resposta (`limite`, `desligado`, `teto`, `ocupada`, `whatsapp`, `erro`, `rede`, `lento`). O simulado nunca entra no
build. Os testes (`atendimento.test.js`) usam o mesmo simulado.

## Ligar a conversa (App Check com reCAPTCHA Enterprise)

O Firebase recomenda o reCAPTCHA Enterprise para integrações novas. Até 10 mil avaliações por mês não têm custo; o site
pede o token só no envio, sem renovação automática, e com o token valendo 1 dia gasta cerca de uma avaliação por
visitante que conversa, por dia. Acima disso, o Google Cloud cobra por avaliação.

1. **App web do site.** Console do Firebase > ⚙ Configurações do projeto > Geral > Seus apps > Adicionar app > Web
   (`</>`). Apelido: `Site ObraFácil`. Não marque o Firebase Hosting. Registrar. Copie o `appId`
   (`1:1030083935852:web:…`).
2. **Chave do reCAPTCHA Enterprise.** Console do Google Cloud, projeto `gestao-obras-app-8342c` > Segurança >
   reCAPTCHA (ative a API se ele pedir) > Criar chave. Nome: `Site ObraFácil App Check`. Tipo: **Site** (Web). Domínio:
   `appobrafacil.expertbr.com`. **Não** marque "Usar desafio de caixa de seleção" (o App Check só aceita a chave por
   pontuação, invisível). Criar. Copie o ID da chave.
3. **Registrar no App Check.** Console do Firebase > App Check > Apps > `Site ObraFácil` > reCAPTCHA Enterprise > cole
   o ID da chave. Em "Tempo de vida do token", ponha **1 dia**. Salvar.
4. Mande o `appId` e o ID da chave para o Claude: eles entram em `configuracao.js` (`appId` e `recaptchaEnterprise`),
   com a conferência e o build.
5. Publique o site e teste uma conversa. Só depois disso ligue `exigir_app_check_site: true` no documento
   `ia_config/max` (o servidor passa a recusar quem chega sem o App Check).

A política de conteúdo do `.htaccess` já libera o reCAPTCHA e o App Check (`hospedagem/LEIAME.md`). O selo flutuante do
reCAPTCHA fica escondido; o painel mostra no lugar o aviso que o Google pede, com os links das regras dele.

## Chave de API do site

A chave de navegador que está em `configuracao.js` é a mesma do app web e do app do Windows. **Não ponha restrição de
site nela**: o app do Windows não manda endereço de site e pararia de funcionar. O certo é uma chave só do site:

1. Console do Google Cloud, projeto `gestao-obras-app-8342c` > APIs e serviços > Credenciais > Criar credenciais >
   Chave de API. Nome: `Site ObraFácil (navegador)`.
2. Restrições do aplicativo: **Sites** > Adicionar: `https://appobrafacil.expertbr.com/*`.
3. Restrições de API: **Restringir chave** e marque só: **Identity Toolkit API** (login anônimo), **Token Service API**
   (renovar o login) e **Firebase App Check API** (token do App Check). A function e a leitura do Firestore do site
   não usam a chave. Salvar.
4. Mande a chave nova para o Claude: ela entra em `configuracao.js` (`apiKey`). Publique o site e teste uma conversa.
