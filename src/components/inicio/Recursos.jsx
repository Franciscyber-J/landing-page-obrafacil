// O que o app faz, em campos de placa (título à esquerda, explicação à direita), ao lado da tela real.
import { useTranslation } from 'react-i18next';
import { idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { CADASTRO } from '../../links.js';
import { enderecoDaTela } from '../../telas.js';
import styles from './Recursos.module.css';

const ITENS = ['cronograma', 'diario', 'financeiro', 'equipe', 'compras', 'marca', 'offline', 'aparelhos'];

export default function Recursos() {
    const { t } = useTranslation();
    const codigo = useIdioma();

    return (
        <section id={idDaSecao(codigo, 'recursos')} className="secao secao-escura" aria-labelledby="recursos-titulo">
            <div className="container">
                <div className="secao-cabeca">
                    <h2 id="recursos-titulo" className="secao-titulo">{t('recursos.titulo')}</h2>
                </div>

                <div className={styles.grade}>
                    <div className={styles.painel}>
                        <div className={`aparelho ${styles.aparelho}`}>
                            <img
                                src={enderecoDaTela(codigo, 'obra')}
                                alt={t('recursos.tela')}
                                width="720"
                                height="1600"
                                loading="lazy"
                            />
                        </div>
                        <p className={styles.legenda}>{t('hero.legendaTela')}</p>
                    </div>

                    <div>
                        <dl className={styles.itens}>
                            {ITENS.map((id) => (
                                <div key={id} className={styles.item}>
                                    <dt>{t(`recursos.itens.${id}.titulo`)}</dt>
                                    <dd>{t(`recursos.itens.${id}.texto`)}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className={styles.acoes}>
                            <a href={CADASTRO} className="acao">{t('hero.comecar')}</a>
                            <p>{t('hero.semCartao')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
