// Quadro de preços: grátis sem prazo e o PRO, mensal ou anual (o anual abre primeiro, com a economia
// calculada a partir dos preços reais de src/i18n/pricing.js, sem preço "de" inventado).
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { getPricing } from '../../i18n/pricing.js';
import { idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { ASSINAR_ANUAL, ASSINAR_MENSAL, CADASTRO } from '../../links.js';
import { COM_MOUSE, gsap, inclinarComPonteiro, magnetico, useGSAP } from '../../movimento/index.js';
import styles from './Precos.module.css';

// Lista de textos da tradução (returnObjects); qualquer outra coisa vira lista vazia.
function lista(valor) {
    return Array.isArray(valor) ? valor : [];
}

// O símbolo vem antes ou depois do número conforme o idioma (R$ 99,90 / 17,99 €).
function simboloDepois(codigo, moeda) {
    try {
        const partes = new Intl.NumberFormat(codigo, { style: 'currency', currency: moeda.toUpperCase() }).formatToParts(1);
        return partes.findIndex((p) => p.type === 'currency') > partes.findIndex((p) => p.type === 'integer');
    } catch {
        return false;
    }
}

function Preco({ p, valor, periodo, depois }) {
    const moeda = <span className={styles.moeda}>{p.symbol}</span>;
    return (
        <p className={styles.preco} aria-live="polite">
            {!depois && moeda}
            <span className={styles.valorCaixa}><span key={valor} className={styles.valor}>{valor}</span></span>
            {depois && moeda}
            {periodo && <span className={styles.periodoPreco}>{periodo}</span>}
        </p>
    );
}

function Lista({ itens, clara }) {
    if (!itens.length) return null;
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
    const depois = simboloDepois(codigo, p.currency);
    const raiz = useRef(null);

    useGSAP(() => {
        const mm = gsap.matchMedia();
        mm.add(COM_MOUSE, () => {
            const q = gsap.utils.selector(raiz);
            const limpar = [
                inclinarComPonteiro(q('[data-m="pro"]')[0], q('[data-m="pro"]')[0], { graus: 4 }),
                ...q('[data-m="assinar"]').map((b) => magnetico(b, { forca: 0.15 })),
            ];
            return () => limpar.forEach((f) => f());
        });
    }, { scope: raiz, dependencies: [codigo], revertOnUpdate: true });

    const itensPro = [
        ...(anual ? lista(t('pricing.pro.itensAnual', { returnObjects: true })) : []),
        ...lista(t('pricing.pro.itens', { returnObjects: true })),
    ].filter((item, i, todos) => todos.indexOf(item) === i);

    return (
        <section ref={raiz} id={idDaSecao(codigo, 'precos')} className="secao" aria-labelledby="precos-titulo">
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

                <div className={`${styles.grade} palco-3d`} data-grupo>
                    <article className={styles.gratis} aria-labelledby="plano-gratis" data-item>
                        <h3 id="plano-gratis" className={styles.nome}>{t('pricing.gratis.nome')}</h3>
                        <p className={styles.desc}>{t('pricing.gratis.desc')}</p>
                        <Preco p={p} valor="0" depois={depois} />
                        <p className={styles.detalhe}>{t('pricing.gratisPreco')}</p>
                        <Lista itens={lista(t('pricing.gratis.itens', { returnObjects: true }))} />
                        <a href={CADASTRO} className={`acao-contorno ${styles.botao}`}>{t('pricing.gratis.cta')}</a>
                    </article>

                    <article className={styles.pro} aria-labelledby="plano-pro" data-item data-m="pro">
                        <div className={styles.faixa}>
                            <span>PRO</span>
                            {anual && <span>{t('pricing.selo')}</span>}
                        </div>
                        <div className={styles.corpo}>
                            <h3 id="plano-pro" className={styles.nome}>
                                {anual ? t('pricing.pro.nomeAnual') : t('pricing.pro.nomeMensal')}
                            </h3>
                            <p className={styles.desc}>{t('pricing.pro.desc')}</p>
                            <Preco
                                p={p}
                                valor={anual ? p.annual : p.monthly}
                                periodo={anual ? t('pricing.periodAnnual') : t('pricing.perMonth')}
                                depois={depois}
                            />
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
                            <a href={anual ? ASSINAR_ANUAL : ASSINAR_MENSAL} className={`acao ${styles.botao}`} data-m="assinar">
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
