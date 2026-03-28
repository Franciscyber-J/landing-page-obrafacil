import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './HeroSection.module.css';

export default function HeroSection() {
    const { t } = useTranslation();
    const [desktopIndex, setDesktopIndex] = useState(1);
    const [mobileIndex, setMobileIndex] = useState(1);

    useEffect(() => {
        const desktopTimer = setInterval(() => {
            setDesktopIndex(prev => prev >= 6 ? 1 : prev + 1);
        }, 4000);

        const mobileTimer = setInterval(() => {
            setMobileIndex(prev => prev >= 10 ? 1 : prev + 1);
        }, 3000);

        return () => {
            clearInterval(desktopTimer);
            clearInterval(mobileTimer);
        };
    }, []);

    const textVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } }
    };

    const itemFade = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <section className={`section ${styles.hero}`}>
            <div className={styles.heroOverlay}></div>
            <div className={`container ${styles.grid}`}>

                {/* Text Content */}
                <motion.div
                    className={styles.content}
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemFade} className={styles.badge}>
                        {t('hero.tagline')}
                    </motion.div>

                    <motion.h1 variants={itemFade} className={styles.title}>
                        {t('hero.headline')}
                    </motion.h1>

                    <motion.p variants={itemFade} className={styles.description}>
                        {t('hero.subheadline')}
                    </motion.p>

                    <motion.div variants={itemFade} className={styles.actions}>
                        <a href="https://obrafacilapp.expertbr.com/cadastro" className="btn-neon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {t('hero.cta')}
                            <ArrowRight size={20} />
                        </a>
                    </motion.div>

                    <motion.div variants={itemFade} className={styles.downloadButtons}>
                        <a href="https://play.google.com/store/apps/details?id=com.expertbr.obrafacil" target="_blank" rel="noopener noreferrer" className={`glass-panel ${styles.downloadBtn}`}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1.144 14.89l-2.073-1.129-1.298 1.258.03-1.85-3.328-1.812a.25.25 0 010-.438l11.08-6.033c.125-.068.271.026.243.163l-1.921 9.07a.25.25 0 01-.365.17l-2.368-1.289-1.077 2.162a.25.25 0 01-.444-.069l1.521-3.053z" /></svg>
                            <div className={styles.downloadText}>
                                <span>{t('hero.downloadOn')}</span>
                                <strong>{t('hero.downloadAndroid')}</strong>
                            </div>
                        </a>

                        <a href="https://apps.apple.com/br/app/id6760675010" target="_blank" rel="noopener noreferrer" className={`glass-panel ${styles.downloadBtn}`}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M17.05 13.91c-.02-2.14 1.74-3.18 1.82-3.23-1-1.46-2.56-1.67-3.13-1.69-1.33-.14-2.6.78-3.29.78-.68 0-1.74-.75-2.85-.73-1.44.02-2.77.84-3.51 2.14-1.52 2.62-.39 6.51 1.09 8.65.73 1.05 1.58 2.22 2.74 2.18 1.12-.04 1.55-.71 2.92-.71 1.36 0 1.76.71 2.94.69 1.19-.02 1.93-1.07 2.65-2.12.83-1.22 1.17-2.4 1.19-2.46-.03-.01-2.31-.88-2.33-3.48zm-1.82-5.71c.61-.74 1.02-1.76.91-2.78-.88.04-1.94.59-2.57 1.33-.56.65-1.03 1.69-.9 2.69.98.08 1.96-.48 2.56-1.24z" /></svg>
                            <div className={styles.downloadText}>
                                <span>{t('hero.downloadAt')}</span>
                                <strong>{t('hero.downloadApple')}</strong>
                            </div>
                        </a>

                        <a href="https://appobrafacil.expertbr.com/download/Instalador_ObraFacil_Windows.exe" className={`glass-panel ${styles.downloadBtn}`}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M1.385 8.16l9.613-.193v8.599L1.385 16.32V8.16zm0 8.783L11 17.152v8.618L1.385 24v-7.057zm10.222.259L22.607 18.5v5.5H11.607v-6.798zm0-9.227l11-.237v7.925l-11 .232V7.975zM11.608 0l11 .237v7.056l-11 .226V0zM1.385 1.066L11 1.259v6.331L1.385 6.541V1.066z" /></svg>
                            <div className={styles.downloadText}>
                                <span>{t('hero.desktopApp')}</span>
                                <strong>{t('hero.downloadWindows')}</strong>
                            </div>
                        </a>
                    </motion.div>

                    <motion.div variants={itemFade} className={styles.socialProof}>
                        <CheckCircle2 size={16} className="text-neon" />
                        <span>{t('hero.socialProof')}</span>
                    </motion.div>
                </motion.div>

                {/* Visual Mockups */}
                <motion.div
                    className={styles.visuals}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >

                    <div className={styles.laptopContainer}>
                        <div className={styles.laptop}>
                            <div className={styles.laptopScreen}>
                                <div className={styles.laptopHeader}>
                                    <span className={styles.dot} style={{ background: '#ff5f56' }}></span>
                                    <span className={styles.dot} style={{ background: '#ffbd2e' }}></span>
                                    <span className={styles.dot} style={{ background: '#27c93f' }}></span>
                                </div>
                                <div className={styles.laptopBody}>
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={desktopIndex}
                                            src={`/desktop-${desktopIndex}.png`}
                                            alt="ObraFácil Desktop Screenshot"
                                            className={styles.mockupImage}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className={styles.laptopKeyboard}>
                                <div className={styles.laptopTrackpad}></div>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        className={`glass-panel ${styles.iphoneMockup}`}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    >
                        <div className={styles.iphoneNotch}></div>
                        <div className={styles.iphoneScreen} style={{ padding: 0, overflow: 'hidden', position: 'relative', borderRadius: '0 0 28px 28px' }}>
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={mobileIndex}
                                    src={`/mobile-${mobileIndex}.png`}
                                    alt="ObraFácil Mobile Screenshot"
                                    className={styles.mockupImage}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                />
                            </AnimatePresence>
                        </div>
                    </motion.div>

                </motion.div>

            </div>

            {/* Background Glow Effects */}
            <div className={styles.bgGlow1}></div>
            <div className={styles.bgGlow2}></div>
        </section>
    );
}
