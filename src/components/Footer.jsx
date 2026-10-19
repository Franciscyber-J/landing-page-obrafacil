// Rodapé: chamada curta (fora da página inicial, que já tem a dela), colunas de links e o idioma.
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { IDIOMAS, caminhoAjuda, caminhoInicio, caminhoLegal } from '../i18n/idiomas.js';
import { useIdioma, useTrocarIdioma } from '../i18n/RotaDoIdioma.jsx';
import { abrirAvisoCookies } from '../legal/cookies.js';
import { CADASTRO, WINDOWS, appStore, googlePlay, linkWhatsApp } from '../links.js';
import styles from './Footer.module.css';

export default function Footer({ comChamada = true }) {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const trocarIdioma = useTrocarIdioma();

    return (
        <footer className={styles.rodape}>
            {comChamada && (
                <div className={styles.chamada}>
                    <div className={`container ${styles.chamadaConteudo}`}>
                        <p className={styles.chamadaTitulo}>{t('footer.ctaTitle')}</p>
                        <a href={CADASTRO} className="acao">{t('footer.ctaBtn')}</a>
                    </div>
                </div>
            )}

            <div className={`container ${styles.grade}`}>
                <div className={styles.marca}>
                    <Link to={caminhoInicio(codigo)} className={styles.logo} aria-label={t('nav.inicio')}>
                        <img src="/logo_transparente.png" alt="ObraFácil" width="1050" height="238" loading="lazy" />
                    </Link>
                    <p className={styles.frase}>{t('footer.tagline')}</p>
                    <label className={styles.idioma}>
                        <span>{t('footer.language')}</span>
                        <select value={codigo} onChange={(e) => trocarIdioma(e.target.value)}>
                            {IDIOMAS.map((i) => (
                                <option key={i.codigo} value={i.codigo} lang={i.codigo}>{i.nome}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <nav className={styles.coluna} aria-labelledby="rodape-produto">
                    <h2 id="rodape-produto">{t('footer.produto')}</h2>
                    <ul>
                        <li><Link to={caminhoInicio(codigo, 'recursos')}>{t('nav.recursos')}</Link></li>
                        <li><Link to={caminhoInicio(codigo, 'precos')}>{t('nav.precos')}</Link></li>
                        <li><Link to={caminhoAjuda(codigo)}>{t('footer.help')}</Link></li>
                    </ul>
                </nav>

                <nav className={styles.coluna} aria-labelledby="rodape-baixar">
                    <h2 id="rodape-baixar">{t('footer.baixar')}</h2>
                    <ul>
                        <li><a href={googlePlay(codigo)} target="_blank" rel="noopener noreferrer">Google Play</a></li>
                        <li><a href={appStore()} target="_blank" rel="noopener noreferrer">App Store</a></li>
                        <li><a href={WINDOWS}>Windows</a></li>
                    </ul>
                </nav>

                <nav className={styles.coluna} aria-labelledby="rodape-legal">
                    <h2 id="rodape-legal">{t('footer.legal')}</h2>
                    <ul>
                        <li><Link to={caminhoLegal(codigo, 'termos')}>{t('footer.terms')}</Link></li>
                        <li><Link to={caminhoLegal(codigo, 'privacidade')}>{t('footer.privacy')}</Link></li>
                        <li><button type="button" onClick={abrirAvisoCookies}>{t('cookies.preferencias')}</button></li>
                    </ul>
                </nav>

                <nav className={styles.coluna} aria-labelledby="rodape-contato">
                    <h2 id="rodape-contato">{t('footer.contato')}</h2>
                    <ul>
                        <li>
                            <a href={linkWhatsApp(t('whatsapp.message'))} target="_blank" rel="noopener noreferrer">
                                {t('footer.whatsapp')}
                            </a>
                        </li>
                        <li>
                            <a href="https://appobrafacil.expertbr.com/suporte/" target="_blank" rel="noopener noreferrer">
                                {t('footer.support')}
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>

            <div className={`container ${styles.base}`}>
                <p>&copy; {new Date().getFullYear()} ObraFácil. {t('footer.rights')}</p>
            </div>
        </footer>
    );
}
