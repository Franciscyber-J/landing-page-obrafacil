// O cliente acompanha a obra pelo portal: o antes (perguntas pelo WhatsApp) e o agora (a tela real do portal).
import { useTranslation } from 'react-i18next';
import { idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { CADASTRO } from '../../links.js';
import { enderecoDaTela } from '../../telas.js';
import styles from './Cliente.module.css';

export default function Cliente() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const pontos = t('cliente.pontos', { returnObjects: true });

    return (
        <section id={idDaSecao(codigo, 'sobre')} className="secao" aria-labelledby="cliente-titulo">
            <div className={`container ${styles.grade}`}>
                <div>
                    <div className="secao-cabeca">
                        <h2 id="cliente-titulo" className="secao-titulo">{t('cliente.titulo')}</h2>
                        <p className="secao-texto">{t('cliente.texto')}</p>
                    </div>
                    <ol className={styles.pontos}>
                        {Array.isArray(pontos) && pontos.map((ponto, i) => (
                            <li key={ponto}>
                                <span className={styles.numero} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                                <span>{ponto}</span>
                            </li>
                        ))}
                    </ol>
                    <a href={CADASTRO} className={`acao ${styles.acao}`}>{t('hero.comecar')}</a>
                </div>

                <div className={styles.comparacao}>
                    <figure className={styles.antes}>
                        <figcaption className={styles.legenda}>{t('cliente.antes')}</figcaption>
                        <div className={styles.conversa}>
                            <p className={styles.contato}>{t('cliente.nome')}</p>
                            <p className={styles.dia}>{t('cliente.hoje')}</p>
                            <p className={styles.recebida}>{t('cliente.msg1')}<span>07:42</span></p>
                            <p className={styles.recebida}>{t('cliente.msg2')}<span>07:43</span></p>
                            <p className={styles.enviada}>{t('cliente.msg3')}<span>11:58</span></p>
                        </div>
                        <p className={styles.aviso}>{t('cliente.conversaAviso')}</p>
                    </figure>

                    <figure className={styles.depois}>
                        <figcaption className={styles.legenda}>{t('cliente.depois')}</figcaption>
                        <div className={styles.telas}>
                            <div className="aparelho">
                                <img
                                    src={enderecoDaTela(codigo, 'portal')}
                                    alt={t('cliente.telaPortal')}
                                    width="720"
                                    height="1600"
                                    loading="lazy"
                                />
                            </div>
                            <div className={`aparelho ${styles.segunda}`}>
                                <img
                                    src={enderecoDaTela(codigo, 'acesso')}
                                    alt={t('cliente.telaAcesso')}
                                    width="720"
                                    height="1600"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </figure>
                </div>
            </div>
        </section>
    );
}
