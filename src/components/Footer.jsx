import { useTranslation } from 'react-i18next';
import { ArrowRight, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    return (
        <footer className={styles.footer}>
            {/* Final CTA Section */}
            <div className={styles.ctaSection}>
                <div className="container text-center">
                    <h2 className={styles.ctaTitle}>{t('footer.ctaTitle')}</h2>
                    <a href="https://obrafacilapp.expertbr.com/cadastro" className="btn-neon flex items-center gap-2" style={{ margin: '0 auto', fontSize: '1.2rem', padding: '16px 36px', display: 'inline-flex', justifyContent: 'center' }}>
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
                            Gestão de obras inteligente. Transparência que encanta o seu cliente.
                        </p>

                        <div className={styles.langSelector}>
                            <Globe size={18} />
                            <select
                                onChange={(e) => changeLanguage(e.target.value)}
                                value={i18n.language}
                                className={styles.select}
                            >
                                <option value="pt">Português (PT)</option>
                                <option value="en">English (EN)</option>
                                <option value="es">Español (ES)</option>
                            </select>
                        </div>
                    </div>

                    {/* Links */}
                    <div className={styles.linksCol}>
                        <h4 className={styles.colTitle}>{t('footer.links')}</h4>
                        <ul className={styles.linkList}>
                            <li><a href="https://appobrafacil.expertbr.com/termos-de-uso/" target="_blank" rel="noopener noreferrer">{t('footer.terms')}</a></li>
                            <li><a href="https://appobrafacil.expertbr.com/politicas-de-privacidade/" target="_blank" rel="noopener noreferrer">{t('footer.privacy')}</a></li>
                            <li><Link to="/ajuda">{t('footer.help')}</Link></li>
                            <li><a href="https://appobrafacil.expertbr.com/suporte/" target="_blank" rel="noopener noreferrer">{t('footer.support')}</a></li>
                        </ul>
                    </div>

                </div>

                {/* Copyright */}
                <div className={styles.copyright}>
                    <p>&copy; {new Date().getFullYear()} Obra Fácil SaaS. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
