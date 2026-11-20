// Página "Modelos grátis" (modo de convencer): o diário de obra e os 27 checklists de qualidade do app, por grupo,
// cada um com a página dele e o PDF direto na lista, e o que o mesmo modelo faz no app. O primeiro desenho só depende
// do idioma e dos dados do idioma (igual no build e no navegador).
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, NotebookPen } from 'lucide-react';
import { caminhoModelos } from '../../i18n/idiomas.js';
import { useRotaEquivalente } from '../../i18n/RotaDoIdioma.jsx';
import { useDadosDosModelos } from '../../modelos/carregar.js';
import {
    CAMPOS_DO_DIARIO, DIARIO, caminhoDoModelo, contagem, gruposComModelos, modeloPeloId, rotuloDoApp,
} from '../../modelos/modelos.js';
import { comDestaque } from '../../texto.jsx';
import { descricaoDaPagina, tituloDaPagina } from '../../seo/textos.js';
import { useLinkComecar } from '../../useNavegador.js';
import useCabecaDaPagina from '../conta/useCabecaDaPagina.js';
import { BaixarPdf, Carregando, Erro, NoApp, NotaDoPdf, Trilha } from './partes.jsx';
import styles from './Modelos.module.css';

// Folha do diário de obra desenhada com os campos reais do app (os mesmos do PDF): mostra o que a pessoa leva.
function FolhaDoDiario({ dados, nome }) {
    return (
        <div className={styles.folha} aria-hidden="true">
            <span className={styles.folhaTitulo}>{nome}</span>
            {CAMPOS_DO_DIARIO.filter((c) => !['data', 'avanco'].includes(c.id)).slice(0, 6).map((c) => (
                <span key={c.id} className={styles.folhaLinha}>
                    <span>{rotuloDoApp(dados, c.rotulo)}</span>
                    <span className={styles.folhaRisco} />
                </span>
            ))}
        </div>
    );
}

function Diario({ codigo, dados }) {
    const { t } = useTranslation();
    const modelo = modeloPeloId(dados, codigo, DIARIO);
    const nome = t('recursos.itens.diario.titulo');
    return (
        <section className={styles.destaqueDiario} aria-labelledby="modelos-diario">
            <div className={styles.destaqueTexto}>
                <span className={styles.destaqueIcone} aria-hidden="true"><NotebookPen size={24} strokeWidth={2.25} /></span>
                <h2 id="modelos-diario" className={styles.destaqueTitulo}>
                    <Link to={caminhoDoModelo(codigo, modelo)}>{nome}</Link>
                </h2>
                <p className={styles.destaqueParagrafo}>{t('modelos.indice.diarioTexto')}</p>
                <div className={styles.acoes}>
                    <Link to={caminhoDoModelo(codigo, modelo)} className={`acao-contorno ${styles.botao}`}>
                        {t('modelos.indice.abrir')}
                        <ArrowRight size={18} aria-hidden="true" className="seta" />
                    </Link>
                    <BaixarPdf codigo={codigo} modelo={modelo} nome={nome} />
                </div>
                <NotaDoPdf codigo={codigo} />
            </div>
            <FolhaDoDiario dados={dados} nome={nome} />
        </section>
    );
}

function Checklists({ codigo, dados }) {
    const { t } = useTranslation();
    return (
        <section id="checklists" className={styles.checklists} aria-labelledby="modelos-checklists">
            <div className={styles.checklistsTopo}>
                <span className={styles.destaqueIcone} aria-hidden="true"><ClipboardCheck size={24} strokeWidth={2.25} /></span>
                <h2 id="modelos-checklists" className={styles.checklistsTitulo}>{t('recursos.itens.checklists.titulo')}</h2>
                <p className={styles.destaqueParagrafo}>{t('modelos.indice.checklistsTexto')}</p>
            </div>
            <div className={styles.grupos}>
                {gruposComModelos(dados, codigo).map((g) => (
                    <section key={g.id} className={styles.grupo} aria-labelledby={`grupo-${g.id}`}>
                        <h3 id={`grupo-${g.id}`} className={styles.grupoTitulo}>{g.nome}</h3>
                        <ul className={styles.linhas}>
                            {g.modelos.map((m) => {
                                const c = contagem(m);
                                return (
                                    <li key={m.id} className={styles.linha}>
                                        <Link to={caminhoDoModelo(codigo, m)} className={styles.linhaLink}>
                                            <span className={styles.linhaNome}>{m.nome}</span>
                                            <span className={styles.linhaConta}>
                                                {t('modelos.itens', { count: c.itens })}
                                                {c.criticos > 0 && ` · ${t('modelos.criticos', { count: c.criticos })}`}
                                            </span>
                                        </Link>
                                        <BaixarPdf codigo={codigo} modelo={m} nome={m.nome} compacto />
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>
            <p className={styles.notaBiblioteca}>{dados.biblioteca.nota}</p>
        </section>
    );
}

function Conteudo({ codigo, dados }) {
    const { t } = useTranslation();
    const comecar = useLinkComecar(codigo);
    const pagina = { tipo: 'modelos', codigo };
    useCabecaDaPagina({ titulo: tituloDaPagina(t, pagina), descricao: descricaoDaPagina(t, pagina) });
    return (
        <main className={styles.pagina}>
            <div className={styles.brilho} aria-hidden="true" />
            <div className={styles.conteudo}>
                <Trilha codigo={codigo} itens={[{ texto: t('modelos.nav') }]} />
                <header className={`${styles.cabeca} ${styles.cabecaIndice}`} data-painel>
                    <h1 className={styles.titulo}>{comDestaque(t('modelos.indice.titulo'))}</h1>
                    <p className={styles.texto}>{t('modelos.indice.texto')}</p>
                    <div className={styles.acoes}>
                        <a href="#checklists" className={`acao-clara ${styles.botao}`}>{t('modelos.indice.verChecklists')}</a>
                        <a {...comecar} className={`acao ${styles.botao}`}>{t('footer.ctaBtn')}</a>
                    </div>
                </header>
                <Diario codigo={codigo} dados={dados} />
                <Checklists codigo={codigo} dados={dados} />
                <NoApp codigo={codigo} tipo="checklist" id="modelos-no-app" />
            </div>
        </main>
    );
}

export default function ModelosPagina({ codigo }) {
    const { dados, erro, tentarDeNovo } = useDadosDosModelos(codigo);
    useRotaEquivalente((outro) => caminhoModelos(outro), []);
    if (erro) return <main className={styles.pagina}><div className={styles.conteudo}><Erro aoTentarDeNovo={tentarDeNovo} /></div></main>;
    if (!dados) return <main className={styles.pagina}><div className={styles.conteudo}><Carregando /></div></main>;
    return <Conteudo codigo={codigo} dados={dados} />;
}
