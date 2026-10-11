# TAREFA CODEX — fase2-conferencia-site

Responda em português do Brasil.

**Pasta:** `D:\Projetos\landing_page`. **Base:** a branch `fase2-site-idiomas` do GitHub (NÃO a `main`).

```powershell
git fetch origin
git switch -c fase2-conferencia-site origin/fase2-site-idiomas
```

**Antes:** a tarefa `fase2-conferencia` do gestao_obras (etapa A) precisa ter rodado, porque aqui você usa a pasta `$env:TEMP\ajuda_saida` que ela gera. Se a pasta não existir, pare e relate.

## Regras

- Nada de deploy, envio para a Hostinger, merge, push ou commit na `main`. Commits só na sua branch.
- Não altere `hospedagem/`, `src/i18n/`, `src/ajuda/`, `src/components/ajuda/`, `src/App.jsx`, `ferramentas/` nem os textos em `src/i18n/textos/`. Se algo falhar nesses arquivos, relate com arquivo e linha e não corrija.
- Nunca crie, copie nem mostre arquivo de credencial, chave ou `.env`.
- Nada de solução paliativa: se não der para resolver por completo, pare e relate.

## Contexto

A base traz a Central de Ajuda, os idiomas do site e o pacote de segurança da hospedagem (feitos pelo Claude):

- Endereços no idioma de cada pessoa (`/pt-br/ajuda/assunto/financeiro-da-obra`, `/en-us/help/topic/project-finances`...), troca de idioma para a mesma página, `canonical` e `hreflang`.
- Cadastro único dos idiomas em `src/i18n/registro.js`; textos em `src/i18n/textos/`; conferência `npm run idiomas` (roda também antes do build). Leia `src/i18n/LEIAME.md` e `src/ajuda/LEIAME.md`.
- `hospedagem/`: `.htaccess`, plugin de segurança do WordPress e o verificador `hospedagem/verificar.mjs`.

## O que fazer

**A. Instalação, testes e build**

```powershell
npm ci
npm test
npm run idiomas
npm run build
npm audit
```

Esperado: `npm test` com 19 testes e nenhuma falha; `npm run idiomas` com 8 idiomas e sem erros; build sem erro; `npm audit` com 0 vulnerabilidades.

**B. Lint** — `npm run lint` já tinha erros antes desta fase, só em arquivos da página inicial: `motion` dado como não usado (`HeroSection`, `MidCTA`, `Pricing`, `ProblemSolution`, `TestimonialsFaq`, `CoManagement`, `CoreFeatures`), `fromMonthlyStr` não usado em `Pricing` e avisos em `Globe`, `ExitIntentPopup` e `FloatingWhatsApp`. O `motion` é usado como `<motion.div>`: corrija a configuração do ESLint para reconhecer o uso em JSX (por exemplo `eslint-plugin-react` com a regra `react/jsx-uses-vars`), sem desligar a regra `no-unused-vars`. Os outros: corrija sem mudar nada do que aparece na tela. Rode `npm run lint` (esperado: 0 erros), `npm test` e `npm run build` de novo. **Um commit só para o lint.**

**C. Conferência no navegador** — a Central lê os arquivos da tarefa do gestao_obras, sem tocar no Firestore:

```powershell
$env:AJUDA_SAIDA = "$env:TEMP\ajuda_saida"; npm run dev
```

Abra cada linha e anote o que não bater:

| Abrir | Esperado |
| --- | --- |
| `http://localhost:5173/` | vai para `/pt-br/` (navegador em português do Brasil) |
| `/pt-br/#precos`, depois English (UK) no menu de cima | `/en-gb/#pricing`, mesma seção, textos em inglês britânico, preço em £ |
| `/pt-br/ajuda` → clicar em "Financeiro da obra" | `/pt-br/ajuda/assunto/financeiro-da-obra` |
| trocar para English (US) | `/en-us/help/topic/project-finances` |
| `/pt-br/ajuda/criar-rdo`, depois Español (México) no rodapé | `/es-mx/ayuda/crear-informe-diario` |
| `/ajuda/pt-BR/assunto/financeiro` | `/pt-br/ajuda/assunto/financeiro-da-obra` |
| `/en-us/ajuda/assunto/obras` | `/en-us/help/topic/projects` |
| `/?utm_source=teste#precos` | `/pt-br/?utm_source=teste#precos` |
| DevTools → Elements → `<head>` | 8 `link rel="alternate" hreflang`, 1 `x-default`, 1 `canonical` |
| Menu de idiomas | 8 bandeiras vindas de `/bandeiras/*.svg`; na aba Network nenhuma chamada a `jsdelivr` |
| DevTools no tamanho de celular (390 px) | menu com os 8 idiomas; sem rolagem para o lado |
| Tema claro e tema escuro | Central e menu legíveis nos dois |

**D. Idioma novo (teste do fluxo, sem commit)** — siga `src/i18n/LEIAME.md` → "Incluir um idioma" com `fr-FR` (moeda `eur`, país `FR`, palavras dos endereços em francês). Traduza 5 textos do pacote, importe, rode `npm run idiomas` e abra `/fr-fr/aide`: os 5 textos em francês, o resto em inglês, os artigos em inglês. Depois descarte tudo: `git restore .` e `git clean -fd src/i18n ferramentas/idiomas`. Confira com `git status` que nada sobrou.

**E. Relatório** — `docs/tarefas_codex/RELATORIO_fase2-conferencia-site.md` com:
1. branch e commits;
2. arquivos alterados, uma linha por arquivo;
3. comandos rodados e as linhas finais de cada um;
4. a tabela da etapa C com OK ou o que apareceu;
5. o resultado da etapa D;
6. o comando para gerar o diff: `git diff origin/fase2-site-idiomas...fase2-conferencia-site --output=..\diff_fase2-conferencia-site.txt`.

Faça commit do relatório na sua branch.
