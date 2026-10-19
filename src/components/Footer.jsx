import { useTranslation } from 'react-i18next';
import { ArrowRight, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IDIOMAS, caminhoAjuda, caminhoLegal } from '../i18n/idiomas.js';
import { useIdioma, useTrocarIdioma } from '../i18n/RotaDoIdioma.jsx';
import { abrirAvisoCookies } from '../legal/cookies.js';
import styles from './Footer.module.css';

export default function Footer() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const trocarIdioma = useTrocarIdioma();

    return (
        <footer className={styles.footer}>
            {/* Final CTA Section */}
            <div className={styles.ctaSection}>
                <div className="container text-center">
                    <h2 className={styles.ctaTitle}>{t('footer.ctaTitle')}</h2>
                    <a href="https://obrafacilapp.expertbr.com/cadastro?checkout=true&promo=30DIASFREE" className="btn-neon flex items-center gap-2" style={{ margin: '0 auto', fontSize: '1.2rem', padding: '16px 36px', display: 'inline-flex', justifyContent: 'center' }}>
                        {t('footer.ctaBtn')}
                        <ArrowRight size={20} />
                    </a>
                </div>
                <div className={styles.glowBg}></div>
            </div>

            {/* Main Footer Content */}
            <div className={`container ${styles.mainContent}`}>
                <div className={styles.grid}>

                    {/* Brand */}
                    <div className={styles.brandCol}>
                        <div className={styles.logo}>
                            <span className="neon-text">Obra Fácil</span>
                        </div>
                        <p className={styles.tagline}>
                            {t('footer.tagline')}
                        </p>

                        <div className={styles.langSelector}>
                            <Globe size={18} aria-hidden="true" />
                            <select
                                onChange={(e) => trocarIdioma(e.target.value)}
                                value={codigo}
                                className={styles.select}
                                aria-label={t('footer.language')}
                            >
                                {IDIOMAS.map((i) => (
                                    <option key={i.codigo} value={i.codigo} lang={i.codigo}>{i.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Links */}
                    <div className={styles.linksCol}>
                        <h4 className={styles.colTitle}>{t('footer.links')}</h4>
                        <ul className={styles.linkList}>
                            <li><Link to={caminhoLegal(codigo, 'termos')}>{t('footer.terms')}</Link></li>
                            <li><Link to={caminhoLegal(codigo, 'privacidade')}>{t('footer.privacy')}</Link></li>
                            <li><button type="button" className={styles.linkBotao} onClick={abrirAvisoCookies}>{t('cookies.preferencias')}</button></li>
                            <li><Link to={caminhoAjuda(codigo)}>{t('footer.help')}</Link></li>
                            <li><a href="https://appobrafacil.expertbr.com/suporte/" target="_blank" rel="noopener noreferrer">{t('footer.support')}</a></li>
                        </ul>
                    </div>

                </div>

                {/* Copyright */}
                <div className={styles.copyright}>
                    <p>&copy; {new Date().getFullYear()} Obra Fácil SaaS. {t('footer.rights')}</p>
                </div>
            </div>
        </footer>
    );
}
