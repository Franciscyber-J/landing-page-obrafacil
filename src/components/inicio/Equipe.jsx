// Papéis na obra: quem é dono convida e decide o que cada um vê e faz.
// Movimento: os números dos papéis viram como placas, e o celular entra girando em 3D.
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { enderecoDaTela } from '../../telas.js';
import { COM_MOUSE, COM_MOVIMENTO, gsap, inclinarComPonteiro, jaApareceu, sentidoDoIdioma, useGSAP } from '../../movimento/index.js';
import styles from './Equipe.module.css';

const PAPEIS = ['gestor', 'engenheiro', 'equipe', 'cliente'];

export default function Equipe() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const raiz = useRef(null);

    useGSAP(() => {
        const mm = gsap.matchMedia();
        const q = gsap.utils.selector(raiz);
        const s = sentidoDoIdioma(codigo);
        mm.add(COM_MOVIMENTO, () => {
            if (!jaApareceu(q('[data-grupo]')[0])) {
                gsap.from(q('[data-m="ordem"]'), {
                    rotationX: -90, transformOrigin: 'center bottom', stagger: 0.12, duration: 0.8, delay: 0.3,
                    scrollTrigger: { trigger: q('[data-grupo]')[0], start: 'top 85%', once: true },
                });
            }
            if (!jaApareceu(q('[data-m="painel"]')[0])) {
                gsap.from(q('[data-m="aparelho"]'), {
                    y: 80, rotationY: 30 * s, rotationZ: -4 * s, autoAlpha: 0, duration: 1.3,
                    scrollTrigger: { trigger: q('[data-m="painel"]')[0], start: 'top 80%', once: true },
                });
            }
        });
        mm.add(COM_MOUSE, () => inclinarComPonteiro(q('[data-m="painel"]')[0], q('[data-m="aparelho"]')[0], { graus: 7 }));
    }, { scope: raiz, dependencies: [codigo], revertOnUpdate: true });

    return (
        <section ref={raiz} id={idDaSecao(codigo, 'equipe')} className="secao" aria-labelledby="equipe-titulo">
            <div className={`container ${styles.grade}`}>
                <div>
                    <div className="secao-cabeca">
                        <h2 id="equipe-titulo" className="secao-titulo">{t('equipe.titulo')}</h2>
                        <p className="secao-texto">{t('equipe.texto')}</p>
                    </div>
                    <dl className={styles.papeis} data-grupo>
                        {PAPEIS.map((id, i) => (
                            <div key={id} className={styles.papel} data-item>
                                <dt>
                                    <span className={styles.ordem} aria-hidden="true" data-m="ordem">{i + 1}</span>
                                    {t(`equipe.papeis.${id}.nome`)}
                                </dt>
                                <dd>{t(`equipe.papeis.${id}.desc`)}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className={`${styles.painel} palco-3d`} data-m="painel">
                    <div className="aparelho" data-m="aparelho">
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
