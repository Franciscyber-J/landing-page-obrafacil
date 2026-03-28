import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Pricing.module.css';

export default function Pricing() {
    const { t } = useTranslation();
    const [isAnnual, setIsAnnual] = useState(false);

    const freeFeatures = t('pricing.freeFeatures', { returnObjects: true });
    const proFeaturesMensal = t('pricing.proFeaturesMensal', { returnObjects: true });
    const proFeaturesAnnual = t('pricing.proFeaturesAnnual', { returnObjects: true });

    const currentProFeatures = isAnnual ? proFeaturesAnnual : proFeaturesMensal;

    return (
        <section className={`section ${styles.section}`}>
            <div className="container">

                <motion.div
                    className="text-center mb-5"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className={styles.title}>{t('pricing.title')}</h2>
                    
                    <div className={styles.toggleContainer}>
                        <button 
                            className={`${styles.toggleBtn} ${!isAnnual ? styles.toggleBtnActive : ''}`}
                            onClick={() => setIsAnnual(false)}
                        >
                            {t('pricing.toggleMonthly', 'Mensal')}
                        </button>
                        <button 
                            className={`${styles.toggleBtn} ${isAnnual ? styles.toggleBtnActive : ''}`}
                            onClick={() => setIsAnnual(true)}
                        >
                            {t('pricing.toggleAnnual', 'Anual')}
                            <span className={styles.discountBadge}>-25%</span>
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.grid}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
                    }}
                >

                    {/* Free Plan */}
                    <motion.div
                        className={`glass-panel ${styles.card}`}
                        variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                    >
                        <div>
                            <h3 className={styles.planName}>{t('pricing.freePlan')}</h3>
                            <p className={styles.planDesc}>{t('pricing.freeDesc')}</p>
                            <div className={styles.price}>
                                <span className={styles.currency}>{t('pricing.currency')}</span>
                                <span className={styles.amount}>{t('pricing.price0')}</span>
                                <span className={styles.period}>{t('pricing.perMonth')}</span>
                            </div>
                        </div>

                        <ul className={styles.featureList}>
                            {Array.isArray(freeFeatures) && freeFeatures.map((feat, index) => (
                                <li key={index}>
                                    <Check size={20} className={styles.checkIcon} />
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <a href="https://obrafacilapp.expertbr.com/cadastro" className="btn-outline" style={{ display: 'block', width: '100%', marginTop: 'auto', textAlign: 'center' }}>
                            {t('pricing.freeCta')}
                        </a>
                    </motion.div>

                    {/* PRO Plan */}
                    <motion.div
                        className={`glass-panel ${styles.card} ${styles.proCard}`}
                        variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                    >
                        <div className={styles.popularBadge}>
                            {isAnnual ? t('pricing.launchOfferAnnual') : t('pricing.launchOfferMensal')}
                        </div>
                        <div>
                            <h3 className={`${styles.planName} ${styles.proText}`}>
                                {isAnnual ? t('pricing.proPlanAnnual') : t('pricing.proPlanMensal')}
                            </h3>
                            <p className={styles.planDesc}>
                                {isAnnual ? t('pricing.proDescAnnual') : t('pricing.proDescMensal')}
                            </p>
                            <div className={styles.priceContainer}>
                                <div className={styles.anchorPrice}>
                                    {isAnnual ? t('pricing.fromPriceAnnual') : t('pricing.fromPriceMensal')}
                                </div>
                                <div className={styles.price}>
                                    <span className={styles.currency}>{t('pricing.currency')}</span>
                                    <span className={styles.amount}>
                                        {isAnnual ? t('pricing.priceAnnual') : t('pricing.priceMensal')}
                                    </span>
                                    <span className={styles.period}>
                                        {isAnnual ? t('pricing.periodAnnual', '/ano') : t('pricing.perMonth')}
                                    </span>
                                </div>
                                {isAnnual && (
                                    <span className={styles.subtext}>
                                        {t('pricing.subtextAnnual')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <ul className={styles.featureList}>
                            {Array.isArray(currentProFeatures) && currentProFeatures.map((feat, index) => (
                                <li key={index}>
                                    <Check size={20} className={styles.proCheckIcon} />
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <a 
                            href={isAnnual ? "https://obrafacilapp.expertbr.com/cadastro?checkout=anual" : "https://obrafacilapp.expertbr.com/cadastro?checkout=true"} 
                            className={`btn-neon ${styles.proBtn}`} 
                            style={{ display: 'block', width: '100%', marginTop: 'auto', textAlign: 'center' }}
                        >
                            {isAnnual ? t('pricing.proCtaAnnual') : t('pricing.proCtaMensal')}
                        </a>
                    </motion.div>

                </motion.div>

                <div className="text-center mt-5">
                    <p className={styles.addonsText}>{t('pricing.addons')}</p>
                </div>

            </div>
        </section>
    );
}
