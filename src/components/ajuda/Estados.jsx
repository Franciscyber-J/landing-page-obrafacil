import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, RefreshCw, SearchX, Hourglass } from 'lucide-react';
import useTituloDaPagina from './useTituloDaPagina.js';
import styles from './Ajuda.module.css';

const WHATSAPP = '5562992666759';

export function Carregando() {
    const { t } = useTranslation();
    return (
        <div className={styles.container} role="status" aria-live="polite">
            <span className={styles.somenteLeitor}>{t('ajuda.carregando')}</span>
            <div className={styles.esqueleto} aria-hidden="true">
                <div className={styles.esqLinhaCurta} />
                <div className={styles.esqTitulo} />
                <div className={styles.esqLinha} />
                <div className={styles.esqBusca} />
                <div className={styles.esqGrade}>
                    {Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.esqCartao} />)}
                </div>
            </div>
        </div>
    );
}

function Aviso({ icone, titulo, texto, children }) {
    return (
        <div className={styles.container}>
            <div className={styles.aviso}>
                <span className={styles.avisoIcone}>{icone}</span>
                <h1 className={styles.avisoTitulo}>{titulo}</h1>
                <p className={styles.avisoTexto}>{texto}</p>
                <div className={styles.avisoAcoes}>{children}</div>
            </div>
        </div>
    );
}

export function ErroAoCarregar({ aoTentarDeNovo }) {
    const { t } = useTranslation();
    useTituloDaPagina(`${t('ajuda.titulo')} · ObraFácil`);
    return (
        <Aviso icone={<RefreshCw size={28} aria-hidden="true" />} titulo={t('ajuda.erroTitulo')} texto={t('ajuda.erroTexto')}>
            <button type="button" className={styles.botao} onClick={aoTentarDeNovo}>{t('ajuda.tentarDeNovo')}</button>
            <LinkWhatsApp classe={styles.botaoContorno} />
        </Aviso>
    );
}

export function NadaPublicado() {
    const { t } = useTranslation();
    useTituloDaPagina(`${t('ajuda.titulo')} · ObraFácil`);
    return (
        <Aviso icone={<Hourglass size={28} aria-hidden="true" />} titulo={t('ajuda.vazioTitulo')} texto={t('ajuda.vazioTexto')}>
            <LinkWhatsApp classe={styles.botao} />
        </Aviso>
    );
}

export function NaoEncontrado({ para, titulo }) {
    const { t } = useTranslation();
    useTituloDaPagina(`${titulo} · ${t('ajuda.titulo')} · ObraFácil`);
    return (
        <Aviso icone={<SearchX size={28} aria-hidden="true" />} titulo={titulo} texto={t('ajuda.naoEncontradoTexto')}>
            <Link className={styles.botao} to={para}>{t('ajuda.voltarCentral')}</Link>
        </Aviso>
    );
}

export function LinkWhatsApp({ classe }) {
    const { t } = useTranslation();
    const endereco = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t('ajuda.suporteMensagem'))}`;
    return (
        <a className={classe} href={endereco} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={18} aria-hidden="true" />
            {t('ajuda.suporteBotao')}
        </a>
    );
}

export function BandaSuporte() {
    const { t } = useTranslation();
    return (
        <section className={styles.suporte} aria-labelledby="ajuda-suporte">
            <div className={styles.suporteTexto}>
                <h2 id="ajuda-suporte" className={styles.suporteTitulo}>{t('ajuda.suporteTitulo')}</h2>
                <p>{t('ajuda.suporteTexto')}</p>
            </div>
            <LinkWhatsApp classe={styles.botao} />
        </section>
    );
}

// Trilha "Central de Ajuda / Assunto / Artigo".
export function Trilha({ itens }) {
    const { t } = useTranslation();
    return (
        <nav aria-label={t('ajuda.trilha')} className={styles.trilha}>
            <ol>
                {itens.map((item, i) => (
                    <li key={i}>
                        {item.para ? <Link to={item.para}>{item.texto}</Link> : <span aria-current="page">{item.texto}</span>}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
