import { useEffect, useMemo, useState } from 'react';
import { carregarArtigo, conferirIndice, indiceGuardado } from '../../ajuda/dados.js';
import { prepararBusca } from '../../ajuda/busca.js';
import { idiomaDoConteudo } from '../../ajuda/idiomas.js';
import { acharModulo, criarRotas, slugDoModulo } from '../../ajuda/enderecos.js';
import { caminhoAjuda, caminhoArtigo, caminhoAssunto } from '../../i18n/idiomas.js';
import { useRotaEquivalente } from '../../i18n/RotaDoIdioma.jsx';
import AjudaInicio from './AjudaInicio.jsx';
import AjudaAssunto from './AjudaAssunto.jsx';
import AjudaArtigo from './AjudaArtigo.jsx';
import { Carregando, ErroAoCarregar, NadaPublicado } from './Estados.jsx';
import styles from './Ajuda.module.css';

// Índice do idioma: aparece na hora se estiver guardado no navegador e é conferido em
// segundo plano; a tela só muda se a conferência trouxer algo diferente.
function useIndice(idioma) {
    const [tentativa, setTentativa] = useState(0);
    const [estado, setEstado] = useState({ chave: null, tipo: 'carregando', indice: null });
    const chave = `${idioma}:${tentativa}`;
    const guardado = useMemo(() => indiceGuardado(idioma), [idioma]);

    useEffect(() => {
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

// Artigo inteiro (passos, prints, slugs de todos os idiomas). Baixado de novo só quando o hash muda.
function useArtigo(entrada, idioma) {
    const [tentativa, setTentativa] = useState(0);
    const [estado, setEstado] = useState({ chave: null, tipo: 'carregando', doc: null });
    const chave = entrada ? `${entrada.id}:${idioma}:${entrada.hash}:${tentativa}` : null;

    useEffect(() => {
        if (!entrada) return undefined;
        let vivo = true;
        carregarArtigo(entrada, idioma)
            .then((doc) => { if (vivo) setEstado({ chave, tipo: doc ? 'pronto' : 'sumiu', doc }); })
            .catch(() => { if (vivo) setEstado({ chave, tipo: 'erro', doc: null }); });
        return () => { vivo = false; };
    }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps

    const atual = estado.chave === chave ? estado : { chave, tipo: 'carregando', doc: null };
    return { ...atual, tentarDeNovo: () => setTentativa((n) => n + 1) };
}

// Endereço desta página da Central em outro idioma do site (menu de idiomas e hreflang).
function useEquivalente(tipo, idioma, moduloAtual, entrada, doc) {
    useRotaEquivalente((codigo) => {
        const conteudo = idiomaDoConteudo(codigo);
        if (tipo === 'assunto' && moduloAtual) {
            return caminhoAssunto(codigo, moduloAtual.nomes ? slugDoModulo(moduloAtual, conteudo) : moduloAtual.id);
        }
        if (tipo === 'artigo' && entrada) {
            if (conteudo === idioma) return caminhoArtigo(codigo, entrada.slug);
            // Com o artigo carregado, o slug do outro idioma; antes disso, o id (que leva ao slug certo).
            if (doc) return doc.conteudo?.[conteudo]?.slug ? caminhoArtigo(codigo, doc.conteudo[conteudo].slug) : caminhoAjuda(codigo);
            return caminhoArtigo(codigo, entrada.id);
        }
        return caminhoAjuda(codigo);
    }, [tipo, idioma, moduloAtual, entrada, doc]);
}

// codigo: idioma do site (pt-BR, en-GB...). Os artigos vêm de idiomaDoConteudo(codigo).
export default function AjudaPagina({ codigo, tipo, slug, modulo }) {
    const idioma = idiomaDoConteudo(codigo);
    const rotas = useMemo(() => criarRotas(codigo), [codigo]);
    const estado = useIndice(idioma);
    const indice = estado.indice;

    const preparado = useMemo(() => (indice ? prepararBusca(indice.artigos) : []), [indice]);
    const entrada = useMemo(() => {
        if (tipo !== 'artigo' || !indice) return null;
        return indice.artigos.find((a) => a.slug === slug) ?? indice.artigos.find((a) => a.id === slug) ?? null;
    }, [tipo, indice, slug]);
    const moduloAtual = useMemo(
        () => (tipo === 'assunto' && indice ? acharModulo(indice.modulos, modulo, idioma) : null),
        [tipo, indice, modulo, idioma],
    );
    const artigo = useArtigo(entrada, idioma);
    useEquivalente(tipo, idioma, moduloAtual, entrada, artigo.tipo === 'pronto' ? artigo.doc : null);

    const comum = { codigo, idioma, indice, preparado, rotas };
    let conteudo;
    if (estado.tipo === 'carregando') conteudo = <Carregando />;
    else if (estado.tipo === 'erro') conteudo = <ErroAoCarregar aoTentarDeNovo={estado.tentarDeNovo} />;
    else if (estado.tipo === 'vazio') conteudo = <NadaPublicado />;
    else if (tipo === 'assunto') conteudo = <AjudaAssunto {...comum} atual={moduloAtual} pedido={modulo} />;
    else if (tipo === 'artigo') conteudo = <AjudaArtigo {...comum} entrada={entrada} slug={slug} artigo={artigo} />;
    else conteudo = <AjudaInicio {...comum} />;

    return <main className={styles.ajuda}>{conteudo}</main>;
}
