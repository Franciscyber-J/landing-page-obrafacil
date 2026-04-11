import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import styles from './FloatingWhatsApp.module.css';

export default function FloatingWhatsApp() {
    const { t } = useTranslation();
    
    // The link provided by the user
    const whatsappMessage = t('whatsapp.message', 'Olá, venho através do site e quero tirar uma dúvida');
    const whatsappLink = `https://wa.me/5562992666759?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <motion.a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.floatingBtn}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 1 }}
            aria-label={t('whatsapp.tooltip', 'Fale com o Suporte')}
        >
            <MessageCircle size={32} />
            <span className={styles.tooltip}>{t('whatsapp.tooltip', 'Fale com o Suporte')}</span>
        </motion.a>
    );
}
