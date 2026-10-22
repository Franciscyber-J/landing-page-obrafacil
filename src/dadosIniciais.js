// Dados com que a página pronta do build foi desenhada (índice e artigo da Central, texto dos Termos/Política).
// O site usa os mesmos dados no primeiro desenho, para "hidratar" a página sem mudar nada do que já está na tela;
// depois confere no Firestore em segundo plano, como sempre. No build, cada página é desenhada com os dela.
//   { legal: { documento, idioma, atual, proxima }, ajuda: { indice, artigo } }

let atuais = null;

export function definirDadosIniciais(dados) {
    atuais = dados ?? null;
}

export function dadosIniciais() {
    return atuais;
}
