// Leitor do texto dos passos. Entende só o que o validador do conteúdo deixa passar:
//   **negrito**, linha começando com "- " (lista) e [texto](artigo:id-do-artigo).
// Todo o resto é mostrado como texto puro. Nada aqui gera HTML: o resultado é uma lista de
// blocos que o componente transforma em elementos React.

const ID_ARTIGO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LINK = /^\[([^\]\n]+)\]\(artigo:([^)\s]+)\)/;

// Divide uma linha em pedaços: { tipo: 'texto', texto, negrito } ou
// { tipo: 'link', texto, id, negrito }.
export function lerLinha(linha) {
    const pedacos = [];
    let negrito = false;
    let atual = '';
    const fechar = () => {
        if (atual) pedacos.push({ tipo: 'texto', texto: atual, negrito });
        atual = '';
    };
    // Um "**" sem par não abre negrito: aparece como texto.
    const marcas = (linha.match(/\*\*/g) ?? []).length;
    let marcasValidas = marcas % 2 === 0 ? marcas : marcas - 1;

    let i = 0;
    while (i < linha.length) {
        if (linha.startsWith('**', i) && marcasValidas > 0) {
            fechar();
            negrito = !negrito;
            marcasValidas--;
            i += 2;
            continue;
        }
        if (linha[i] === '[') {
            const m = LINK.exec(linha.slice(i));
            if (m) {
                fechar();
                const id = m[2];
                if (ID_ARTIGO.test(id)) pedacos.push({ tipo: 'link', texto: m[1], id, negrito });
                else pedacos.push({ tipo: 'texto', texto: m[1], negrito });
                i += m[0].length;
                continue;
            }
        }
        atual += linha[i];
        i++;
    }
    fechar();
    return pedacos;
}

// Divide o texto em blocos: { tipo: 'paragrafo', pedacos } ou { tipo: 'lista', itens: [pedacos] }.
export function lerTexto(texto) {
    const blocos = [];
    for (const bruta of String(texto ?? '').split(/\r?\n/)) {
        const linha = bruta.trim();
        if (!linha) continue;
        const item = /^-\s+(.*)$/.exec(linha);
        if (item) {
            const ultimo = blocos[blocos.length - 1];
            if (ultimo && ultimo.tipo === 'lista') ultimo.itens.push(lerLinha(item[1]));
            else blocos.push({ tipo: 'lista', itens: [lerLinha(item[1])] });
        } else {
            blocos.push({ tipo: 'paragrafo', pedacos: lerLinha(linha) });
        }
    }
    return blocos;
}
