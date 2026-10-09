import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { conferirIndice, indiceGuardado } from '../../ajuda/dados.js';
import { prepararBusca } from '../../ajuda/busca.js';
import { ehIdiomaDaAjuda, idiomaDaAjuda, idiomaDoSite } from '../../ajuda/idiomas.js';
import AjudaInicio from './AjudaInicio.jsx';
import AjudaAssunto from './AjudaAssunto.jsx';
import AjudaArtigo from './AjudaArtigo.jsx';
import { Carregando, ErroAoCarregar, NadaPublicado } from './Estados.jsx';
import styles from './Ajuda.module.css';

function idiomaAtualDoSite(i18n) {
    return idiomaDaAjuda(i18n.resolvedLanguage || i18n.language);
}

// /ajuda: leva para a Central no idioma atual do site.
export function AjudaRedireciona() {
    const { i18n } = useTranslation();
    return <Navigate to={`/ajuda/${idiomaAtualDoSite(i18n)}`} replace />;
}

// Índice do idioma: aparece na hora se estiver guardado no navegador e é conferido em
// segundo plano; a tela só muda se a conferência trouxer algo diferente.
function useIndice(idioma) {
    const [tentativa, setTentativa] = useState(0);
    const [estado, setEstado] = useState({ chave: null, tipo: 'carregando', indice: null });
    const chave = `${idioma}:${tentativa}`;
    const guardado = useMemo(() => indiceGuardado(idioma), [idioma]);

    useEffect(() => {
        if (!ehIdiomaDaAjuda(idioma)) return undefined;
        let vivo = true;
        conferirIndice(idioma, (novo) => {
            if (vivo) setEstado(novo ? { chave, tipo: 'pronto', indice: novo } : { chave, tipo: 'vazio', indice: null });
        }).catch(() => {
            if (vivo) setEstado((e) => (e.chave === chave ? e : { chave, tipo: 'erro', indice: null }));
        });
        return () => { vivo = false; };
    }, [idioma, chave]);

    let atual;
    if (estado.chave === chave && !(estado.tipo === 'erro' && guardado)) atual = estado;
    else if (guardado) atual = { tipo: 'pronto', indice: guardado };
    else atual = { tipo: 'carregando', indice: null };
    return { ...atual, tentarDeNovo: () => setTentativa((n) => n + 1) };
}

// Mantém o idioma do endereço e o seletor de idioma do site andando juntos:
// - o endereço manda: abrir /ajuda/en-GB/... troca o site para inglês (UK);
// - trocar o idioma no menu do site leva para a mesma página no idioma novo.
function useIdiomaSincronizado(idioma, enderecoEquivalente) {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const idiomaRef = useRef(idioma);
    const equivalenteRef = useRef(enderecoEquivalente);

    useEffect(() => {
        idiomaRef.current = idioma;
        equivalenteRef.current = enderecoEquivalente;
    });

    useEffect(() => {
        if (!ehIdiomaDaAjuda(idioma)) return;
        if (idiomaAtualDoSite(i18n) !== idioma) i18n.changeLanguage(idiomaDoSite(idioma));
    }, [idioma, i18n]);

    useEffect(() => {
        const aoTrocar = (codigo) => {
            const novo = idiomaDaAjuda(codigo);
            if (novo !== idiomaRef.current) navigate(equivalenteRef.current(novo));
        };
        i18n.on('languageChanged', aoTrocar);
        return () => i18n.off('languageChanged', aoTrocar);
    }, [i18n, navigate]);
}

export default function AjudaPagina({ tipo }) {
    const { idioma, slug, modulo } = useParams();
    const { i18n } = useTranslation();
    const idiomaValido = ehIdiomaDaAjuda(idioma);
    const estado = useIndice(idioma);
    const indice = estado.indice;

    const preparado = useMemo(() => (indice ? prepararBusca(indice.artigos) : []), [indice]);
    const entrada = useMemo(() => {
        if (tipo !== 'artigo' || !indice) return null;
        return indice.artigos.find((a) => a.slug === slug) ?? indice.artigos.find((a) => a.id === slug) ?? null;
    }, [tipo, indice, slug]);

    useIdiomaSincronizado(idioma, (novo) => {
        if (tipo === 'assunto') return `/ajuda/${novo}/assunto/${modulo}`;
        if (tipo === 'artigo') return `/ajuda/${novo}/${entrada?.id ?? slug}`;
        return `/ajuda/${novo}`;
    });

    if (!idiomaValido) {
        // Endereço sem idioma (ex.: /ajuda/criar-rdo): usa o idioma atual do site.
        const atual = idiomaAtualDoSite(i18n);
        if (tipo === 'inicio') return <Navigate to={`/ajuda/${atual}/${idioma}`} replace />;
        if (tipo === 'assunto') return <Navigate to={`/ajuda/${atual}/assunto/${modulo}`} replace />;
        return <Navigate to={`/ajuda/${atual}`} replace />;
    }

    let conteudo;
    if (estado.tipo === 'carregando') conteudo = <Carregando />;
    else if (estado.tipo === 'erro') conteudo = <ErroAoCarregar idioma={idioma} aoTentarDeNovo={estado.tentarDeNovo} />;
    else if (estado.tipo === 'vazio') conteudo = <NadaPublicado idioma={idioma} />;
    else if (tipo === 'assunto') conteudo = <AjudaAssunto idioma={idioma} indice={indice} preparado={preparado} modulo={modulo} />;
    else if (tipo === 'artigo') conteudo = <AjudaArtigo idioma={idioma} indice={indice} preparado={preparado} entrada={entrada} slug={slug} />;
    else conteudo = <AjudaInicio idioma={idioma} indice={indice} preparado={preparado} />;

    return <main className={styles.ajuda}>{conteudo}</main>;
}
