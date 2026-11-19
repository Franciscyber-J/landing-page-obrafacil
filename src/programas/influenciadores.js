// Programa Influenciadores ObraFácil (piloto P0, só Brasil, só pt-BR): os números e endereços que a página mostra.
// O texto do regulamento vem do gestao_obras (legal/programas/influenciadores/1.0/pt-BR.md, fonte única) e é copiado
// aqui igual, byte a byte: o teste (programas.test.js) confere a impressão digital (sha256) com a que o validador de lá
// imprime (node bin/validar.mjs em ferramentas/programas) e confere que os números abaixo estão escritos no texto.
// Versão nova do regulamento = arquivo novo, VERSAO e HASH novos (a versão publicada nunca muda).

export const VERSAO = '1.0';
export const HASH = '1816d2691d121ad3269d720898ccd3ce7f191a76b1d475899e39f5ccdd00212f';
export const ARQUIVO_DO_REGULAMENTO = 'regulamento-influenciadores-1.0.pt-BR.md';

// Conta oficial e o direct dela. O ig.me é o link oficial do Instagram para abrir a conversa (no celular); no computador
// o Instagram não abre o ig.me, então a página mostra também o perfil. A palavra que a pessoa manda é o gatilho do
// fluxo do direct (Orbit, docs/vendas/influenciadores_p0/FLUXO_PARCEIRO_ORBIT.md no gestao_obras).
export const CONTA = 'oficial.obrafacil';
export const DIRECT = `https://ig.me/m/${CONTA}`;
export const PERFIL = `https://www.instagram.com/${CONTA}/`;
export const PALAVRA = 'PARCEIRO';
export const ACEITE = 'ACEITO 1.0';

export const VAGAS = 50;
export const CICLOS = 3;
export const DIAS_DO_CICLO = 30;
export const DIAS_NO_AR = 7;
export const MINIMO_SEGUIDORES = 500;
export const MINIMO_PUBLICACOES = 12;
export const PONTOS_POR_MES = 300;
export const VALIDADE_MESES = 12;

// Tabela de pontos (regulamento, 6.1). limite: por ciclo; nos Reels, por nível.
export const PONTOS = [
    { id: 'reels', pontos: 100, limite: [3, 4, 6] },
    { id: 'post', pontos: 40, limite: 2 },
    { id: 'story', pontos: 15, limite: 8 },
    { id: 'meta', pontos: 50, limite: 1 },
    { id: 'indicacao', pontos: 300, limite: 5 },
    { id: 'repost', pontos: 100, limite: 1 },
];

// Níveis (regulamento, 4.1) e teto de pontos por ciclo (6.2), na ordem dos limites dos Reels acima.
export const NIVEIS = [
    { id: 'influenciador', de: 500, ate: 4999, teto: 300 },
    { id: 'pro', de: 5000, ate: 49999, teto: 450 },
    { id: 'embaixador', de: 50000, ate: null, teto: 600 },
];
