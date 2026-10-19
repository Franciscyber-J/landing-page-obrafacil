// Oferta de saída (Membros Fundadores, atendida pelo Max no WhatsApp). Aparece uma vez por visita:
// no computador quando o mouse sai pela parte de cima da janela; no celular quando a pessoa sobe a
// página depressa depois de ter lido boa parte dela; e, em último caso, depois de 45 s na página.
// Espera o aviso de cookies ser respondido, para não abrir uma janela sobre a outra.
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { linkWhatsApp } from '../links.js';
import styles from './ExitIntentPopup.module.css';

const CHAVE = 'obrafacil:oferta-vista';

function jaVista() {
    try {
        return window.sessionStorage.getItem(CHAVE) === 'sim';
    } catch {
        return false;
    }
}

function marcarVista() {
    try {
        window.sessionStorage.setItem(CHAVE, 'sim');
    } catch {
        // sem permissão para guardar: pode aparecer de novo nesta visita
    }
}

// **negrito** do texto vira <strong>, sem HTML.
function comNegrito(texto) {
    return String(texto).split('**').map((parte, i) => (
        i % 2 === 1 ? <strong key={i}>{parte}</strong> : <Fragment key={i}>{parte}</Fragment>
    ));
}

export default function ExitIntentPopup() {
    const { t } = useTranslation();
    const [aberta, setAberta] = useState(false);
    const fechar = useRef(null);
    const janela = useRef(null);
    const antes = useRef(null);

    const abrir = useCallback(() => {
        if (jaVista() || document.documentElement.dataset.cookies === 'aberto') return false;
        marcarVista();
        antes.current = document.activeElement;
        setAberta(true);
        return true;
    }, []);

    useEffect(() => {
        if (jaVista()) return undefined;
        const inicio = Date.now();
        let ultimoY = window.scrollY;
        let ultimoT = performance.now();
        let leuBastante = false;

        const saindoPeloTopo = (e) => {
            if (e.clientY <= 0 && Date.now() - inicio > 8000) abrir();
        };
        const rolando = () => {
            const y = window.scrollY;
            const agora = performance.now();
            const altura = document.documentElement.scrollHeight - window.innerHeight;
            if (altura > 0 && y / altura > 0.4) leuBastante = true;
            const subida = ultimoY - y;
            if (leuBastante && Date.now() - inicio > 20000 && subida > 160 && agora - ultimoT < 250) abrir();
            ultimoY = y;
            ultimoT = agora;
        };
        const tempo = window.setInterval(() => {
            if (jaVista()) window.clearInterval(tempo);
            else if (Date.now() - inicio > 45000 && abrir()) window.clearInterval(tempo);
        }, 5000);

        document.documentElement.addEventListener('mouseleave', saindoPeloTopo);
        window.addEventListener('scroll', rolando, { passive: true });
        return () => {
            window.clearInterval(tempo);
            document.documentElement.removeEventListener('mouseleave', saindoPeloTopo);
            window.removeEventListener('scroll', rolando);
        };
    }, [abrir]);

    // Janela modal de verdade: o Tab circula só dentro dela, Esc fecha, a página de trás não rola,
    // e ao fechar o foco volta para onde estava.
    useEffect(() => {
        if (!aberta) return undefined;
        fechar.current?.focus();
        const rolagem = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        const tecla = (e) => {
            if (e.key === 'Escape') {
                setAberta(false);
                return;
            }
            if (e.key !== 'Tab' || !janela.current) return;
            const focaveis = [...janela.current.querySelectorAll('a[href], button:not([disabled])')];
            if (!focaveis.length) return;
            const primeiro = focaveis[0];
            const ultimo = focaveis[focaveis.length - 1];
            if (e.shiftKey && (document.activeElement === primeiro || !janela.current.contains(document.activeElement))) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && (document.activeElement === ultimo || !janela.current.contains(document.activeElement))) {
                e.preventDefault();
                primeiro.focus();
            }
        };
        document.addEventListener('keydown', tecla);
        return () => {
            document.removeEventListener('keydown', tecla);
            document.documentElement.style.overflow = rolagem;
            antes.current?.focus?.();
        };
    }, [aberta]);

    if (!aberta) return null;

    return (
        <div className={styles.fundo} onClick={(e) => { if (e.target === e.currentTarget) setAberta(false); }}>
            <div ref={janela} className={styles.janela} role="dialog" aria-modal="true" aria-labelledby="oferta-titulo">
                <div className={styles.faixa}>
                    <span>{t('popup.faixa')}</span>
                    <button ref={fechar} type="button" className={styles.fechar} onClick={() => setAberta(false)} aria-label={t('popup.fechar')}>
                        <X size={22} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                </div>
                <div className={styles.corpo}>
                    <h2 id="oferta-titulo" className={styles.titulo}>{t('popup.title')}</h2>
                    <p className={styles.texto}>{comNegrito(t('popup.subtitle'))}</p>
                    <p className={styles.texto}>{comNegrito(t('popup.body'))}</p>
                    <p className={styles.escassez}>{t('popup.scarcity')}</p>
                    <a
                        href={linkWhatsApp(t('popup.whatsappMessage'))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`acao ${styles.botao}`}
                        onClick={() => setAberta(false)}
                    >
                        {t('popup.cta')}
                    </a>
                </div>
            </div>
        </div>
    );
}
