import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, ShieldCheck, XCircle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ProblemSolution.module.css';

export default function ProblemSolution() {
    const { t } = useTranslation();
    const [activeLightbox, setActiveLightbox] = useState(null);

    return (
        <section className={`section ${styles.section}`}>
            <div className={`container ${styles.grid}`}>

                {/* The Problem */}
                <motion.div
                    className={`glass-panel ${styles.card} ${styles.problemCard}`}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                >
                    <div className={styles.header}>
                        <div className={styles.iconWrapper} style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)' }}>
                            <XCircle className={styles.icon} style={{ color: '#ff4d4f' }} />
                        </div>
                        <h3 className={styles.label} style={{ color: '#ff4d4f' }}>
                            {t('problemSolution.problemLabel')}
                        </h3>
                    </div>
                    <p className={styles.text}>{t('problemSolution.problemText')}</p>

                    <div className={styles.whatsappMockup}>
                        <div className={styles.waHeader}>
                            <div className={styles.waAvatar}></div>
                            <div className={styles.waContact}>
                                <strong>{t('problemSolutionMockup.clientName')}</strong>
                                <span>{t('problemSolutionMockup.online')}</span>
                            </div>
                        </div>
                        <div className={styles.waBody}>
                            <div className={styles.waDate}>{t('problemSolutionMockup.today')}</div>
                            <div className={`${styles.waBubble} ${styles.waIncoming}`}>
                                {t('problemSolutionMockup.msg1')}
                                <span className={styles.waTime}>09:41</span>
                            </div>
                            <div className={`${styles.waBubble} ${styles.waIncoming}`}>
                                {t('problemSolutionMockup.msg2')}
                                <span className={styles.waTime}>09:42</span>
                            </div>
                            <div className={`${styles.waBubble} ${styles.waOutgoing}`}>
                                {t('problemSolutionMockup.msg3')}
                                <span className={styles.waTime}>10:05 <span className={styles.waTicks}>✓✓</span></span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* The Solution */}
                <motion.div
                    className={`glass-panel ${styles.card} ${styles.solutionCard}`}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className={styles.header}>
                        <div className={styles.iconWrapper} style={{ backgroundColor: 'var(--color-neon-glow)' }}>
                            <CheckCircle className={styles.icon} style={{ color: 'var(--color-neon)' }} />
                        </div>
                        <h3 className={styles.label} style={{ color: 'var(--color-neon)' }}>
                            {t('problemSolution.solutionLabel')}
                        </h3>
                    </div>
                    <p className={styles.text}>{t('problemSolution.solutionText')}</p>

                    <div className={styles.solutionMockup}>
                        <div
                            className={`${styles.desktopFrame} ${styles.clickableMockup}`}
                            onClick={() => setActiveLightbox('/desktop-gestor.png')}
                        >
                            <img src="/desktop-gestor.png" alt="Gestor Desktop" className={styles.desktopImg} />
                        </div>
                        <div
                            className={`${styles.mobileFrame} ${styles.clickableMockup}`}
                            onClick={(e) => { e.stopPropagation(); setActiveLightbox('/mobile-cliente.png'); }}
                        >
                            <div className={styles.iphoneNotch}></div>
                            <img src="/mobile-cliente.png" alt="Portal do Cliente Mobile" className={styles.mobileImg} />
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* Lightbox Overlay */}
            <AnimatePresence>
                {activeLightbox && (
                    <motion.div
                        className={styles.lightboxOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveLightbox(null)}
                    >
                        <button className={styles.lightboxClose} onClick={() => setActiveLightbox(null)}>
                            <X size={32} />
                        </button>
                        <motion.img
                            src={activeLightbox}
                            alt="Visualização em tamanho real"
                            className={styles.lightboxImage}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()} /* Prevent closing when clicking the image itself */
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
