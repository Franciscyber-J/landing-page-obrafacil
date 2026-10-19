// Última chamada da página inicial: a faixa laranja da placa, com o cadastro e o WhatsApp.
import { useTranslation } from 'react-i18next';
import { CADASTRO, linkWhatsApp } from '../../links.js';
import styles from './Chamada.module.css';

export default function Chamada() {
    const { t } = useTranslation();

    return (
        <section className={styles.chamada} aria-labelledby="chamada-titulo">
            <div className={`container ${styles.grade}`}>
                <div>
                    <h2 id="chamada-titulo" className={styles.titulo}>{t('chamada.titulo')}</h2>
                    <p className={styles.texto}>{t('chamada.texto')}</p>
                </div>
                <div className={styles.acoes}>
                    <a href={CADASTRO} className={styles.botao}>{t('chamada.acao')}</a>
                    <p className={styles.nota}>{t('hero.semCartao')}</p>
                    <a href={linkWhatsApp(t('whatsapp.message'))} target="_blank" rel="noopener noreferrer" className={styles.whatsapp}>
                        {t('chamada.duvida')}
                    </a>
                </div>
            </div>
        </section>
    );
}
