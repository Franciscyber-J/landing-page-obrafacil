# Modelos grátis (checklists de qualidade e diário de obra)

Decisão do Francis (20/11/2026): o site dá de graça o **modelo** (a lista para ler e imprimir), como atrativo nas
buscas, e leva ao app, onde o mesmo modelo vira checklist de verdade. Primeira leva: os 27 checklists prontos do app
(FVS) e o diário de obra (RDO). Tudo é página pronta e PDF gerados no build: nenhum servidor nem leitura no Firebase.

| Arquivo | Para quê |
| --- | --- |
| `dados/<idioma>.json` | Cópia do app: os 27 modelos (grupo, itens, seção, item crítico, foto obrigatória) com o texto nativo de cada idioma (`assets/checklists`) e os rótulos dos PDFs do app (ARB: Ficha de Verificação de Serviço, respostas, não conformidade, liberação, campos do RDO) |
| `dados/enderecos.json` | Endereço de cada checklist em cada idioma (troca de idioma na página do modelo) |
| `dados/origem.json` | Commit do gestao_obras de onde veio a cópia |
| `modelos.js` | Regras sem navegador: lista, endereços, seções, papel, textos do app com campos em branco |
| `carregar.js` | No navegador: baixa o arquivo do idioma (antes de hidratar a página pronta, `src/main.jsx`) |
| `src/components/modelos/` | A lista (modo de convencer) e a página de cada modelo (modo de leitura) |
| `ferramentas/modelos/copiar.mjs` | `npm run modelos -- copiar <gestao_obras>` grava a cópia; `conferir` diz se está igual ao app |
| `ferramentas/modelos/pdf.mjs` | O PDF de cada modelo em cada idioma (Chromium do Playwright, fontes do site e as Noto fixas de `public/fontes/pdf`), uma folha só, A4 ou Carta |

- **Nada inventado.** Os itens e os rótulos são os do app. A cópia para quando falta um modelo, um item ou um texto em
  algum idioma. Texto do site (para que serve, como usar, o que o app faz, os limites do grátis e do PRO) fica nas
  chaves `modelos.*` de `src/i18n/textos`, escrito nativo em cada idioma, com os limites que o app tem
  (`lib/checklists/limites_do_gratis.dart` e os preços do site).
- **Responsabilidade técnica** (decisão do Francis, 20/11/2026, D18 revista: sem revisão por engenheiro, os modelos
  são usados como estão): o aviso `modelos.aviso.*` (título, texto e a linha do PDF) aparece na lista, na página de
  cada modelo logo depois dos itens ou dos campos e no rodapé de cada PDF. Diz que o modelo é de referência, não
  substitui o projeto, as normas nem a revisão do responsável técnico da obra, com o nome do profissional de cada país
  (pt-BR "engenheiro ou arquiteto habilitado", es-ES "dirección facultativa", it-IT "direttore dei lavori", pl-PL
  "kierownik budowy"...), sem citar número de norma nem órgão. A nota da biblioteca do app não é usada no site.
- **Endereços:** `/pt-br/modelos-gratis` (palavra `rotas.modelos`), `/pt-br/modelos-gratis/<nome do modelo>` e
  `/pt-br/modelos-gratis/diario-de-obra-rdo` (palavra `rotas.diario`). PDF em `/modelos-pdf/<idioma>/<mesmo nome>.pdf`
  (fora das pastas dos idiomas; o build confere que cada PDF apontado existe).
- **Idioma novo:** ver o checklist dos idiomas novos do gestao_obras (itens `site:`): o app precisa ter
  `assets/checklists/<idioma>.json` e o ARB; aqui, `rotas.modelos`, `rotas.diario`, `papel` (se for Carta), as chaves
  `modelos.*` e `npm run modelos -- copiar`. Escrita nova fora do latim: a Noto fixa dela em `public/fontes/pdf` e o
  nome da família em `FAMILIA_DO_PDF` (`ferramentas/modelos/pdf.mjs`).
- **App mudou os modelos ou os rótulos:** a versão do app primeiro; depois `npm run modelos -- copiar`, build e
  publicação do site.
