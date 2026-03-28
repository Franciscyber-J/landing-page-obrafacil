import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './ExitIntentPopup.module.css';

export default function ExitIntentPopup() {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        if (hasTriggered) return;

        const handleMouseLeave = (e) => {
            if (e.clientY <= 0) {
                triggerPopup();
            }
        };

        const timer = setTimeout(() => {
            triggerPopup();
        }, 15000);

        document.documentElement.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            clearTimeout(timer);
            document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [hasTriggered]);

    const triggerPopup = () => {
        if (!hasTriggered) {
            setIsVisible(true);
            setHasTriggered(true);
        }
    };

    const closePopup = () => {
        setIsVisible(false);
    };

    const whatsappLink = "https://wa.me/5562992666759?text=Oi,%20estava%20no%20site%20do%20Obra%20F%C3%A1cil,%20vi%20o%20convite%20oculto%20e%20quero%20garantir%20minha%20vaga%20de%20Membro%20Fundador%20por%20R$%2049,90.";

    return (
        <AnimatePresence>
            {isVisible && (
                <div className={styles.overlay}>
                    <motion.div 
                        className={styles.popup}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <button className={styles.closeBtn} onClick={closePopup}>
                            <X size={24} />
                        </button>
                        
                        <div className={styles.content}>
                            <h2 className={styles.title}>{t('popup.title')}</h2>
                            <p className={styles.subtitle} dangerouslySetInnerHTML={{
                                __html: t('popup.subtitle').replace('**apenas 20 vagas**', '<strong style="color: var(--color-pro)">apenas 20 vagas</strong>')
                            }}></p>
                            
                            <p className={styles.body} dangerouslySetInnerHTML={{
                                __html: t('popup.body').replace('**R$ 49,90/mês**', '<strong style="color: var(--color-pro)">R$ 49,90/mês</strong>')
                            }}></p>
                            
                            <p className={styles.scarcity}>
                                {t('popup.scarcity')}
                            </p>
                            
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
                                📲 {t('popup.cta')}
                            </a>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
