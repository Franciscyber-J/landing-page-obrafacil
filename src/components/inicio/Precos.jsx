// Quadro de preços: grátis sem prazo e o PRO, mensal ou anual (o anual abre primeiro, com a economia
// calculada a partir dos preços reais de src/i18n/pricing.js, sem preço "de" inventado).
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { getPricing } from '../../i18n/pricing.js';
import { idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { ASSINAR_ANUAL, ASSINAR_MENSAL, CADASTRO } from '../../links.js';
import styles from './Precos.module.css';

function Lista({ itens, clara }) {
    if (!Array.isArray(itens)) return null;
    return (
        <ul className={`${styles.lista} ${clara ? styles.listaClara : ''}`}>
            {itens.map((item) => (
                <li key={item}>
                    <Check size={18} strokeWidth={3} aria-hidden="true" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

export default function Precos() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const [anual, setAnual] = useState(true);
    const p = getPricing(codigo);

    const itensPro = [
        ...(anual ? t('pricing.pro.itensAnual', { returnObjects: true }) : []),
        ...t('pricing.pro.itens', { returnObjects: true }),
    ].filter((item, i, todos) => todos.indexOf(item) === i);

    return (
        <section id={idDaSecao(codigo, 'precos')} className="secao" aria-labelledby="precos-titulo">
            <div className="container">
                <div className={styles.cabeca}>
                    <div className="secao-cabeca">
                        <h2 id="precos-titulo" className="secao-titulo">{t('pricing.title')}</h2>
                    </div>

                    <div className={styles.periodo} role="group" aria-label={t('pricing.periodoRotulo')}>
                        <button type="button" aria-pressed={!anual} onClick={() => setAnual(false)}>
                            {t('pricing.toggleMonthly')}
                        </button>
                        <button type="button" aria-pressed={anual} onClick={() => setAnual(true)}>
                            {t('pricing.toggleAnnual')}
                            <span className={styles.economia}>
                                {t('pricing.economia', { simbolo: p.symbol, valor: p.annualSavings })}
                            </span>
                        </button>
                    </div>
                </div>

                <div className={styles.grade}>
                    <article className={styles.gratis} aria-labelledby="plano-gratis">
                        <h3 id="plano-gratis" className={styles.nome}>{t('pricing.gratis.nome')}</h3>
                        <p className={styles.desc}>{t('pricing.gratis.desc')}</p>
                        <p className={styles.preco}>
                            <span className={styles.moeda}>{p.symbol}</span>
                            <span className={styles.valor}>0</span>
                        </p>
                        <p className={styles.detalhe}>{t('pricing.gratisPreco')}</p>
                        <Lista itens={t('pricing.gratis.itens', { returnObjects: true })} />
                        <a href={CADASTRO} className={`acao-contorno ${styles.botao}`}>{t('pricing.gratis.cta')}</a>
                    </article>

                    <article className={styles.pro} aria-labelledby="plano-pro">
                        <div className={styles.faixa}>
                            <span>PRO</span>
                            {anual && <span>{t('pricing.selo')}</span>}
                        </div>
                        <div className={styles.corpo}>
                            <h3 id="plano-pro" className={styles.nome}>
                                {anual ? t('pricing.pro.nomeAnual') : t('pricing.pro.nomeMensal')}
                            </h3>
                            <p className={styles.desc}>{t('pricing.pro.desc')}</p>
                            <p className={styles.preco} aria-live="polite">
                                <span className={styles.moeda}>{p.symbol}</span>
                                <span className={styles.valor}>{anual ? p.annual : p.monthly}</span>
                                <span className={styles.periodoPreco}>
                                    {anual ? t('pricing.periodAnnual') : t('pricing.perMonth')}
                                </span>
                            </p>
                            {anual ? (
                                <div className={styles.detalhe}>
                                    <p className={styles.equivale}>
                                        {t('pricing.pro.equivale', { simbolo: p.symbol, valor: p.monthlyEquiv })}
                                    </p>
                                    <p>{t('pricing.pro.comparacao', { simbolo: p.symbol, valor: p.fromAnnual })}</p>
                                </div>
                            ) : (
                                <p className={styles.detalhe}>{t('pricing.renovacao')}</p>
                            )}
                            <Lista itens={itensPro} clara />
                            <a href={anual ? ASSINAR_ANUAL : ASSINAR_MENSAL} className={`acao ${styles.botao}`}>
                                {anual ? t('pricing.pro.ctaAnual') : t('pricing.pro.ctaMensal')}
                            </a>
                        </div>
                    </article>
                </div>

                <div className={styles.notas}>
                    {anual && <p>{t('pricing.renovacao')}</p>}
                    <p>{t('pricing.lojas')}</p>
                    <p>{t('pricing.addons')}</p>
                </div>
            </div>
        </section>
    );
}
