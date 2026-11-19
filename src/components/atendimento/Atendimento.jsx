// Atendimento do site (decisão do Francis, 18/11/2026): o botão flutuante e a conversa com o Max, conforme o grupo
// do país do visitante (src/atendimento/estado.js):
//   - só WhatsApp: o botão abre o WhatsApp, como sempre foi;
//   - os dois e só a conversa: o botão "Fale com a gente" abre a conversa com o Max (nos dois, o painel oferece
//     também o WhatsApp).
// O painel (e o Firebase, depois dele) só é baixado quando a pessoa abre a conversa.
import { Suspense, lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, MessagesSquare } from 'lucide-react';
import { linkWhatsApp } from '../../links.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { abrirConversa, iniciarAtendimento, useAtendimento } from '../../atendimento/estado.js';
import styles from './Flutuante.module.css';

const Painel = lazy(() => import('./Painel.jsx'));

export default function Atendimento() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const { grupo, whatsapp, aberto } = useAtendimento(codigo);

    useEffect(() => {
        iniciarAtendimento();
    }, []);

    return (
        <>
            {grupo === 'so_whatsapp' ? (
                <a
                    href={linkWhatsApp(t('whatsapp.message'), whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.flutuante}
                    aria-label={t('whatsapp.tooltip')}
                    data-atendimento="flutuante"
                >
                    <MessageCircle size={26} strokeWidth={2.25} aria-hidden="true" />
                    <span className={styles.rotulo}>{t('whatsapp.tooltip')}</span>
                </a>
            ) : (
                <button
                    type="button"
                    className={styles.flutuante}
                    onClick={() => abrirConversa('flutuante')}
                    aria-label={t('atendimento.abrir')}
                    aria-haspopup="dialog"
                    aria-expanded={aberto}
                    data-atendimento="flutuante"
                    hidden={aberto}
                >
                    <MessagesSquare size={26} strokeWidth={2.25} aria-hidden="true" />
                    <span className={styles.rotulo}>{t('atendimento.abrir')}</span>
                </button>
            )}
            {aberto && (
                <Suspense fallback={null}>
                    <Painel codigo={codigo} />
                </Suspense>
            )}
        </>
    );
}

