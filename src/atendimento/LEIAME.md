# Atendimento do site (WhatsApp e conversa com o Max)

Decisão do Francis (18/11/2026): onde o WhatsApp é o canal do país, o site mostra o WhatsApp; onde não é, a conversa
com o Max no próprio site. Contrato com o servidor: `gestao_obras/docs/agencia_ia/ATENDIMENTO_CHAT.md`.

| Grupo | O que aparece |
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
   `configuracoes/suporte` (o Francis muda no painel, sem versão nova do site). Leitura pela API pública do Firestore,
   sem SDK, quando o navegador está livre, guardada no navegador por 12 horas. Sem os documentos, ou se a leitura
   falhar, valem os valores iniciais de `grupos.js` (os mesmos do servidor e do app).

## A conversa

- `components/atendimento/Atendimento.jsx`: botão flutuante e o painel, que só é baixado quando a pessoa abre a conversa.
- `components/atendimento/Painel.jsx`: o painel (mensagens, campo, "Max está digitando", avisos). Janela não modal,
  Esc fecha, o foco volta para quem abriu; leitor de tela lê as mensagens novas e os avisos.
- `conversa.js`: as regras, sem React nem Firebase (1 a 1000 caracteres, uma mensagem por vez, a mesma mensagem não sai
  de novo em 10 minutos, erro devolve o texto para o campo, os motivos do servidor).
- `servidor.js`: o Firebase (app, login anônimo e a function `maxChatSite`), baixado só com o painel. O login anônimo
  só acontece quando a pessoa começa a escrever. Só a configuração pública do app web do Firebase está no código.
- `resposta.js`: a resposta do Max (formato do WhatsApp: `*negrito*`, listas, endereços) em blocos de texto. Nada vira
  HTML; endereço vira link só se for do site, do app ou da página do ObraFácil nas lojas, sempre https.
- As mensagens ficam só na memória da página (recarregar começa outra conversa na tela; o servidor guarda a conversa
  por 90 dias). Nada da conversa vai para o localStorage, o console ou o analytics.

## Testar sem a function publicada

`VITE_ATENDIMENTO_SIMULADO=sim npm run dev` usa o servidor simulado (`simulado.js`): palavras na mensagem mudam a
resposta (`limite`, `desligado`, `teto`, `ocupada`, `whatsapp`, `erro`, `rede`, `lento`). O simulado nunca entra no
build. Os testes (`atendimento.test.js`) usam o mesmo simulado.

## App Check

O site ainda não tem o App Check (contrato, item 3). Para ligar: registrar o site no App Check do Firebase com uma chave
reCAPTCHA v3 do domínio `appobrafacil.expertbr.com`, pôr a chave em `RECAPTCHA_V3_DO_SITE` (`servidor.js`), liberar na
política de conteúdo do `.htaccess` o reCAPTCHA (`script-src` e `frame-src` `https://www.google.com` e
`https://www.gstatic.com`; `connect-src` `https://content-firebaseappcheck.googleapis.com`), publicar o site e só
então ligar `exigir_app_check_site` no documento `ia_config/max`.
