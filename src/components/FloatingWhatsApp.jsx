// Atalho fixo para o WhatsApp do ObraFácil (dúvida antes de assinar).
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { linkWhatsApp } from '../links.js';
import styles from './FloatingWhatsApp.module.css';

export default function FloatingWhatsApp() {
    const { t } = useTranslation();

    return (
        <a
            href={linkWhatsApp(t('whatsapp.message'))}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.flutuante}
            aria-label={t('whatsapp.tooltip')}
        >
            <MessageCircle size={26} strokeWidth={2.25} aria-hidden="true" />
            <span className={styles.rotulo}>{t('whatsapp.tooltip')}</span>
        </a>
    );
}
