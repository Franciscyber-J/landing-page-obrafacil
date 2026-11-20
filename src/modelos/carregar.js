// Dados dos modelos grátis no navegador (src/modelos/dados/<idioma>.json): cada idioma vira um arquivo separado no
// build e só é baixado na página de modelos daquele idioma.
//
// Página pronta do build: o site baixa o arquivo do idioma antes de "hidratar" (src/main.jsx, dados.modelos), então o
// primeiro desenho já tem os dados, igual ao do build. No build (src/ssr), os dados chegam junto com a página
// (dadosIniciais().modelos.dados). Navegando dentro do site, a página mostra "Carregando" e baixa o arquivo.

import { useEffect, useState } from 'react';
import { dadosIniciais } from '../dadosIniciais.js';

const ARQUIVOS = import.meta.glob(['./dados/*.json', '!./dados/origem.json', '!./dados/enderecos.json'], { import: 'default' });
const prontos = new Map();

export function dadosJaProntos(codigo) {
    const iniciais = dadosIniciais()?.modelos;
    if (iniciais?.dados?.idioma === codigo) return iniciais.dados;
    return prontos.get(codigo) ?? null;
}

export async function carregarDadosDosModelos(codigo) {
    if (prontos.has(codigo)) return prontos.get(codigo);
    const carregar = ARQUIVOS[`./dados/${codigo}.json`];
    if (!carregar) throw new Error(`Sem modelos no idioma ${codigo}`);
    const dados = await carregar();
    prontos.set(codigo, dados);
    return dados;
}

// { dados, erro, tentarDeNovo }: dados null enquanto baixa.
export function useDadosDosModelos(codigo) {
    const [estado, setEstado] = useState(() => ({ codigo, dados: dadosJaProntos(codigo), erro: null, vez: 0 }));
    const atual = estado.codigo === codigo ? estado : { codigo, dados: dadosJaProntos(codigo), erro: null, vez: 0 };
    useEffect(() => {
        if (atual.dados) return undefined;
        let valendo = true;
        carregarDadosDosModelos(codigo).then(
            (dados) => { if (valendo) setEstado({ codigo, dados, erro: null, vez: atual.vez }); },
            (erro) => { if (valendo) setEstado({ codigo, dados: null, erro, vez: atual.vez }); },
        );
        return () => { valendo = false; };
    }, [codigo, atual.dados, atual.vez]);
    return {
        dados: atual.dados,
        erro: atual.erro,
        tentarDeNovo: () => setEstado({ codigo, dados: null, erro: null, vez: atual.vez + 1 }),
    };
}

// O endereço de cada checklist em cada idioma ({ <id>: { <idioma>: slug } }, src/modelos/dados/enderecos.json), para a
// troca de idioma na página do modelo. Baixado só ali (um arquivo pequeno), depois que a página aparece.
let enderecos = null;
export function useEnderecosDosModelos() {
    const [valor, setValor] = useState(enderecos);
    useEffect(() => {
        if (enderecos) return undefined;
        let valendo = true;
        import('./dados/enderecos.json').then((m) => {
            enderecos = m.default;
            if (valendo) setValor(enderecos);
        }, () => {});
        return () => { valendo = false; };
    }, []);
    return valor;
}
