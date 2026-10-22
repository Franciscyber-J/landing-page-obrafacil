// Aviso de cookies: a tag do Google (public/tag-google.js) começa sem gravar nada e só passa a
// gravar quando a pessoa aceita. Recusar é tão fácil quanto aceitar, e a escolha pode ser mudada
// depois pelo link "Cookies" do rodapé (evento obrafacil:cookies-abrir).
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { caminhoLegal } from '../i18n/idiomas.js';
import { useIdioma } from '../i18n/RotaDoIdioma.jsx';
import { EVENTO_ABRIR, aplicarEscolha, lerEscolha } from '../legal/cookies.js';
import { useMontado } from '../useNavegador.js';
import styles from './AvisoCookies.module.css';

export default function AvisoCookies() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    // A escolha fica no navegador: a página pronta do build não tem o aviso, que aparece logo depois de ela abrir.
    const montado = useMontado();
    const [aberto, setAberto] = useState(() => !lerEscolha());

    useEffect(() => {
        const abrir = () => setAberto(true);
        window.addEventListener(EVENTO_ABRIR, abrir);
        return () => window.removeEventListener(EVENTO_ABRIR, abrir);
    }, []);

    // Enquanto o aviso está aberto, o botão do WhatsApp sai do caminho (ver FloatingWhatsApp.module.css)
    // e a janela de saída espera a escolha.
    useEffect(() => {
        if (aberto) document.documentElement.dataset.cookies = 'aberto';
        else delete document.documentElement.dataset.cookies;
    }, [aberto]);

    if (!aberto || !montado) return null;

    const escolher = (aceito) => {
        aplicarEscolha(aceito);
        setAberto(false);
    };

    return (
        <section className={styles.aviso} role="region" aria-label={t('cookies.titulo')}>
            <div className={styles.texto}>
                <p className={styles.titulo}>{t('cookies.titulo')}</p>
                <p>
                    {t('cookies.texto')}{' '}
                    <Link to={`${caminhoLegal(codigo, 'privacidade')}#s15`}>{t('cookies.saibaMais')}</Link>
                </p>
            </div>
            <div className={styles.botoes}>
                <button type="button" className={`acao-contorno ${styles.botao}`} onClick={() => escolher(false)}>{t('cookies.recusar')}</button>
                <button type="button" className={`acao-contorno ${styles.botao}`} onClick={() => escolher(true)}>{t('cookies.aceitar')}</button>
            </div>
        </section>
    );
}
