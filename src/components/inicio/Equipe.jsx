// Papéis na obra: quem é dono convida e decide o que cada um vê e faz.
import { useTranslation } from 'react-i18next';
import { idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { enderecoDaTela } from '../../telas.js';
import styles from './Equipe.module.css';

const PAPEIS = ['gestor', 'engenheiro', 'equipe', 'cliente'];

export default function Equipe() {
    const { t } = useTranslation();
    const codigo = useIdioma();

    return (
        <section id={idDaSecao(codigo, 'equipe')} className="secao" aria-labelledby="equipe-titulo">
            <div className={`container ${styles.grade}`}>
                <div>
                    <div className="secao-cabeca">
                        <h2 id="equipe-titulo" className="secao-titulo">{t('equipe.titulo')}</h2>
                        <p className="secao-texto">{t('equipe.texto')}</p>
                    </div>
                    <dl className={styles.papeis}>
                        {PAPEIS.map((id, i) => (
                            <div key={id} className={styles.papel}>
                                <dt>
                                    <span className={styles.ordem} aria-hidden="true">{i + 1}</span>
                                    {t(`equipe.papeis.${id}.nome`)}
                                </dt>
                                <dd>{t(`equipe.papeis.${id}.desc`)}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className={styles.painel}>
                    <div className="aparelho">
                        <img
                            src={enderecoDaTela(codigo, 'equipe')}
                            alt={t('equipe.tela')}
                            width="720"
                            height="1600"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
