import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import AjudaBusca from './AjudaBusca.jsx';
import IconeModulo from './IconeModulo.jsx';
import { BandaSuporte, NaoEncontrado, Trilha } from './Estados.jsx';
import useTituloDaPagina from './useTituloDaPagina.js';
import { descricaoDaPagina, tituloDaPagina } from '../../seo/textos.js';
import styles from './Ajuda.module.css';

// atual: módulo achado pelo endereço (ou null); pedido: o pedaço do endereço como veio.
export default function AjudaAssunto({ indice, preparado, rotas, atual, pedido }) {
    const { t } = useTranslation();
    useTituloDaPagina(
        atual ? tituloDaPagina(t, { tipo: 'assunto' }, { modulo: atual }) : null,
        atual ? descricaoDaPagina(t, { tipo: 'assunto' }, { modulo: atual }) : null,
    );
    if (!atual) return <NaoEncontrado para={rotas.inicio} titulo={t('ajuda.assuntoNaoEncontrado')} />;
    // Endereço com o id ou com o nome em outro idioma: troca pelo endereço certo deste idioma.
    const certo = rotas.assunto(atual);
    if (certo.split('/').pop() !== pedido) return <Navigate to={certo} replace />;
    const modulo = atual.id;

    const artigos = indice.artigos.filter((a) => a.modulo === modulo);
    const outros = indice.modulos.filter((m) => m.id !== modulo);

    return (
        <div className={styles.container}>
            <div className={styles.topoPagina}>
                <Trilha itens={[{ texto: t('ajuda.titulo'), para: rotas.inicio }, { texto: atual.nome }]} />
                <AjudaBusca rotas={rotas} indice={indice} preparado={preparado} compacto />
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
                        <Link to={rotas.artigo(a.slug)} className={styles.itemArtigo}>
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
                            <Link key={m.id} to={rotas.assunto(m)} className={styles.chipAssunto}>
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
