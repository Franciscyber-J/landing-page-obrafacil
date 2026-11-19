import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, MessagesSquare, RefreshCw, SearchX, Hourglass } from 'lucide-react';
import useTituloDaPagina from './useTituloDaPagina.js';
import useCabecaDaPagina from '../conta/useCabecaDaPagina.js';
import { useContato } from '../atendimento/useContato.js';
import styles from './Ajuda.module.css';

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
    // Tela de erro não é conteúdo: fora do Google (noindex). Sem isso, um robô que não consegue ler a Central vê a
    // mesma tela em endereços diferentes e os trata como cópias uns dos outros.
    useCabecaDaPagina({ semIndexar: true });
    return (
        <Aviso icone={<RefreshCw size={28} aria-hidden="true" />} titulo={t('ajuda.erroTitulo')} texto={t('ajuda.erroTexto')}>
            <button type="button" className={styles.botao} onClick={aoTentarDeNovo}>{t('ajuda.tentarDeNovo')}</button>
            <Contato classe={styles.botaoContorno} />
        </Aviso>
    );
}

export function NadaPublicado() {
    const { t } = useTranslation();
    useTituloDaPagina(`${t('ajuda.titulo')} · ObraFácil`);
    useCabecaDaPagina({ semIndexar: true }); // sem conteúdo: fora do Google, como a tela de erro
    return (
        <Aviso icone={<Hourglass size={28} aria-hidden="true" />} titulo={t('ajuda.vazioTitulo')} texto={t('ajuda.vazioTexto')}>
            <Contato classe={styles.botao} />
        </Aviso>
    );
}

export function NaoEncontrado({ para, titulo }) {
    const { t } = useTranslation();
    useTituloDaPagina(`${titulo} · ${t('ajuda.titulo')} · ObraFácil`);
    // Endereço que não leva a nada: fora do Google (noindex), mesmo respondendo pela página do site.
    useCabecaDaPagina({ semIndexar: true });
    return (
        <Aviso icone={<SearchX size={28} aria-hidden="true" />} titulo={titulo} texto={t('ajuda.naoEncontradoTexto')}>
            <Link className={styles.botao} to={para}>{t('ajuda.voltarCentral')}</Link>
        </Aviso>
    );
}

// Contato da Central: WhatsApp, conversa com o Max ou os dois, pelo país do visitante (useContato). Nos dois, a
// conversa vem primeiro (responde na hora) e o WhatsApp ao lado, com o contorno.
export function Contato({ classe, classeSegunda = styles.botaoContorno }) {
    const { t } = useTranslation();
    const contato = useContato('ajuda');
    return (
        <>
            {contato.conversa && (
                <button type="button" className={classe} onClick={contato.abrir} aria-haspopup="dialog">
                    <MessagesSquare size={18} aria-hidden="true" />
                    {t('atendimento.conversar')}
                </button>
            )}
            {contato.whatsapp && (
                <a className={contato.conversa ? classeSegunda : classe} href={contato.linkWhatsApp(t('ajuda.suporteMensagem'))} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={18} aria-hidden="true" />
                    {t('ajuda.suporteBotao')}
                </a>
            )}
        </>
    );
}

const TEXTO_DO_SUPORTE = { so_whatsapp: 'ajuda.suporteTexto', os_dois: 'atendimento.ajudaTextoDois', so_chat: 'atendimento.ajudaTextoChat' };

export function BandaSuporte() {
    const { t } = useTranslation();
    const { grupo } = useContato('ajuda');
    return (
        <section className={styles.suporte} aria-labelledby="ajuda-suporte">
            <div className={styles.suporteTexto}>
                <h2 id="ajuda-suporte" className={styles.suporteTitulo}>{t('ajuda.suporteTitulo')}</h2>
                <p>{t(TEXTO_DO_SUPORTE[grupo])}</p>
            </div>
            <div className={styles.suporteAcoes}>
                <Contato classe={styles.botao} classeSegunda={styles.botaoClaro} />
            </div>
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
