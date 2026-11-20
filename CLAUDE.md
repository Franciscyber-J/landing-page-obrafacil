# CLAUDE.md — Site do ObraFácil

As regras do projeto ficam no `AGENTS.md` (valem para o Claude e para o Codex). Este arquivo só acrescenta
o que é do Claude.

@AGENTS.md

## Como trabalhar com o Francis

- Ele não é programador e valida tudo cruzando ferramentas. Explique em português simples.
- Trabalho completo e correto, nunca paliativo nem "versão rápida".
- Antes de executar algo que ele não pediu com clareza, explique e espere o OK.
- O Claude pode criar a branch da tarefa, fazer commit nela e enviá-la ao GitHub. Nunca commit, merge nem push na `main`.
- Hostinger (decisão do Francis, 20/11/2026, 07h01): o Claude tem acesso à conta inteira da Hostinger pelo conector oficial (`hostinger@claude-plugins-official`). Consultar (arquivos, painel, saúde do site, registros) é livre. Publicar (o site do ObraFácil, o instalador do Windows, o `.htaccess`, o deploy do Orbit) o Claude faz pedindo no chat o "sim" do Francis a cada publicação, como no deploy do Firebase, guarda antes a cópia do que vai ser trocado e confere no ar depois. DNS, domínios, e-mails, planos, pagamentos e a VPS (Orbit, n8n, Evolution): só quando o Francis pedir aquilo, com o "sim" para cada ação. Nada é apagado sem cópia guardada. A publicação do site segue a skill `publicar-site`.
- Quando ele mesmo for mexer no código: antes o comando `git switch <branch>`; alteração como
  "procure isso → substitua por isso" com o caminho completo do arquivo; arquivo novo como comando PowerShell
  `$p = Join-Path $PWD 'caminho'; [System.IO.File]::WriteAllText($p, @'...'@)`.

## Pastas no computador dele

- `D:\Projetos\landing_page`: este site. O Codex trabalha aqui mesmo (em branch própria).
- `D:\Projetos\gestao_obras`: o app e os artigos da Central (com o próprio `CLAUDE.md`).

## Onde está cada coisa

| Assunto | Arquivo |
| --- | --- |
| Idiomas, endereços, como incluir idioma | `src/i18n/LEIAME.md` |
| Central de Ajuda (leitura do Firestore, endereços) | `src/ajuda/LEIAME.md` |
| Hospedagem, segurança e verificador | `hospedagem/LEIAME.md` |
| Atendimento: WhatsApp ou conversa com o Max pelo país do visitante | `src/atendimento/LEIAME.md` |
| Checklist dos idiomas novos (site e app; atualizar a cada achado) | `D:\Projetos\gestao_obras\docs\CHECKLIST_IDIOMAS_NOVOS.md` |
| Tarefas do Codex e relatórios | `docs/tarefas_codex/` (mesmo modelo do gestao_obras, skill `tarefa-codex` de lá) |

## Skills deste projeto

- `idiomas-site`: textos, idiomas novos e endereços no idioma.
- `publicar-site`: gerar e enviar o site para a Hostinger e conferir no ar.
- `impeccable`: design e revisão visual (Paul Bakaus, Apache 2.0), só as instruções em texto, sem o launcher
  (`.claude/skills/impeccable/LEIAME.md`).
