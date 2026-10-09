import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import AjudaBusca from './AjudaBusca.jsx';
import IconeModulo from './IconeModulo.jsx';
import { BandaSuporte, NaoEncontrado, Trilha } from './Estados.jsx';
import useTituloDaPagina from './useTituloDaPagina.js';
import styles from './Ajuda.module.css';

export default function AjudaAssunto({ idioma, indice, preparado, modulo }) {
    const { t } = useTranslation();
    const atual = indice.modulos.find((m) => m.id === modulo) ?? null;
    useTituloDaPagina(
        atual ? `${atual.nome} · ${t('ajuda.titulo')} · ObraFácil` : null,
        atual?.descricao ?? null,
    );
    if (!atual) return <NaoEncontrado idioma={idioma} titulo={t('ajuda.assuntoNaoEncontrado')} />;

    const artigos = indice.artigos.filter((a) => a.modulo === modulo);
    const outros = indice.modulos.filter((m) => m.id !== modulo);

    return (
        <div className={styles.container}>
            <div className={styles.topoPagina}>
                <Trilha itens={[{ texto: t('ajuda.titulo'), para: `/ajuda/${idioma}` }, { texto: atual.nome }]} />
                <AjudaBusca idioma={idioma} indice={indice} preparado={preparado} compacto />
            </div>

            <header className={styles.cabecalhoAssunto}>
                <span className={styles.iconeCaixaGrande}><IconeModulo nome={atual.icone} size={28} /></span>
                <div>
                    <h1 className={styles.tituloPagina}>{atual.nome}</h1>
                    {atual.descricao && <p className={styles.resumoPagina}>{atual.descricao}</p>}
                    <p className={styles.contagem}>{t('ajuda.artigos', { count: artigos.length })}</p>
                </div>
            </header>

            <ol className={styles.listaArtigos}>
                {artigos.map((a) => (
                    <li key={a.id}>
                        <Link to={`/ajuda/${idioma}/${a.slug}`} className={styles.itemArtigo}>
                            <span className={styles.itemArtigoTexto}>
                                <span className={styles.itemArtigoTipo}>{t(`ajuda.tipo_${a.tipo}`)}</span>
                                <span className={styles.itemArtigoTitulo}>{a.titulo}</span>
                                <span className={styles.itemArtigoResumo}>{a.resumo}</span>
                            </span>
                            <ChevronRight size={20} aria-hidden="true" className={styles.linhaSeta} />
                        </Link>
                    </li>
                ))}
            </ol>

            {outros.length > 0 && (
                <section className={styles.secao} aria-labelledby="ajuda-outros">
                    <h2 id="ajuda-outros" className={styles.secaoTituloMenor}>{t('ajuda.outrosAssuntos')}</h2>
                    <div className={styles.chipsAssuntos}>
                        {outros.map((m) => (
                            <Link key={m.id} to={`/ajuda/${idioma}/assunto/${m.id}`} className={styles.chipAssunto}>
                                <IconeModulo nome={m.icone} size={16} />{m.nome}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <BandaSuporte />
        </div>
    );
}
