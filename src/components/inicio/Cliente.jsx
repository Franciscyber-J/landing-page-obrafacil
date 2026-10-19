// O cliente acompanha a obra pelo portal: o antes (perguntas pelo WhatsApp) e o agora (a tela real do portal).
// Movimento: as mensagens chegam uma a uma (com o "digitando"), e depois o portal entra em 3D por cima.
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { enderecoDaTela } from '../../telas.js';
import { COM_MOVIMENTO, gsap, useGSAP } from '../../movimento/index.js';
import { comDestaque } from '../../texto.jsx';
import styles from './Cliente.module.css';
import { linkComecar } from '../../comecar.js';

export default function Cliente() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const pontos = t('cliente.pontos', { returnObjects: true });
    const comparacao = useRef(null);

    useGSAP(() => {
        const mm = gsap.matchMedia();
        mm.add(COM_MOVIMENTO, () => {
            const q = gsap.utils.selector(comparacao);
            const tl = gsap.timeline({ scrollTrigger: { trigger: comparacao.current, start: 'top 75%', once: true } });
            tl.from(q('[data-m="legenda-antes"]'), { y: 16, autoAlpha: 0, duration: 0.6 })
                .from(q('[data-m="conversa"]'), { y: 30, autoAlpha: 0, duration: 0.7 }, '-=0.3');
            q('[data-m="msg"]').forEach((msg) => {
                const digitando = msg.previousElementSibling?.dataset.m === 'digitando' ? msg.previousElementSibling : null;
                if (digitando) {
                    tl.set(digitando, { display: 'inline-flex' })
                        .fromTo(digitando, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
                        .to(digitando, { autoAlpha: 0, duration: 0.15 }, '+=0.5')
                        .set(digitando, { display: 'none' });
                }
                tl.from(msg, { y: 14, scale: 0.94, autoAlpha: 0, transformOrigin: 'left bottom', duration: 0.5, ease: 'back.out(1.6)' });
            });
            tl.from(q('[data-m="legenda-depois"]'), { scaleX: 0, transformOrigin: 'left center', duration: 0.7, ease: 'power3.inOut' }, '+=0.15')
                .from(q('[data-m="portal"]'), { x: 80, rotationY: -35, autoAlpha: 0, duration: 1.1 }, '-=0.3')
                .from(q('[data-m="acesso"]'), { y: 80, rotationZ: 8, autoAlpha: 0, duration: 1 }, '-=0.6');
        });
    }, { scope: comparacao, dependencies: [codigo], revertOnUpdate: true });

    return (
        <section id={idDaSecao(codigo, 'sobre')} className="secao" aria-labelledby="cliente-titulo">
            <div className={`container ${styles.grade}`}>
                <div>
                    <div className="secao-cabeca">
                        <h2 id="cliente-titulo" className="secao-titulo">{comDestaque(t('cliente.titulo'))}</h2>
                        <p className="secao-texto">{t('cliente.texto')}</p>
                    </div>
                    <ol className={styles.pontos} data-grupo>
                        {Array.isArray(pontos) && pontos.map((ponto, i) => (
                            <li key={ponto} data-item>
                                <span className={styles.numero} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                                <span>{ponto}</span>
                            </li>
                        ))}
                    </ol>
                    <a {...linkComecar(codigo)} className={`acao ${styles.acao}`}>{t('hero.comecar')}</a>
                </div>

                <div className={styles.comparacao} ref={comparacao}>
                    <figure className={styles.antes}>
                        <figcaption className={styles.legenda} data-m="legenda-antes">{t('cliente.antes')}</figcaption>
                        <div className={styles.conversa} data-m="conversa">
                            <p className={styles.contato}>{t('cliente.nome')}</p>
                            <p className={styles.dia}>{t('cliente.hoje')}</p>
                            <span className={styles.digitando} data-m="digitando" aria-hidden="true"><i /><i /><i /></span>
                            <p className={styles.recebida} data-m="msg">{t('cliente.msg1')}<span>07:42</span></p>
                            <span className={styles.digitando} data-m="digitando" aria-hidden="true"><i /><i /><i /></span>
                            <p className={styles.recebida} data-m="msg">{t('cliente.msg2')}<span>07:43</span></p>
                            <p className={styles.enviada} data-m="msg">{t('cliente.msg3')}<span>11:58</span></p>
                        </div>
                        <p className={styles.aviso}>{t('cliente.conversaAviso')}</p>
                    </figure>

                    <figure className={styles.depois}>
                        <figcaption className={styles.legenda} data-m="legenda-depois">{t('cliente.depois')}</figcaption>
                        <div className={`${styles.telas} palco-3d`}>
                            <div className="aparelho" data-m="portal">
                                <img
                                    src={enderecoDaTela(codigo, 'portal')}
                                    alt={t('cliente.telaPortal')}
                                    width="720"
                                    height="1600"
                                    loading="lazy"
                                />
                            </div>
                            <div className={`aparelho ${styles.segunda}`} data-m="acesso">
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
