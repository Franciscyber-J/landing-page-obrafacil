# Site do ObraFácil — direção visual (outubro de 2026)

Documento de desenvolvimento (não vai para o site). Produto: `PRODUCT.md`. Sistema visual final: `DESIGN.md`
(escrito no fim, a partir do que foi construído).

Escopo (Francis, 18/10/2026): o site inteiro (página inicial, preços, Central de Ajuda, Termos e Política), com o
visual novo. Modo da página inicial: Persuadir. Central, Termos e Política: Ler.

Escolha final (19/10/2026): estilo A, "Noite de obra" (escuro) e "Obra de dia" (claro), arredondado, com vidro e luzes; o Francis recusou o visual de cantos retos da placa de obra. Ver DESIGN.md.
direção B foi a recomendada e seguida (o Francis pode trocar). O lançador do Impeccable não está instalado neste
projeto (decisão do Francis): não houve sorteio de direções; os esboços fizeram esse papel.

## Direction contract

THESIS: o site é a placa de obra, o quadro oficial que toda obra brasileira tem na frente, com os campos da obra em
letra alta e legível. Recusa o padrão do setor: fundo escuro com brilho azul, título grande ao lado de um celular e
uma fileira de cartões iguais.

OWN-WORLD: campo azul do logotipo (`--placa`) cobrindo as grandes áreas, moldura branca de 3 px, faixa laranja do
logotipo no alto das placas e na ação principal, texto escuro sobre o laranja. Letra de placa: Barlow Condensed em
caixa alta para títulos, rótulos e botões; Barlow para o texto corrido. Campos em linhas (rótulo estreito à esquerda,
valor à direita) separados por fio de 2 px. Cantos retos. Chão claro e frio (`--chao`) ou azul-noite no tema escuro.

STORY: em segundos o visitante lê que o app junta a obra inteira num lugar só e vê a tela real; percorre cada parte
da obra (cronograma, diário, financeiro, equipe, cliente) sempre com a tela do app no idioma dele; vê o quadro de
preços sem letra miúda; sai criando a conta grátis.

FIRST VIEWPORT: barra azul com o logotipo numa chapa branca, links, idioma, tema, Entrar e "Começar grátis". Logo
abaixo, a placa ocupa a largura: faixa laranja com "Gestão de obras" e as plataformas; à esquerda, o título em letra de
placa (até 6,5 rem), quatro campos (Cronograma, Diário de obra, Financeiro, Cliente) e as duas ações; à direita, num
painel azul mais fundo, a tela real do app. No celular, tudo empilhado e a tela do app logo depois das ações.

Interação-assinatura: os campos da placa são abas. Passar o mouse ou tocar num campo troca a tela do app no painel
(a tela daquela parte, no idioma da página), com a chapa nova descendo sobre a anterior (máscara vertical, 280 ms,
saída exponencial). Sem animação quando o sistema pede menos movimento.

FORM: placa de obra (esboço B, primeiro da lista ordenada pelo Francis e por mim). seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Material visual

- Telas do app: `public/telas/<idioma>/*.webp`, dos prints da Central de Ajuda (pasta `D:\Projetos\prints_5b_visual3`,
  gerados pelo app com dados de demonstração da construtora fictícia "Construtora Horizonte"/"Residencial Jardim das
  Acácias"). São dados de exemplo; a legenda diz "tela do app".
- Logotipo: `public/logo_transparente.png` (chapa branca atrás dele, nos dois temas).
- Sem fotos de banco de imagens.
