import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Smartphone, Users, ListOrdered } from 'lucide-react';
import { printDoPasso } from '../../ajuda/dados.js';
import { idiomaDoConteudo } from '../../ajuda/idiomas.js';
import { IDIOMAS, caminhoArtigo } from '../../i18n/idiomas.js';
import AjudaBusca from './AjudaBusca.jsx';
import IconeModulo from './IconeModulo.jsx';
import TextoDoPasso from './TextoDoPasso.jsx';
import PrintComMarcacao from './PrintComMarcacao.jsx';
import { BandaSuporte, Carregando, ErroAoCarregar, NaoEncontrado, Trilha } from './Estados.jsx';
import useTituloDaPagina from './useTituloDaPagina.js';
import { descricaoDaPagina, tituloDaPagina } from '../../seo/textos.js';
import styles from './Ajuda.module.css';

const ENDERECO_APP = 'https://obrafacilapp.expertbr.com';

// "gestor e equipe", "manager, team and client"...
function listaDePublico(publico, t) {
    const nomes = publico.map((p) => t(`ajuda.publico_${p}`));
    if (nomes.length <= 1) return nomes.join('');
    return `${nomes.slice(0, -1).join(', ')} ${t('ajuda.e')} ${nomes[nomes.length - 1]}`;
}

// artigo: { tipo: carregando | pronto | erro | sumiu, doc, tentarDeNovo } (carregado em AjudaPagina).
export default function AjudaArtigo({ codigo, idioma, indice, preparado, rotas, entrada, slug, artigo }) {
    const { t } = useTranslation();
    const porId = useMemo(() => new Map(indice.artigos.map((a) => [a.id, a])), [indice]);
    const modulo = entrada ? indice.modulos.find((m) => m.id === entrada.modulo) : null;
    useTituloDaPagina(
        entrada ? tituloDaPagina(t, { tipo: 'artigo' }, { entrada }) : null,
        entrada ? descricaoDaPagina(t, { tipo: 'artigo' }, { entrada }) : null,
    );

    if (!entrada) return <NaoEncontrado para={rotas.inicio} titulo={t('ajuda.naoEncontradoTitulo')} />;
    // Endereço pelo id ou com o nome antigo: troca pelo endereço certo deste idioma.
    if (slug !== entrada.slug) return <Navigate to={rotas.artigo(entrada.slug)} replace />;

    const enderecoDoArtigo = (id) => (porId.has(id) ? rotas.artigo(porId.get(id).slug) : null);
    const trilha = (
        <div className={styles.topoPagina}>
            <Trilha itens={[
                { texto: t('ajuda.titulo'), para: rotas.inicio },
                ...(modulo ? [{ texto: modulo.nome, para: rotas.assunto(modulo) }] : []),
                { texto: entrada.titulo },
            ]} />
            <AjudaBusca rotas={rotas} indice={indice} preparado={preparado} compacto />
        </div>
    );

    if (artigo.tipo === 'carregando') return <>{trilha}<Carregando /></>;
    if (artigo.tipo === 'erro') return <ErroAoCarregar aoTentarDeNovo={artigo.tentarDeNovo} />;
    if (artigo.tipo === 'sumiu') return <NaoEncontrado para={rotas.inicio} titulo={t('ajuda.naoEncontradoTitulo')} />;

    const doc = artigo.doc;
    const conteudo = doc.conteudo[idioma];
    const passos = conteudo.passos ?? [];
    const antes = (doc.pre_requisitos ?? []).map((id) => porId.get(id)).filter(Boolean);
    const relacionados = (doc.relacionados ?? []).map((id) => porId.get(id)).filter(Boolean);
    const doModulo = indice.artigos.filter((a) => a.modulo === entrada.modulo);
    const posicao = doModulo.findIndex((a) => a.id === entrada.id);
    const anterior = posicao > 0 ? doModulo[posicao - 1] : null;
    const proximo = posicao >= 0 && posicao < doModulo.length - 1 ? doModulo[posicao + 1] : null;
    const outrosIdiomas = IDIOMAS
        .filter((i) => i.codigo !== codigo)
        .map((i) => ({ ...i, slug: doc.conteudo[idiomaDoConteudo(i.codigo)]?.slug }))
        .filter((i) => i.slug);

    return (
        <div className={styles.container}>
            {trilha}

            <header className={styles.cabecalhoArtigo}>
                {modulo && (
                    <Link to={rotas.assunto(modulo)} className={styles.sobretituloLink}>
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
                            const print = printDoPasso(p);
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
                                                <PrintComMarcacao
                                                    key={print.endereco}
                                                    src={print.endereco}
                                                    alt={t('ajuda.printAlt', { n: i + 1, titulo: p.titulo })}
                                                    marcacao={print.marcacao}
                                                />
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
                                    <Link key={a.id} to={rotas.artigo(a.slug)} className={styles.relacionado}>
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
                                <Link to={rotas.artigo(anterior.slug)} className={styles.cartaoNavegacao}>
                                    <span className={styles.cartaoNavegacaoRotulo}><span className="seta" aria-hidden="true">←</span> {t('ajuda.anterior')}</span>
                                    <span>{anterior.titulo}</span>
                                </Link>
                            ) : <span />}
                            {proximo && (
                                <Link to={rotas.artigo(proximo.slug)} className={`${styles.cartaoNavegacao} ${styles.cartaoNavegacaoProximo}`}>
                                    <span className={styles.cartaoNavegacaoRotulo}>{t('ajuda.proximo')} <span className="seta" aria-hidden="true">→</span></span>
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
                                {antes.map((a) => <li key={a.id}><Link to={rotas.artigo(a.slug)}>{a.titulo}</Link></li>)}
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
                                    <li key={i.codigo}>
                                        <Link to={caminhoArtigo(i.codigo, i.slug)} hrefLang={i.codigo} lang={i.codigo}>{i.nome}</Link>
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
