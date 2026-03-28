import { useTranslation } from 'react-i18next';
import { Shield, Eye, Edit3, UserPlus, HardHat } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './CoManagement.module.css';

export default function CoManagement() {
    const { t } = useTranslation();

    return (
        <section className={`section ${styles.section}`}>
            <div className={`container ${styles.grid}`}>

                {/* Abstract App Roles Visualization */}
                <motion.div
                    className={styles.visuals}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                >
                    <div className={styles.centerGlow}></div>
                    <div className={`glass-panel ${styles.roleCard} ${styles.pos1}`}>
                        <UserPlus className={styles.iconAdmin} />
                        <div>
                            <p className={styles.roleTitle}>{t('coManagementRoles.manager')}</p>
                            <p className={styles.roleAccess}>{t('coManagementRoles.fullAccess')}</p>
                        </div>
                        <Shield className={styles.badge} size={16} />
                    </div>

                    <div className={`glass-panel ${styles.roleCard} ${styles.pos2}`}>
                        <HardHat className={styles.iconWorker} />
                        <div>
                            <p className={styles.roleTitle}>{t('coManagementRoles.engineer')}</p>
                            <p className={styles.roleAccess}>{t('coManagementRoles.techManagement')}</p>
                        </div>
                    </div>

                    <div className={`glass-panel ${styles.roleCard} ${styles.pos3}`}>
                        <Edit3 className={styles.iconWorker} />
                        <div>
                            <p className={styles.roleTitle}>{t('coManagementRoles.foreman')}</p>
                            <p className={styles.roleAccess}>{t('coManagementRoles.rdoPhotos')}</p>
                        </div>
                    </div>

                    <div className={`glass-panel ${styles.roleCard} ${styles.pos4}`}>
                        <Eye className={styles.iconClient} />
                        <div>
                            <p className={styles.roleTitle}>{t('coManagementRoles.client')}</p>
                            <p className={styles.roleAccess}>{t('coManagementRoles.viewOnly')}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                <motion.div
                    className={styles.content}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h2 className={styles.title}>{t('coManagement.title')}</h2>
                    <p className={styles.description}>{t('coManagement.description')}</p>

                    <ul className={styles.featureList}>
                        <li>
                            <span className={styles.check}>✓</span> {t('coManagement.point1')}
                        </li>
                        <li>
                            <span className={styles.check}>✓</span> {t('coManagement.point2')}
                        </li>
                        <li>
                            <span className={styles.check}>✓</span> <strong>{t('coManagement.point3')}</strong>
                        </li>
                    </ul>
                </motion.div>

            </div>
        </section>
    );
}
