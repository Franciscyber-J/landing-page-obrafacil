// Perguntas frequentes: as dúvidas que seguram a decisão (preço do cliente, internet, dados, cancelamento).
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { caminhoAjuda, idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { linkWhatsApp } from '../../links.js';
import styles from './Perguntas.module.css';

const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Perguntas() {
    const { t } = useTranslation();
    const codigo = useIdioma();

    return (
        <section id={idDaSecao(codigo, 'faq')} className="secao" aria-labelledby="faq-titulo">
            <div className={`container ${styles.grade}`}>
                <div className={`secao-cabeca ${styles.cabeca}`}>
                    <h2 id="faq-titulo" className="secao-titulo">{t('faq.title')}</h2>
                </div>

                <div className={styles.ajuda}>
                    <p>{t('faq.mais')}</p>
                    <Link to={caminhoAjuda(codigo)} className="acao-contorno">{t('faq.verAjuda')}</Link>
                    <a href={linkWhatsApp(t('whatsapp.message'))} target="_blank" rel="noopener noreferrer" className={styles.whatsapp}>
                        {t('chamada.whatsapp')}
                    </a>
                </div>

                <div className={styles.lista}>
                    {NUMEROS.map((n) => (
                        <details key={n} className={styles.pergunta}>
                            <summary>
                                <span>{t(`faq.q${n}`)}</span>
                                <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
                            </summary>
                            <p>{t(`faq.a${n}`)}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
