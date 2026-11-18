// Contato do suporte (endereço antigo /suporte/, que era do WordPress): WhatsApp e/ou conversa com o Max (pelo país do
// visitante, useContato), e-mail, chamado pelo app e Central de Ajuda. Esta página pode aparecer no Google.
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookOpen, LifeBuoy, Mail, MessageCircle, MessagesSquare, Store, Ticket } from 'lucide-react';
import { caminhoAjuda, caminhoPerfil, caminhoSuporte } from '../../i18n/idiomas.js';
import { caminhoDoArtigoDoSite } from '../../ajuda/artigosDoSite.js';
import { useRotaEquivalente } from '../../i18n/RotaDoIdioma.jsx';
import { EMAIL_SUPORTE } from '../../links.js';
import { useContato } from '../atendimento/useContato.js';
import { comNegrito } from '../../texto.jsx';
import { Cabeca, Cartao, Pagina, Paragrafo } from './partes.jsx';
import useCabecaDaPagina from './useCabecaDaPagina.js';
import styles from './Conta.module.css';

function Canal({ icone: Icone, titulo, texto, children }) {
    return (
        <li className={styles.canal}>
            <span className={styles.canalIcone} aria-hidden="true"><Icone size={22} strokeWidth={2.25} /></span>
            <h3 className={styles.canalTitulo}>{titulo}</h3>
            <p className={styles.canalTexto}>{comNegrito(texto)}</p>
            <div className={styles.canalAcao}>{children}</div>
        </li>
    );
}

export default function SuportePagina({ codigo }) {
    const { t } = useTranslation();
    const contato = useContato('suporte');

    useRotaEquivalente((outro) => caminhoSuporte(outro), []);
    useCabecaDaPagina({ titulo: t('suporte.metaTitulo'), descricao: t('suporte.metaDescricao') });

    return (
        <Pagina>
            <Cabeca icone={LifeBuoy} sobretitulo={t('suporte.sobretitulo')} titulo={t('suporte.titulo')} texto={t('suporte.texto')} />

            <section className={styles.canais} aria-labelledby="suporte-canais">
                <h2 id="suporte-canais" className={styles.secaoTitulo}>{t('suporte.canaisTitulo')}</h2>
                <ul className={styles.gradeCanais}>
                    {contato.conversa && (
                        <Canal icone={MessagesSquare} titulo={t('atendimento.suporteTitulo')} texto={t('atendimento.suporteTexto')}>
                            <button type="button" onClick={contato.abrir} aria-haspopup="dialog" className={`acao ${styles.botao}`}>
                                {t('atendimento.conversar')}
                            </button>
                        </Canal>
                    )}
                    {contato.whatsapp && (
                        <Canal icone={MessageCircle} titulo={t('suporte.whatsappTitulo')} texto={t('suporte.whatsappTexto')}>
                            <a href={contato.linkWhatsApp(t('suporte.whatsappMensagem'))} target="_blank" rel="noopener noreferrer" className={`acao${contato.conversa ? '-contorno' : ''} ${styles.botao}`}>
                                {t('suporte.whatsappBotao')}
                            </a>
                        </Canal>
                    )}
                    <Canal icone={Mail} titulo={t('suporte.emailTitulo')} texto={t('suporte.emailTexto')}>
                        <p className={styles.endereco}>{EMAIL_SUPORTE}</p>
                        <a href={`mailto:${EMAIL_SUPORTE}`} className={`acao-contorno ${styles.botao}`}>{t('suporte.emailBotao')}</a>
                    </Canal>
                    <Canal icone={Ticket} titulo={t('suporte.chamadoTitulo')} texto={t('suporte.chamadoTexto')}>
                        <Link to={caminhoDoArtigoDoSite(codigo, 'abrir-chamado')} className={`acao-contorno ${styles.botao}`}>{t('suporte.chamadoBotao')}</Link>
                    </Canal>
                    <Canal icone={BookOpen} titulo={t('suporte.centralTitulo')} texto={t('suporte.centralTexto')}>
                        <Link to={caminhoAjuda(codigo)} className={`acao-contorno ${styles.botao}`}>{t('suporte.centralBotao')}</Link>
                    </Canal>
                </ul>
            </section>

            <Cartao id="suporte-lojas" titulo={t('suporte.lojasTitulo')} icone={Store}>
                <Paragrafo>{t('suporte.lojasTexto')}</Paragrafo>
                <Link to={caminhoPerfil(codigo)} className={`acao-contorno ${styles.botao} ${styles.botaoCartao}`}>{t('suporte.perfilLink')}</Link>
            </Cartao>
        </Pagina>
    );
}
