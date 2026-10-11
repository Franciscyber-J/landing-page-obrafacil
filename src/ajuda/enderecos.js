// Endereços da Central de Ajuda no idioma do site:
//   /pt-br/ajuda                              início
//   /pt-br/ajuda/assunto/financeiro-da-obra   assunto (nome do módulo no idioma)
//   /pt-br/ajuda/lancar-receita-despesa       artigo (slug do artigo no idioma)
//   /en-us/help/topic/project-finances, /es-es/ayuda/tema/finanzas-de-la-obra...

import { caminhoAjuda, caminhoArtigo, caminhoAssunto, slugDoTexto } from '../i18n/idiomas.js';
import { idiomaDoConteudo } from './idiomas.js';

// Nome do módulo no endereço, no idioma pedido. Sem "nomes" (índice publicado antes dele
// existir) usa o nome do próprio índice; sem nome, o id (que também é aceito).
export function slugDoModulo(modulo, idiomaConteudo) {
    return slugDoTexto(modulo.nomes?.[idiomaConteudo] ?? modulo.nome) || modulo.id;
}

// Módulo pelo pedaço do endereço: o nome no idioma, o id, ou o nome em outro idioma
// (quem trocou só o começo do endereço). O chamador redireciona para o endereço certo.
export function acharModulo(modulos, parte, idiomaConteudo) {
    const procurado = slugDoTexto(parte);
    return modulos.find((m) => slugDoModulo(m, idiomaConteudo) === procurado)
        ?? modulos.find((m) => m.id === parte)
        ?? modulos.find((m) => Object.values(m.nomes ?? {}).some((n) => slugDoTexto(n) === procurado))
        ?? null;
}

export function criarRotas(codigo) {
    const conteudo = idiomaDoConteudo(codigo);
    return {
        inicio: caminhoAjuda(codigo),
        assunto: (modulo) => caminhoAssunto(codigo, slugDoModulo(modulo, conteudo)),
        artigo: (slug) => caminhoArtigo(codigo, slug),
    };
}
