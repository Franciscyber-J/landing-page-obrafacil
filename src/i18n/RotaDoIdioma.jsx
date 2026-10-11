/* eslint-disable react-refresh/only-export-components */
// Liga o idioma ao endereço.
//  - Cada página diz qual é o endereço dela nos outros idiomas (useRotaEquivalente).
//  - Trocar o idioma no menu leva para esse endereço (useTrocarIdioma): a mesma página, no idioma novo.
//  - Os <link rel="alternate" hreflang> do Google saem da mesma informação (Alternativos).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IDIOMAS, INTERNACIONAL, REFERENCIA, caminhoInicio, secaoDaAncora } from './idiomas.js';
import { gravarPreferencia } from './preferencia.js';

const Contexto = createContext(null);

export function ProvedorDeRota({ codigo, children }) {
    const [gerador, setGerador] = useState(null);
    const valor = useMemo(() => ({ codigo, gerador, setGerador }), [codigo, gerador]);
    return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

// Idioma da página aberta (pt-BR, en-GB...).
export function useIdioma() {
    return useContext(Contexto)?.codigo ?? REFERENCIA;
}

// gerar(codigo) → endereço desta página no idioma pedido (ou null se ela não existir nele).
export function useRotaEquivalente(gerar, dependencias) {
    const ctx = useContext(Contexto);
    const setGerador = ctx?.setGerador;
    useEffect(() => {
        if (!setGerador) return undefined;
        setGerador(() => gerar);
        return () => setGerador(null);
    }, dependencias); // eslint-disable-line react-hooks/exhaustive-deps
}

// Sem gerador é a página inicial: mantém a seção aberta (#precos → #pricing).
function enderecoNoIdioma(gerador, codigo, hash) {
    return (gerador ? gerador(codigo) : null) ?? caminhoInicio(codigo, secaoDaAncora(hash));
}

export function useTrocarIdioma() {
    const ctx = useContext(Contexto);
    const navigate = useNavigate();
    const { hash } = useLocation();
    const gerador = ctx?.gerador;
    return useCallback((codigo) => {
        gravarPreferencia(codigo);
        navigate(enderecoNoIdioma(gerador, codigo, hash));
    }, [gerador, navigate, hash]);
}

function absoluto(caminho) {
    return new URL(caminho, window.location.origin).href;
}

// <link rel="canonical"> e <link rel="alternate" hreflang="..."> da página aberta.
export function Alternativos() {
    const ctx = useContext(Contexto);
    const { pathname, hash } = useLocation();
    const gerador = ctx?.gerador;

    useEffect(() => {
        const head = document.head;
        head.querySelectorAll('link[data-idiomas]').forEach((l) => l.remove());
        const novos = [];
        const add = (rel, href, hreflang) => {
            const l = document.createElement('link');
            l.rel = rel;
            l.href = href;
            if (hreflang) l.hreflang = hreflang;
            l.setAttribute('data-idiomas', '');
            novos.push(l);
        };
        add('canonical', absoluto(pathname));
        for (const i of IDIOMAS) {
            const caminho = gerador ? gerador(i.codigo) : caminhoInicio(i.codigo);
            if (caminho) add('alternate', absoluto(caminho.split('#')[0]), i.codigo);
        }
        const padrao = gerador ? gerador(INTERNACIONAL) : null;
        add('alternate', absoluto(padrao ? padrao.split('#')[0] : '/'), 'x-default');
        novos.forEach((l) => head.appendChild(l));
        return () => novos.forEach((l) => l.remove());
    }, [gerador, pathname, hash]);

    return null;
}
