import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Smartphone, Users, ListOrdered } from 'lucide-react';
import { carregarArtigo, enderecoDoPrint } from '../../ajuda/dados.js';
import { IDIOMAS_AJUDA, NOMES_IDIOMAS } from '../../ajuda/idiomas.js';
import AjudaBusca from './AjudaBusca.jsx';
import IconeModulo from './IconeModulo.jsx';
import TextoDoPasso from './TextoDoPasso.jsx';
import { BandaSuporte, Carregando, ErroAoCarregar, NaoEncontrado, Trilha } from './Estados.jsx';
import useTituloDaPagina from './useTituloDaPagina.js';
import styles from './Ajuda.module.css';

const ENDERECO_APP = 'https://obrafacilapp.expertbr.com';

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

// "gestor e equipe", "manager, team and client"...
function listaDePublico(publico, t) {
    const nomes = publico.map((p) => t(`ajuda.publico_${p}`));
    if (nomes.length <= 1) return nomes.join('');
    return `${nomes.slice(0, -1).join(', ')} ${t('ajuda.e')} ${nomes[nomes.length - 1]}`;
}

export default function AjudaArtigo({ idioma, indice, preparado, entrada, slug }) {
    const { t } = useTranslation();
    const artigo = useArtigo(entrada, idioma);
    const porId = useMemo(() => new Map(indice.artigos.map((a) => [a.id, a])), [indice]);
    const modulo = entrada ? indice.modulos.find((m) => m.id === entrada.modulo) : null;
    useTituloDaPagina(
        entrada ? `${entrada.titulo} · ${t('ajuda.titulo')} · ObraFácil` : null,
        entrada?.resumo ?? null,
    );

    if (!entrada) return <NaoEncontrado idioma={idioma} titulo={t('ajuda.naoEncontradoTitulo')} />;
    // Endereço pelo id ou com o nome antigo: troca pelo endereço certo deste idioma.
    if (slug !== entrada.slug) return <Navigate to={`/ajuda/${idioma}/${entrada.slug}`} replace />;

    const enderecoDoArtigo = (id) => (porId.has(id) ? `/ajuda/${idioma}/${porId.get(id).slug}` : null);
    const trilha = (
        <div className={styles.topoPagina}>
            <Trilha itens={[
                { texto: t('ajuda.titulo'), para: `/ajuda/${idioma}` },
                ...(modulo ? [{ texto: modulo.nome, para: `/ajuda/${idioma}/assunto/${modulo.id}` }] : []),
                { texto: entrada.titulo },
            ]} />
            <AjudaBusca idioma={idioma} indice={indice} preparado={preparado} compacto />
        </div>
    );

    if (artigo.tipo === 'carregando') return <>{trilha}<Carregando /></>;
    if (artigo.tipo === 'erro') return <ErroAoCarregar aoTentarDeNovo={artigo.tentarDeNovo} />;
    if (artigo.tipo === 'sumiu') return <NaoEncontrado idioma={idioma} titulo={t('ajuda.naoEncontradoTitulo')} />;

    const doc = artigo.doc;
    const conteudo = doc.conteudo[idioma];
    const passos = conteudo.passos ?? [];
    const antes = (doc.pre_requisitos ?? []).map((id) => porId.get(id)).filter(Boolean);
    const relacionados = (doc.relacionados ?? []).map((id) => porId.get(id)).filter(Boolean);
    const doModulo = indice.artigos.filter((a) => a.modulo === entrada.modulo);
    const posicao = doModulo.findIndex((a) => a.id === entrada.id);
    const anterior = posicao > 0 ? doModulo[posicao - 1] : null;
    const proximo = posicao >= 0 && posicao < doModulo.length - 1 ? doModulo[posicao + 1] : null;
    const outrosIdiomas = IDIOMAS_AJUDA.filter((i) => i !== idioma && doc.conteudo[i]?.slug);

    return (
        <div className={styles.container}>
            {trilha}

            <header className={styles.cabecalhoArtigo}>
                {modulo && (
                    <Link to={`/ajuda/${idioma}/assunto/${modulo.id}`} className={styles.sobretituloLink}>
                        <IconeModulo nome={modulo.icone} size={18} />{modulo.nome}
                    </Link>
                )}
                <h1 className={styles.tituloArtigo}>{conteudo.titulo}</h1>
                <p className={styles.resumoArtigo}>{conteudo.resumo}</p>
                <div className={styles.etiquetas}>
                    <span className={styles.etiqueta}><Users size={15} aria-hidden="true" />{t('ajuda.paraPublico', { lista: listaDePublico(doc.publico ?? [], t) })}</span>
                    <span className={styles.etiqueta}><ListOrdered size={15} aria-hidden="true" />{t('ajuda.passos', { count: passos.length })}</span>
                </div>
            </header>

            <div className={styles.colunasArtigo}>
                <article className={styles.corpoArtigo}>
                    <ol className={styles.passos}>
                        {passos.map((p, i) => {
                            const print = enderecoDoPrint(p.print);
                            return (
                                <li key={i} id={`passo-${i + 1}`} className={`${styles.passo} ${i === passos.length - 1 ? styles.passoUltimo : ''}`}>
                                    <span className={styles.numero} aria-hidden="true">{i + 1}</span>
                                    <div className={styles.passoConteudo}>
                                        <div className={styles.passoTexto}>
                                            <h2 className={styles.passoTitulo}>
                                                <span className={styles.somenteLeitor}>{t('ajuda.passoNumero', { n: i + 1 })}: </span>
                                                {p.titulo}
                                            </h2>
                                            <TextoDoPasso
                                                texto={p.texto}
                                                enderecoDoArtigo={enderecoDoArtigo}
                                                classeParagrafo={styles.passoParagrafo}
                                                classeLista={styles.passoLista}
                                            />
                                        </div>
                                        {print && (
                                            <figure className={styles.celular}>
                                                <img src={print} alt={t('ajuda.printAlt', { n: i + 1, titulo: p.titulo })} loading="lazy" decoding="async" />
                                            </figure>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>

                    {relacionados.length > 0 && (
                        <section className={styles.secaoArtigo} aria-labelledby="ajuda-relacionados">
                            <h2 id="ajuda-relacionados" className={styles.secaoTituloMenor}>{t('ajuda.relacionados')}</h2>
                            <div className={styles.gradeRelacionados}>
                                {relacionados.map((a) => (
                                    <Link key={a.id} to={`/ajuda/${idioma}/${a.slug}`} className={styles.relacionado}>
                                        <span className={styles.iconeCaixaPequena}><IconeModulo nome={indice.modulos.find((m) => m.id === a.modulo)?.icone} size={18} /></span>
                                        {a.titulo}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {(anterior || proximo) && (
                        <nav className={styles.anteriorProximo} aria-label={t('ajuda.navegacaoArtigos')}>
                            {anterior ? (
                                <Link to={`/ajuda/${idioma}/${anterior.slug}`} className={styles.cartaoNavegacao}>
                                    <span className={styles.cartaoNavegacaoRotulo}>← {t('ajuda.anterior')}</span>
                                    <span>{anterior.titulo}</span>
                                </Link>
                            ) : <span />}
                            {proximo && (
                                <Link to={`/ajuda/${idioma}/${proximo.slug}`} className={`${styles.cartaoNavegacao} ${styles.cartaoNavegacaoProximo}`}>
                                    <span className={styles.cartaoNavegacaoRotulo}>{t('ajuda.proximo')} →</span>
                                    <span>{proximo.titulo}</span>
                                </Link>
                            )}
                        </nav>
                    )}
                </article>

                <aside className={styles.lateral}>
                    {passos.length > 1 && (
                        <nav className={styles.caixaLateral} aria-labelledby="ajuda-sumario">
                            <h2 id="ajuda-sumario" className={styles.caixaLateralTitulo}>{t('ajuda.nesteArtigo')}</h2>
                            <ol className={styles.sumario}>
                                {passos.map((p, i) => (
                                    <li key={i}><a href={`#passo-${i + 1}`}>{i + 1}. {p.titulo}</a></li>
                                ))}
                            </ol>
                        </nav>
                    )}

                    {antes.length > 0 && (
                        <div className={styles.caixaLateral}>
                            <h2 className={styles.caixaLateralTitulo}>{t('ajuda.antesDeComecar')}</h2>
                            <ul className={styles.listaSimples}>
                                {antes.map((a) => <li key={a.id}><Link to={`/ajuda/${idioma}/${a.slug}`}>{a.titulo}</Link></li>)}
                            </ul>
                        </div>
                    )}

                    <div className={`${styles.caixaLateral} ${styles.caixaApp}`}>
                        <h2 className={styles.caixaAppTitulo}><Smartphone size={18} aria-hidden="true" />{t('ajuda.appTitulo')}</h2>
                        <p>{t('ajuda.appTexto')}</p>
                        <a className={styles.botao} href={ENDERECO_APP} target="_blank" rel="noopener noreferrer">
                            {t('ajuda.appBotao')}<ExternalLink size={16} aria-hidden="true" />
                        </a>
                    </div>

                    {outrosIdiomas.length > 0 && (
                        <div className={styles.caixaLateral}>
                            <h2 className={styles.caixaLateralTitulo}>{t('ajuda.tambemEm')}</h2>
                            <ul className={styles.listaIdiomas}>
                                {outrosIdiomas.map((i) => (
                                    <li key={i}>
                                        <Link to={`/ajuda/${i}/${doc.conteudo[i].slug}`} hrefLang={i} lang={i}>{NOMES_IDIOMAS[i]}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>
            </div>

            <BandaSuporte />
        </div>
    );
}
