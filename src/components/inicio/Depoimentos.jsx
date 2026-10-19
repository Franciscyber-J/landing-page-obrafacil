// Depoimentos reais de clientes (publicados com autorização), logo antes dos preços.
import { useTranslation } from 'react-i18next';
import styles from './Depoimentos.module.css';

const ORDEM = [2, 1, 3, 4, 5];

// Os textos vêm entre aspas no arquivo de idioma; as aspas são desenhadas pelo estilo.
function semAspas(texto) {
    return String(texto).trim().replace(/^["“«]+|["”»]+$/g, '');
}

export default function Depoimentos() {
    const { t } = useTranslation();
    const [destaque, ...outros] = ORDEM;

    return (
        <section className={`secao ${styles.secao}`} aria-labelledby="depoimentos-titulo">
            <div className="container">
                <div className="secao-cabeca">
                    <h2 id="depoimentos-titulo" className="secao-titulo">{t('social.title')}</h2>
                </div>

                <div className={styles.grade} data-grupo>
                    <figure className={styles.destaque} data-item data-painel>
                        <blockquote>{semAspas(t(`social.test${destaque}`))}</blockquote>
                        <figcaption>
                            <strong>{t(`social.author${destaque}`)}</strong>
                            <span>{t(`social.role${destaque}`)}</span>
                        </figcaption>
                    </figure>

                    <div className={styles.outros}>
                        {outros.map((n) => (
                            <figure key={n} className={styles.depoimento} data-item>
                                <blockquote>{semAspas(t(`social.test${n}`))}</blockquote>
                                <figcaption>
                                    <strong>{t(`social.author${n}`)}</strong>
                                    <span>{t(`social.role${n}`)}</span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
                <p className={styles.aviso}>{t('social.aviso')}</p>
            </div>
        </section>
    );
}
