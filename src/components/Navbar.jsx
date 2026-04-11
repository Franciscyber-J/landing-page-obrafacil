import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun, Menu, X, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

const LANGUAGES = [
    { code: 'pt', label: 'Português', short: 'PT' },
    { code: 'en', label: 'English',   short: 'EN' },
    { code: 'es', label: 'Español',   short: 'ES' },
];

export default function Navbar({ onOpenLogin }) {
    const { t, i18n } = useTranslation();
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
        i18n.changeLanguage(lang);
        setLangOpen(false);
    };

    const currentLang = LANGUAGES.find(
        (l) => l.code === (i18n.language?.split('-')[0] || 'pt')
    ) || LANGUAGES[0];

    return (
        <nav className={`glass-panel ${styles.navbar}`}>
            <div className="container flex justify-between items-center">

                {/* Logo */}
                <Link
                    to="/"
                    className={styles.logo}
                    onClick={(e) => {
                        if (window.location.pathname === '/') {
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
                            aria-label="Select language"
                        >
                            <Globe size={15} />
                            <span className={styles.langLabel}>{currentLang.short}</span>
                            <ChevronDown size={13} className={`${styles.langChevron} ${langOpen ? styles.langChevronOpen : ''}`} />
                        </button>

                        {langOpen && (
                            <ul className={styles.langDropdown} role="listbox">
                                {LANGUAGES.map((lang) => (
                                    <li
                                        key={lang.code}
                                        role="option"
                                        aria-selected={currentLang.code === lang.code}
                                        className={`${styles.langOption} ${currentLang.code === lang.code ? styles.langOptionActive : ''}`}
                                        onClick={() => changeLanguage(lang.code)}
                                    >
                                        <span className={styles.langOptionLabel}>{lang.label}</span>
                                        <span className={styles.langOptionShort}>{lang.short}</span>
                                        {currentLang.code === lang.code && (
                                            <Check size={13} className={styles.langOptionCheck} />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button onClick={toggleTheme} className={styles.iconBtn} aria-label="Toggle Theme">
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button onClick={onOpenLogin} className="btn-outline">{t('nav.login')}</button>
                    <a href="https://obrafacilapp.expertbr.com/cadastro" className="btn-neon">{t('nav.createAccount')}</a>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className={styles.mobileToggle}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
                        <p className={styles.mobileSectionLabel}><Globe size={14} /> {t('nav.language') || 'Idioma'}</p>
                        <div className={styles.mobileLangRow}>
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    className={`${styles.mobileLangBtn} ${currentLang.code === lang.code ? styles.mobileLangBtnActive : ''}`}
                                    onClick={() => { changeLanguage(lang.code); }}
                                >
                                    {lang.short}
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
                            <a href="https://obrafacilapp.expertbr.com/cadastro" className="btn-neon" style={{ textAlign: 'center' }}>{t('nav.createAccount')}</a>
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}
