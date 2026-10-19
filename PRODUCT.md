# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Quem toca obra no dia a dia e precisa prestar contas ao cliente (confirmado pelo Francis em 18/10/2026):

- dono ou gestor de pequena construtora, com várias obras ao mesmo tempo;
- engenheiro ou arquiteto autônomo que conduz obras de clientes;
- empreiteiro ou mestre de obras que executa e presta contas ao dono.

O dono da obra (pessoa física construindo a própria casa) não é o público que o site precisa convencer; ele entra
como cliente convidado, pelo Portal do Cliente.

O site atende visitantes do Brasil e de fora, em 8 idiomas (pt-BR, pt-PT, en-US, en-GB, en-AU, en-CA, es-ES,
es-MX), muitos chegando por anúncio pago, quase sempre pelo celular.

## Product Purpose

ObraFácil é um aplicativo de gestão de obras (Android, iPhone, Windows e navegador). O gestor registra a obra
inteira num lugar só e compartilha com quem precisa ver. Sucesso no site: o visitante entende em segundos o que o
app faz, confia que é sério e cria a conta grátis.

Meta do site (decisão do Francis em 19/10/2026): **cadastro, não assinatura**. O site leva a pessoa para dentro do
app; quem converte em PRO é o app. Motivos: o cupom de Membro Fundador oferecido no site (50% por 12 meses, pelo
WhatsApp) teve 0 usos; em produtos com plano grátis, a média de mercado é de 9 cadastros a cada 100 visitantes e
de 3% a 5% dos usuários grátis virando assinantes (ChartMogul, Lenny Rachitsky); 82% dos testes grátis de apps
começam no dia da instalação (RevenueCat 2025). Por isso:

- todo botão principal é "Começar grátis": no celular abre a loja do aparelho, no computador o cadastro no
  navegador (`src/comecar.js`);
- os preços continuam à vista, com o botão do PRO em segundo plano;
- o convite de saída chama para a conta grátis, sem preço, desconto ou contagem de vagas;
- os cliques em "Começar grátis", nas lojas e no PRO são medidos (`public/tag-google.js`, `data-conversao`).

## Positioning

A obra inteira num lugar só: cronograma por etapas, diário de obra (RDO) com fotos, clima e equipe, financeiro
(orçado, medido, pode pagar, entradas e saídas), equipe e folha, compras, almoxarifado, ocorrências e lembretes,
mais um Portal do Cliente em que o dono da obra acompanha tudo sem precisar ligar. Destaque principal escolhido pelo
Francis: "Obra inteira num lugar".

## Operating Context

O gestor usa o app no canteiro (celular, sol, às vezes sem internet; o app guarda e envia depois) e no escritório
(computador). O cliente da obra recebe convite por e-mail e acompanha pelo portal. Papéis na obra: gestor,
engenheiro, equipe e cliente.

## Capabilities and Constraints

- Plano grátis sem prazo (limites de obras, relatórios e armazenamento). PRO mensal e anual (renovação
  automática), expansão de armazenamento +20 GB, compras avulsas (Acesso Cliente da obra, pacotes de downloads
  extras). O PRO tem 10 GB.
- Período grátis de 30 dias só por oferta (campanha/notificação no app). O site não pode prometer teste grátis de
  30 dias para todos (confirmado pelo Francis em 18/10/2026).
- Preço "de/por" do PRO: o Francis confirmou em 18/10/2026 que o PRO já foi cobrado no valor "de".
- Exclusão de conta: suspensa 30 dias, depois apagada; registros de aceite guardados 5 anos. Atraso de pagamento:
  a conta volta ao plano grátis, nada é apagado. Não há criptografia de ponta a ponta. (Termos e Política 2.0.)
- Termos e Política vêm do Firestore (documentos_legais), nos 8 idiomas; os endereços antigos
  /termos-de-uso/ e /politicas-de-privacidade/ estão nas lojas e não podem mudar.
- Sem fontes, scripts ou imagens de terceiros novos (política de segurança do .htaccess); tag do Google Ads só com
  consentimento.
- Tema claro e escuro; celular de 390 px sem rolagem lateral; área de toque de 44 px; contraste 4,5:1.

## Brand Commitments

- Nome: ObraFácil. Logotipo atual (prédio estilizado em azul com seta e curva laranja), em `public/logo.png` e
  `public/logo_transparente.png`. As cores do logo (azul e laranja) ficam.
- Tom: direto, de quem é da obra; sem promessa exagerada.

## Evidence on Hand

- Telas reais e atuais do app nos 8 idiomas: os prints da Central de Ajuda (gerados pelo app com dados de
  demonstração de uma construtora fictícia), copiados para `public/telas/<idioma>/` (obra, rdo, equipe, etapas,
  financeiro, portal, acesso). As imagens antigas de `public/` (desktop-*.png, mobile-*.png) mostram telas que não
  existem mais e não devem ser usadas.
- Depoimentos (Carlos M., Roberto F., Sandro P., Juliana T., Fernando S.): reais e com autorização, segundo o
  Francis (18/10/2026).
- Não há números de clientes, obras ou avaliações para mostrar: não inventar.

## Product Principles

- Mostrar o app de verdade, não promessa: cada recurso aparece com a tela real.
- Nada no site diz mais do que os Termos e a Política dizem.
- O mesmo site em 8 idiomas: texto, endereços, preços e telas no idioma de quem visita.
- Leve no celular e barato de manter (sem leitura a mais no Firebase).

## Accessibility & Inclusion

Contraste mínimo 4,5:1, áreas de toque de 44 px, funciona sem animação (prefers-reduced-motion), claro e escuro.
