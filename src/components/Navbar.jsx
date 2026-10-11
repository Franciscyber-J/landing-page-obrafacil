import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun, Menu, X, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IDIOMAS, caminhoInicio, idioma } from '../i18n/idiomas.js';
import { useIdioma, useTrocarIdioma } from '../i18n/RotaDoIdioma.jsx';
import styles from './Navbar.module.css';

const TAMANHOS = { lg: [28, 20], md: [24, 17], sm: [20, 14] };

// Bandeiras servidas pelo próprio site (public/bandeiras, geradas no build a partir do
// pacote flag-icons): nada de CDN de terceiros.
export function Bandeira({ pais, size = 'md' }) {
    const [largura, altura] = TAMANHOS[size] ?? TAMANHOS.md;
    return (
        <img
            src={`/bandeiras/${pais.toLowerCase()}.svg`}
            alt=""
            width={largura}
            height={altura}
            style={{ width: largura, height: altura, borderRadius: 3, objectFit: 'cover', display: 'block', flexShrink: 0 }}
        />
    );
}

export default function Navbar({ onOpenLogin }) {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const trocarIdioma = useTrocarIdioma();
    const inicio = caminhoInicio(codigo);
    const [isDarkMode, setIsDarkMode]       = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [langOpen, setLangOpen]           = useState(false);
    const langRef                           = useRef(null);

    // Toggle Theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    // Close lang dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) {
                setLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const changeLanguage = (lang) => {
        setLangOpen(false);
        setIsMobileMenuOpen(false);
        if (lang !== codigo) trocarIdioma(lang);
    };

    const currentLang = idioma(codigo) ?? IDIOMAS[0];

    return (
        <nav className={`glass-panel ${styles.navbar}`}>
            <div className="container flex justify-between items-center">

                {/* Logo */}
                <Link
                    to={inicio}
                    className={styles.logo}
                    onClick={(e) => {
                        if (window.location.pathname === inicio && !window.location.hash) {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                >
                    <img src="/logo_transparente.png" alt="Obra Fácil Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                </Link>

                {/* Desktop Menu */}
                <div className={styles.desktopMenu}>

                    {/* Custom Language Dropdown */}
                    <div className={styles.langSelector} ref={langRef}>
                        <button
                            className={`${styles.langSelectorInner} ${langOpen ? styles.langSelectorOpen : ''}`}
                            onClick={() => setLangOpen((o) => !o)}
                            aria-haspopup="listbox"
                            aria-expanded={langOpen}
                            aria-label={t('nav.chooseLanguage')}
                        >
                            <Bandeira pais={currentLang.pais} size="lg" />
                            <ChevronDown size={13} className={`${styles.langChevron} ${langOpen ? styles.langChevronOpen : ''}`} />
                        </button>

                        {langOpen && (
                            <ul className={styles.langDropdown} role="listbox" aria-label={t('nav.chooseLanguage')}>
                                {IDIOMAS.map((lang) => (
                                    <li
                                        key={lang.codigo}
                                        role="option"
                                        lang={lang.codigo}
                                        tabIndex={0}
                                        aria-selected={currentLang.codigo === lang.codigo}
                                        className={`${styles.langOption} ${currentLang.codigo === lang.codigo ? styles.langOptionActive : ''}`}
                                        onClick={() => changeLanguage(lang.codigo)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); changeLanguage(lang.codigo); }
                                            if (e.key === 'Escape') setLangOpen(false);
                                        }}
                                    >
                                        <Bandeira pais={lang.pais} size="md" />
                                        <span className={styles.langOptionLabel}>{lang.nome}</span>
                                        {currentLang.codigo === lang.codigo && (
                                            <Check size={13} className={styles.langOptionCheck} />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button onClick={toggleTheme} className={styles.iconBtn} aria-label={t('nav.themeToggle')}>
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button onClick={onOpenLogin} className="btn-outline">{t('nav.login')}</button>
                    <a href="https://obrafacilapp.expertbr.com/cadastro?checkout=true&promo=30DIASFREE" className="btn-neon">{t('nav.createAccount')}</a>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className={styles.mobileToggle}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label={t('nav.menu')}
                    aria-expanded={isMobileMenuOpen}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

            </div>

            {/* Mobile Menu Panel */}
            {isMobileMenuOpen && (
                <>
                    <div className={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className={`glass-panel ${styles.mobileMenu}`}>
                        {/* Language options inline in mobile menu */}
                        <p className={styles.mobileSectionLabel}><Globe size={14} /> {t('nav.language')}</p>
                        <div className={styles.mobileLangRow}>
                            {IDIOMAS.map((lang) => (
                                <button
                                    key={lang.codigo}
                                    lang={lang.codigo}
                                    className={`${styles.mobileLangBtn} ${currentLang.codigo === lang.codigo ? styles.mobileLangBtnActive : ''}`}
                                    onClick={() => { changeLanguage(lang.codigo); }}
                                    title={lang.nome}
                                    aria-pressed={currentLang.codigo === lang.codigo}
                                >
                                    <Bandeira pais={lang.pais} size="md" />
                                    <span className={styles.mobileLangShort}>{lang.curto}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 items-center mb-4">
                            <button onClick={toggleTheme} className="flex gap-2 items-center btn-outline" style={{ width: '100%' }}>
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                                {isDarkMode ? t('nav.lightMode') : t('nav.darkMode')}
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button onClick={() => { setIsMobileMenuOpen(false); onOpenLogin(); }} className="btn-outline" style={{ textAlign: 'center' }}>{t('nav.login')}</button>
                            <a href="https://obrafacilapp.expertbr.com/cadastro?checkout=true&promo=30DIASFREE" className="btn-neon" style={{ textAlign: 'center' }}>{t('nav.createAccount')}</a>
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}
