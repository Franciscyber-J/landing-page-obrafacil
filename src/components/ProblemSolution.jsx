import { useTranslation } from 'react-i18next';
import { MessageCircle, ShieldCheck, XCircle, CheckCircle } from 'lucide-react';
import styles from './ProblemSolution.module.css';

export default function ProblemSolution() {
    const { t } = useTranslation();

    return (
        <section className={`section ${styles.section}`}>
            <div className={`container ${styles.grid}`}>

                {/* The Problem */}
                <div className={`glass-panel ${styles.card} ${styles.problemCard}`}>
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
                </div>

                {/* The Solution */}
                <div className={`glass-panel ${styles.card} ${styles.solutionCard}`}>
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
                        <div className={styles.phoneHolderPlaceholder}>
                            <p className={styles.placeholderLabel}>{t('problemSolutionMockup.videoPlaceholder')}</p>
                            <img src="" alt="" className={styles.personHoldingApp} />

                            {/* App zoom effect container */}
                            <div className={styles.appZoomOverlay}>
                                {/* minimal UI */}
                                <div className={styles.appHeader}></div>
                                <div className={styles.appContent}></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
