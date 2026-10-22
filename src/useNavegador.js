// O que depende do aparelho de quem abre (e que a página pronta do build não tem como saber). O primeiro desenho
// no navegador sai igual ao do build (computador, nada aberto) e, logo depois, se ajusta ao aparelho de verdade:
// assim a página pronta é "hidratada" sem diferença e sem erro.
import { useSyncExternalStore } from 'react';
import { aparelho, linkDoAparelho } from './comecar.js';

const semMudanca = () => () => {};

// false no build e no primeiro desenho; true depois (aviso de cookies e outras partes só do navegador).
export function useMontado() {
    return useSyncExternalStore(semMudanca, () => true, () => false);
}

// Link "Começar grátis" ({ href, 'data-conversao' }): loja do celular ou cadastro no computador (src/comecar.js).
export function useLinkComecar(codigo) {
    const tipo = useSyncExternalStore(semMudanca, () => aparelho(), () => 'outro');
    return linkDoAparelho(codigo, tipo);
}
