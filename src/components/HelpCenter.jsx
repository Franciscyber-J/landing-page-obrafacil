import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import styles from './HelpCenter.module.css';

export default function HelpCenter() {
    const { t } = useTranslation();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    const videos = [
        { id: 1, title: t('helpCenter.video1'), duration: '2:15' },
        { id: 2, title: t('helpCenter.video2'), duration: '1:45' },
        { id: 3, title: t('helpCenter.video3'), duration: '3:30' },
        { id: 4, title: t('helpCenter.video4'), duration: '2:00' },
        { id: 5, title: t('helpCenter.video5'), duration: '1:20' },
        { id: 6, title: t('helpCenter.video6'), duration: '1:50' },
    ];

    return (
        <main className={styles.helpCenter}>
            <div className="container">
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {t('helpCenter.title')}
                </motion.h1>
                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {t('helpCenter.subtitle')}
                </motion.p>

                <motion.div
                    className={styles.videoGrid}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {videos.map(video => (
                        <motion.div key={video.id} className={styles.videoCard} variants={itemVariants}>
                            <div className={styles.videoPlaceholder}>
                                <span className={styles.comingSoonBadge}>{t('helpCenter.comingSoon')}</span>
                                <div className={styles.playButton}>▶</div>
                                <span className={styles.duration}>{video.duration}</span>
                            </div>
                            <h3>{video.title}</h3>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </main>
    );
}
