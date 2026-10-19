// Leitura do texto dos Termos e da Política. É o Markdown simples que o validador do
// gestao_obras (ferramentas/legal) aceita: "# Título" na primeira linha, "## Seção",
// "### Subseção", parágrafos, listas com "- " e **negrito**. Nada vira HTML: o resultado é uma
// lista de blocos que o React (ou a geração no build, com escape) desenha.

// "**a** b" → [{ texto: 'a', negrito: true }, { texto: ' b', negrito: false }]
export function trechos(linha) {
    const saida = [];
    const partes = String(linha).split('**');
    partes.forEach((texto, i) => {
        if (texto) saida.push({ texto, negrito: i % 2 === 1 });
    });
    return saida;
}

// Âncora estável da seção: "## 7. Planos, pagamentos" → "s7"; sem número, pelo texto.
export function ancora(titulo, usadas) {
    const m = /^(\d+(?:\.\d+)*)\.?\s/.exec(titulo);
    let base = m ? `s${m[1].replace(/\./g, '-')}` : titulo
        .normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
    if (!base) base = 'secao';
    let id = base;
    let n = 2;
    while (usadas.has(id)) id = `${base}-${n++}`;
    usadas.add(id);
    return id;
}

// Blocos: { tipo: 'titulo' | 'secao' | 'subsecao' | 'paragrafo' | 'lista', trechos | itens, id }
export function lerTexto(texto) {
    const linhas = String(texto ?? '').replace(/\r\n?/g, '\n').split('\n');
    const blocos = [];
    const usadas = new Set();
    let paragrafo = [];
    let lista = null;
    const fecharParagrafo = () => {
        if (paragrafo.length) blocos.push({ tipo: 'paragrafo', trechos: trechos(paragrafo.join(' ')) });
        paragrafo = [];
    };
    const fecharLista = () => {
        if (lista) blocos.push({ tipo: 'lista', itens: lista });
        lista = null;
    };
    for (const bruta of linhas) {
        const linha = bruta.trimEnd();
        if (!linha.trim()) {
            fecharParagrafo();
            fecharLista();
            continue;
        }
        const titulo = /^(#{1,3}) (.+)$/.exec(linha);
        if (titulo) {
            fecharParagrafo();
            fecharLista();
            const nivel = titulo[1].length;
            const conteudo = titulo[2].trim();
            if (nivel === 1) blocos.push({ tipo: 'titulo', texto: conteudo.replace(/\*\*/g, '') });
            else blocos.push({ tipo: nivel === 2 ? 'secao' : 'subsecao', texto: conteudo.replace(/\*\*/g, ''), id: ancora(conteudo, usadas) });
            continue;
        }
        if (linha.startsWith('- ')) {
            fecharParagrafo();
            if (!lista) lista = [];
            lista.push(trechos(linha.slice(2)));
            continue;
        }
        fecharLista();
        paragrafo.push(linha.trim());
    }
    fecharParagrafo();
    fecharLista();
    return blocos;
}

// Título (primeira linha "# ...") e as seções para o sumário.
export function sumario(blocos) {
    return blocos.filter((b) => b.tipo === 'secao').map((b) => ({ id: b.id, texto: b.texto }));
}

export function tituloDoTexto(blocos) {
    return blocos.find((b) => b.tipo === 'titulo')?.texto ?? '';
}

function escapar(texto) {
    return String(texto)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function trechosHtml(lista) {
    return lista.map((t) => (t.negrito ? `<strong>${escapar(t.texto)}</strong>` : escapar(t.texto))).join('');
}

// HTML simples (com escape) para a página gerada no build, que robôs e navegadores sem
// JavaScript leem. O site, depois de carregar, desenha os mesmos blocos pelo React.
export function blocosEmHtml(blocos) {
    return blocos.map((b) => {
        if (b.tipo === 'titulo') return `<h1>${escapar(b.texto)}</h1>`;
        if (b.tipo === 'secao') return `<h2 id="${escapar(b.id)}">${escapar(b.texto)}</h2>`;
        if (b.tipo === 'subsecao') return `<h3 id="${escapar(b.id)}">${escapar(b.texto)}</h3>`;
        if (b.tipo === 'lista') return `<ul>${b.itens.map((i) => `<li>${trechosHtml(i)}</li>`).join('')}</ul>`;
        return `<p>${trechosHtml(b.trechos)}</p>`;
    }).join('\n');
}

export { escapar };
