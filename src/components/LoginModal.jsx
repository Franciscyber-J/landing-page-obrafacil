import { HardHat, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Navbar.module.css';

export default function LoginModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={`glass-panel ${styles.modalContent}`} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={onClose}>
                    <X size={24} />
                </button>

                <h2 className={styles.modalTitle}>{t('loginModal.title')}</h2>

                <div className={styles.modalOptions}>
                    <a href="https://obrafacilapp.expertbr.com/login" className={styles.modalCard}>
                        <div className={`${styles.modalIcon} ${styles.iconGestor}`}>
                            <HardHat size={28} />
                        </div>
                        <div>
                            <h3 className={styles.cardTitle}>{t('loginModal.managerTitle')}</h3>
                            <p className={styles.cardDesc}>{t('loginModal.managerDesc')}</p>
                        </div>
                    </a>

                    <a href="https://obrafacilapp.expertbr.com/login" className={styles.modalCard}>
                        <div className={`${styles.modalIcon} ${styles.iconCliente}`}>
                            <User size={28} />
                        </div>
                        <div>
                            <h3 className={styles.cardTitle}>{t('loginModal.clientTitle')}</h3>
                            <p className={styles.cardDesc}>{t('loginModal.clientDesc')}</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
