// Convite de saída para a conta grátis (decisão do Francis em 19/10/2026: o site leva a pessoa para dentro do
// app; quem vende o PRO é o app). Sem preço, sem desconto e sem contagem de vagas. Aparece uma vez por visita
// e nunca para quem já clicou em "Começar grátis" ou numa loja:
// - no computador, quando o mouse sai pela parte de cima da janela, depois de 8 s na página;
// - no celular, só depois de 30 s e de metade da página lida, quando a pessoa sobe a página depressa
//   (o Google pune janela que cobre a página no celular logo na chegada; por isso não há abertura por tempo).
// Espera o aviso de cookies ser respondido, para não abrir uma janela sobre a outra.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useIdioma } from '../i18n/RotaDoIdioma.jsx';
import { WINDOWS, appStore, googlePlay } from '../links.js';
import { aparelho, linkComecar } from '../comecar.js';
import styles from './ExitIntentPopup.module.css';

const CHAVE = 'obrafacil:convite-visto';

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

export default function ExitIntentPopup() {
    const { t } = useTranslation();
    const codigo = useIdioma();
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
        const toque = window.matchMedia('(hover: none)').matches;
        let ultimoY = window.scrollY;
        let subida = null; // { y, t } de onde começou a subida atual
        let leuMetade = false;

        // Quem já foi para o cadastro ou para uma loja não precisa do convite.
        const clicou = (e) => {
            if (e.target instanceof Element && e.target.closest('[data-conversao]')) marcarVista();
        };
        const saindoPeloTopo = (e) => {
            if (e.clientY <= 0 && Date.now() - inicio > 8000) abrir();
        };
        const rolando = () => {
            const y = window.scrollY;
            const agora = performance.now();
            const altura = document.documentElement.scrollHeight - window.innerHeight;
            if (altura > 0 && y / altura > 0.5) leuMetade = true;
            // Subida rápida: 250 px para cima em menos de 400 ms, somando os vários eventos de um mesmo gesto.
            if (y < ultimoY) {
                if (!subida || agora - subida.t > 400) subida = { y: ultimoY, t: agora };
                if (leuMetade && Date.now() - inicio > 30000 && subida.y - y > 250) abrir();
            } else {
                subida = null;
            }
            ultimoY = y;
        };

        document.addEventListener('click', clicou, true);
        if (toque) window.addEventListener('scroll', rolando, { passive: true });
        else document.documentElement.addEventListener('mouseleave', saindoPeloTopo);
        return () => {
            document.removeEventListener('click', clicou, true);
            window.removeEventListener('scroll', rolando);
            document.documentElement.removeEventListener('mouseleave', saindoPeloTopo);
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
            <div ref={janela} className={styles.janela} role="dialog" aria-modal="true" aria-labelledby="convite-titulo" aria-describedby="convite-texto">
                <div className={styles.faixa}>
                    <span>{t('popup.faixa')}</span>
                    <button ref={fechar} type="button" className={styles.fechar} onClick={() => setAberta(false)} aria-label={t('popup.fechar')}>
                        <X size={22} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                </div>
                <div className={styles.corpo}>
                    <h2 id="convite-titulo" className={styles.titulo}>{t('popup.title')}</h2>
                    <p id="convite-texto" className={styles.texto}>{t('popup.texto')}</p>
                    <a {...linkComecar(codigo)} className={`acao ${styles.botao}`} onClick={() => setAberta(false)}>
                        {t('popup.cta')}
                    </a>
                    {/* No celular o botão já abre a loja do aparelho; as três opções ficam para o computador. */}
                    {aparelho() === 'outro' && (
                        <>
                            <p className={styles.lojasRotulo}>{t('popup.lojas')}</p>
                            <ul className={styles.lojas}>
                                <li>
                                    <a href={googlePlay(codigo)} data-conversao="loja_android" target="_blank" rel="noopener noreferrer">Google Play</a>
                                </li>
                                <li>
                                    <a href={appStore()} data-conversao="loja_ios" target="_blank" rel="noopener noreferrer">App Store</a>
                                </li>
                                <li>
                                    <a href={WINDOWS} data-conversao="windows">Windows</a>
                                </li>
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
