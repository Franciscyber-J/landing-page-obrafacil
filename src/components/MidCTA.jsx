import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './MidCTA.module.css';

export default function MidCTA() {
    const { t } = useTranslation();

    return (
        <section className={styles.section}>
            <div className="container text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6 }}
                    className={styles.content}
                >
                    <a
                        href="https://obrafacilapp.expertbr.com/cadastro?checkout=true&promo=30DIASFREE"
                        className="btn-neon"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 36px', fontSize: '1.1rem' }}
                    >
                        {t('coreFeatures.ctaMidButton')}
                        <ArrowRight size={20} />
                    </a>
                    <p className={styles.subtext}>
                        {t('coreFeatures.ctaMidSubtext')}
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
