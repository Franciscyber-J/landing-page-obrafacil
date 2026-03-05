import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun, Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar({ onOpenLogin }) {
    const { t, i18n } = useTranslation();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Toggle Theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    // Change Language
    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    return (
        <nav className={`glass-panel ${styles.navbar}`}>
            <div className="container flex justify-between items-center">

                {/* Logo */}
                <div className={styles.logo}>
                    <span className="neon-text">Obra Fácil</span>
                </div>

                {/* Desktop Menu */}
                <div className={styles.desktopMenu}>

                    <div className={styles.langSelector}>
                        <Globe size={18} />
                        <select
                            onChange={(e) => changeLanguage(e.target.value)}
                            value={i18n.language}
                            className={styles.select}
                        >
                            <option value="pt">PT</option>
                            <option value="en">EN</option>
                            <option value="es">ES</option>
                        </select>
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
                <div className={`glass-panel ${styles.mobileMenu}`}>
                    <div className="flex gap-2 items-center mb-3">
                        <Globe size={20} />
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
            )}
        </nav>
    );
}
