// Barra do topo: chapa azul da placa, logotipo numa chapa branca, links, idioma, tema e as ações.
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IDIOMAS, caminhoAjuda, caminhoInicio, idioma } from '../i18n/idiomas.js';
import { useIdioma, useTrocarIdioma } from '../i18n/RotaDoIdioma.jsx';
import { CADASTRO, LOGIN } from '../links.js';
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
            className={styles.bandeira}
            style={{ width: largura, height: altura }}
        />
    );
}

function temaAtual() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'escuro' : 'claro';
}

function useTema() {
    const [tema, setTema] = useState(temaAtual);
    const trocar = () => {
        const novo = tema === 'escuro' ? 'claro' : 'escuro';
        document.documentElement.setAttribute('data-theme', novo === 'escuro' ? 'dark' : 'light');
        try {
            window.localStorage.setItem('obrafacil:tema', novo);
        } catch {
            // sem permissão para guardar: vale só nesta visita
        }
        setTema(novo);
    };
    return [tema, trocar];
}

function SeletorDeIdioma({ codigo, aoEscolher }) {
    const { t } = useTranslation();
    const [aberto, setAberto] = useState(false);
    const caixa = useRef(null);
    const atual = idioma(codigo) ?? IDIOMAS[0];

    useEffect(() => {
        if (!aberto) return undefined;
        const fora = (e) => { if (caixa.current && !caixa.current.contains(e.target)) setAberto(false); };
        const tecla = (e) => { if (e.key === 'Escape') setAberto(false); };
        document.addEventListener('mousedown', fora);
        document.addEventListener('keydown', tecla);
        return () => {
            document.removeEventListener('mousedown', fora);
            document.removeEventListener('keydown', tecla);
        };
    }, [aberto]);

    return (
        <div className={styles.idioma} ref={caixa}>
            <button
                type="button"
                className={styles.idiomaBotao}
                onClick={() => setAberto((a) => !a)}
                aria-expanded={aberto}
                aria-controls="lista-idiomas"
                aria-label={`${t('nav.chooseLanguage')}: ${atual.nome}`}
            >
                <Bandeira pais={atual.pais} size="md" />
                <span>{atual.curto}</span>
                <ChevronDown size={14} aria-hidden="true" className={aberto ? styles.girado : ''} />
            </button>
            {aberto && (
                <ul id="lista-idiomas" className={styles.idiomaLista}>
                    {IDIOMAS.map((i) => (
                        <li key={i.codigo}>
                            <button
                                type="button"
                                lang={i.codigo}
                                className={styles.idiomaOpcao}
                                aria-current={i.codigo === atual.codigo ? 'true' : undefined}
                                onClick={() => { setAberto(false); aoEscolher(i.codigo); }}
                            >
                                <Bandeira pais={i.pais} size="md" />
                                <span>{i.nome}</span>
                                {i.codigo === atual.codigo && <Check size={14} aria-hidden="true" />}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function Navbar() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const trocarIdioma = useTrocarIdioma();
    const [tema, trocarTema] = useTema();
    const [menuAberto, setMenuAberto] = useState(false);
    const inicio = caminhoInicio(codigo);

    const escolherIdioma = (novo) => {
        setMenuAberto(false);
        if (novo !== codigo) trocarIdioma(novo);
    };

    useEffect(() => {
        if (!menuAberto) return undefined;
        const tecla = (e) => { if (e.key === 'Escape') setMenuAberto(false); };
        document.addEventListener('keydown', tecla);
        return () => document.removeEventListener('keydown', tecla);
    }, [menuAberto]);

    const links = [
        { para: caminhoInicio(codigo, 'recursos'), texto: t('nav.recursos') },
        { para: caminhoInicio(codigo, 'precos'), texto: t('nav.precos') },
        { para: caminhoAjuda(codigo), texto: t('nav.ajuda') },
    ];

    const IconeTema = tema === 'escuro' ? Sun : Moon;

    return (
        <header className={styles.barra}>
            <div className={`container ${styles.conteudo}`}>
                <Link
                    to={inicio}
                    className={styles.logo}
                    aria-label={t('nav.inicio')}
                    onClick={(e) => {
                        if (window.location.pathname === inicio && !window.location.hash) {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                >
                    <img src="/logo_transparente.png" alt="ObraFácil" width="1050" height="238" />
                </Link>

                <nav className={styles.links} aria-label={t('nav.navegacao')}>
                    {links.map((l) => <Link key={l.texto} to={l.para}>{l.texto}</Link>)}
                </nav>

                <div className={styles.direita}>
                    <SeletorDeIdioma codigo={codigo} aoEscolher={escolherIdioma} />
                    <button type="button" className={styles.icone} onClick={trocarTema} aria-label={t('nav.themeToggle')}>
                        <IconeTema size={20} aria-hidden="true" />
                    </button>
                    <a href={LOGIN} className={styles.entrar}>{t('nav.login')}</a>
                    <a href={CADASTRO} className="acao">{t('nav.comecar')}</a>
                </div>

                <a href={CADASTRO} className={`acao ${styles.comecarCelular}`}>{t('nav.comecar')}</a>
                <button
                    type="button"
                    className={styles.menuBotao}
                    onClick={() => setMenuAberto((m) => !m)}
                    aria-label={t('nav.menu')}
                    aria-expanded={menuAberto}
                    aria-controls="menu-celular"
                >
                    {menuAberto ? <X size={26} aria-hidden="true" /> : <Menu size={26} aria-hidden="true" />}
                </button>
            </div>

            {menuAberto && (
                <div id="menu-celular" className={styles.menuCelular}>
                    <nav className={styles.menuLinks} aria-label={t('nav.navegacao')}>
                        {links.map((l) => <Link key={l.texto} to={l.para} onClick={() => setMenuAberto(false)}>{l.texto}</Link>)}
                    </nav>
                    <p className={styles.menuRotulo}>{t('nav.language')}</p>
                    <div className={styles.menuIdiomas}>
                        {IDIOMAS.map((i) => (
                            <button
                                key={i.codigo}
                                type="button"
                                lang={i.codigo}
                                className={styles.menuIdioma}
                                aria-pressed={i.codigo === codigo}
                                onClick={() => escolherIdioma(i.codigo)}
                            >
                                <Bandeira pais={i.pais} size="sm" />
                                <span>{i.curto}</span>
                            </button>
                        ))}
                    </div>
                    <button type="button" className={styles.menuTema} onClick={trocarTema}>
                        <IconeTema size={20} aria-hidden="true" />
                        {tema === 'escuro' ? t('nav.lightMode') : t('nav.darkMode')}
                    </button>
                    <div className={styles.menuAcoes}>
                        <a href={LOGIN} className="acao-clara">{t('nav.login')}</a>
                        <a href={CADASTRO} className="acao">{t('nav.comecar')}</a>
                    </div>
                </div>
            )}
        </header>
    );
}
