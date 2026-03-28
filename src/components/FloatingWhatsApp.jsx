import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import styles from './FloatingWhatsApp.module.css';

export default function FloatingWhatsApp() {
    const { t } = useTranslation();
    
    // The link provided by the user
    const whatsappLink = "https://wa.me/5562992666759?text=Ol%C3%A1%2C%20venho%20atrav%C3%A9s%20do%20site%20e%20quero%20tirar%20uma%20d%C3%BAvida";

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
