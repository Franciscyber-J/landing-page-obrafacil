# AGENTS.md — Site do ObraFácil (landing-page-obrafacil)

Regras permanentes para qualquer agente de código que trabalhe nesta pasta. Valem para toda tarefa, mesmo quando a tarefa não as repete.

## Projeto

- Site de vendas e Central de Ajuda do ObraFácil: Vite + React + react-router + i18next. No ar em `https://appobrafacil.expertbr.com` (Hostinger). O build grava uma página pronta (texto no HTML, para o Google e os buscadores com IA) de cada endereço público em cada idioma, mais `sitemap.xml`, `robots.txt` e `llms.txt` (`ferramentas/paginas/`, `src/seo/`). O WordPress foi desligado; os endereços antigos dele (lojas, Stripe, e-mails) levam às páginas do site pelo `.htaccess`.
- A Central de Ajuda só lê os artigos publicados no Firestore (o conteúdo nasce no repositório `gestao_obras`, em `ajuda/`).
- Dono: Francis. Ele aprova, faz merge e publica. O Claude escreve as especificações, revisa e também trabalha direto nesta pasta (cria a branch da tarefa e faz commit nela).
- Responda sempre em português do Brasil.

## Git

- Uma tarefa por branch, com o nome indicado na tarefa (letras minúsculas, números e hífen, sem barra).
- Pode fazer commits na própria branch. Nunca faz merge, rebase da `main`, push, nem commit na `main`.
- Nunca reescreve histórico (`reset --hard`, `push --force`, `commit --amend` em commit que não é seu).
- Não mexe em arquivos fora do escopo da tarefa. Se achar outro problema, anota no relatório e não corrige.
- A pasta `.agents/skills/superpowers` é do Francis: não altere nem faça commit dela.

## Proibido

- Enviar arquivos para a Hostinger, publicar no Firestore ou rodar qualquer coisa contra produção.
- Ler, exibir, copiar ou criar credencial: `.env*`, chaves, JSON de conta de serviço.
- Escrever chave, senha ou token no código.
- Carregar script, fonte ou imagem de site de terceiros novo (a política de segurança do `.htaccess` lista o que é permitido).

## Revisão obrigatória

`hospedagem/` (`.htaccess`, verificador), `src/i18n/registro.js` e `ferramentas/` não são editados pelo agente por conta própria: a mudança vem pronta do Claude. Só a tarefa que autoriza expressamente permite tocar nesses arquivos.

## Código

- Texto visível nunca é fixo no componente: sempre chave de tradução. Os idiomas seguem `src/i18n/LEIAME.md`:
  - idioma-base com o arquivo completo; variante regional (pt-PT, en-GB, en-AU, en-CA, es-MX) só com o que muda;
  - chave nova entra primeiro no `src/i18n/textos/pt-BR.json` e nos outros idiomas-base;
  - `npm run idiomas` precisa terminar sem erros (ele também roda antes do build).
- Endereços de página sempre pelas funções de `src/i18n/idiomas.js` e `src/ajuda/enderecos.js` (`caminhoInicio`, `caminhoAjuda`, `rotas.artigo`...), nunca montados à mão: cada idioma tem as próprias palavras no endereço.
- As páginas são desenhadas também no build (páginas prontas) e depois "hidratadas" no navegador: o primeiro desenho de um componente não pode depender do navegador (`window`, `localStorage`, aparelho, tema, data de hoje). Use os ganchos de `src/useNavegador.js` (`useMontado`, `useLinkComecar`) ou o CSS, e confira com `npm run build` e o console sem erro de hidratação. Animação de entrada não esconde o que já está na tela (`jaApareceu`, `src/movimento/index.js`).
- Toda tela funciona em tema claro e escuro, com as cores de `src/styles/design-tokens.css`, e no celular (390 px) sem rolagem para o lado.
- O texto dos artigos é lido por `src/ajuda/texto.js` (só negrito, lista e link para artigo); nunca usar `dangerouslySetInnerHTML` com conteúdo publicado.
- Nada de solução paliativa: se a especificação não resolve o caso por completo, parar e relatar.

## Idiomas novos

- O checklist de tudo o que muda quando um idioma entra fica no gestao_obras: `docs/CHECKLIST_IDIOMAS_NOVOS.md`
  (itens do site com o prefixo `site:`). Toda tarefa que mexe em algo que depende do idioma (registro, textos,
  endereços, moeda, fonte, `.htaccess`, telas por idioma) atualiza esse arquivo, e o relatório diz o que mudou nele.

## Conferência antes de entregar

`npm test`, `npm run idiomas`, `npm run lint` e `npm run build`, todos sem erro.

## Relatório ao fim de cada tarefa

1. Branch e lista de commits.
2. Arquivos alterados, uma linha por arquivo.
3. Comandos rodados e resultado.
4. O que ficou de fora ou divergiu da especificação, e por quê.
5. O que o Francis precisa fazer para publicar (na ordem). Nunca rode nenhum desses passos.
6. O comando para gerar o diff: `git diff main...<branch> --output=..\diff_<branch>.txt`.
