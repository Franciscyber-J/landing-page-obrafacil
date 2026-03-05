import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import styles from './Pricing.module.css';

export default function Pricing() {
    const { t } = useTranslation();

    const freeFeatures = t('pricing.freeFeatures', { returnObjects: true });
    const proFeatures = t('pricing.proFeatures', { returnObjects: true });

    return (
        <section className={`section ${styles.section}`}>
            <div className="container">

                <div className="text-center mb-5">
                    <h2 className={styles.title}>{t('pricing.title')}</h2>
                </div>

                <div className={styles.grid}>

                    {/* Free Plan */}
                    <div className={`glass-panel ${styles.card}`}>
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
                    </div>

                    {/* PRO Plan */}
                    <div className={`glass-panel ${styles.card} ${styles.proCard}`}>
                        <div className={styles.popularBadge}>{t('pricing.launchOffer')}</div>
                        <div>
                            <h3 className={`${styles.planName} ${styles.proText}`}>{t('pricing.proPlan')}</h3>
                            <p className={styles.planDesc}>{t('pricing.proDesc')}</p>
                            <div className={styles.priceContainer}>
                                <div className={styles.anchorPrice}>
                                    {t('pricing.fromPrice')}
                                </div>
                                <div className={styles.price}>
                                    <span className={styles.currency}>{t('pricing.currency')}</span>
                                    <span className={styles.amount}>{t('pricing.price49')}</span>
                                    <span className={styles.period}>{t('pricing.perMonth')}</span>
                                </div>
                            </div>
                        </div>

                        <ul className={styles.featureList}>
                            {Array.isArray(proFeatures) && proFeatures.map((feat, index) => (
                                <li key={index}>
                                    <Check size={20} className={styles.proCheckIcon} />
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <a href="https://obrafacilapp.expertbr.com/cadastro?checkout=true" className={`btn-neon ${styles.proBtn}`} style={{ display: 'block', width: '100%', marginTop: 'auto', textAlign: 'center' }}>
                            {t('pricing.proCta')}
                        </a>
                    </div>

                </div>

                <div className="text-center mt-5">
                    <p className={styles.addonsText}>{t('pricing.addons')}</p>
                </div>

            </div>
        </section>
    );
}
