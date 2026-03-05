import { useTranslation } from 'react-i18next';
import {
    FileText,
    PieChart,
    Smartphone,
    Laptop,
    Sparkles,
    Users
} from 'lucide-react';
import styles from './CoreFeatures.module.css';

export default function CoreFeatures() {
    const { t } = useTranslation();

    const features = [
        {
            id: 'rdo',
            icon: <FileText className={styles.icon} />,
            title: t('coreFeatures.rdoTitle'),
            text: t('coreFeatures.rdoText'),
            colorClass: styles.cyan
        },
        {
            id: 'finance',
            icon: <PieChart className={styles.icon} />,
            title: t('coreFeatures.financeTitle'),
            text: t('coreFeatures.financeText'),
            colorClass: styles.blue
        },
        {
            id: 'portal',
            icon: <Smartphone className={styles.icon} />,
            title: t('coreFeatures.portalTitle'),
            text: t('coreFeatures.portalText'),
            colorClass: styles.cyan
        },
        {
            id: 'whiteLabel',
            icon: <Sparkles className={styles.icon} />,
            title: t('coreFeatures.whiteLabelTitle'),
            text: t('coreFeatures.whiteLabelText'),
            colorClass: styles.gold,
            isPro: true
        },
        {
            id: 'team',
            icon: <Users className={styles.icon} />,
            title: t('coreFeatures.teamTitle'),
            text: t('coreFeatures.teamText'),
            colorClass: styles.blue
        },
        {
            id: 'sync',
            icon: <Laptop className={styles.icon} />,
            title: t('coreFeatures.syncTitle'),
            text: t('coreFeatures.syncText'),
            colorClass: styles.cyan
        }
    ];

    return (
        <section className={`section ${styles.section}`}>
            <div className="container">

                <div className="text-center mb-5">
                    <h2 className={styles.sectionTitle}>{t('coreFeatures.title')}</h2>
                </div>

                <div className={styles.grid}>
                    {features.map((feat) => (
                        <div key={feat.id} className={`glass-panel ${styles.card} ${feat.colorClass}`}>
                            <div className={styles.iconWrapper}>
                                {feat.icon}
                            </div>
                            <h3 className={styles.cardTitle}>
                                {feat.title}
                                {feat.isPro && <span className={styles.proBadge}>PRO</span>}
                            </h3>
                            <p className={styles.cardText}>{feat.text}</p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
