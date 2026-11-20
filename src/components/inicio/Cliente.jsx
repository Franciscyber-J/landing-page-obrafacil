// O cliente acompanha a obra pelo portal: o antes (perguntas pelo aplicativo de mensagens do país) e o agora (a tela
// real do portal). O "antes" é a ConversaSimulada: WhatsApp, LINE, KakaoTalk, Zalo, Telegram, Viber, Messenger ou as
// mensagens de texto do celular, conforme o idioma (src/i18n/aplicativoDeMensagens.js).
// Movimento: as mensagens chegam uma a uma (com o balão do "digitando" e, nos aplicativos que mostram, o "digitando..."
// no cabeçalho), e depois o portal entra em 3D por cima. Com "menos movimento", a conversa aparece completa.
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { enderecoDaTela } from '../../telas.js';
import { COM_MOVIMENTO, gsap, inicioDoIdioma, jaApareceu, sentidoDoIdioma, useGSAP } from '../../movimento/index.js';
import { comDestaque } from '../../texto.jsx';
import ConversaSimulada from './ConversaSimulada.jsx';
import styles from './Cliente.module.css';
import { useLinkComecar } from '../../useNavegador.js';

export default function Cliente() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const comecar = useLinkComecar(codigo);
    const pontos = t('cliente.pontos', { returnObjects: true });
    const comparacao = useRef(null);

    useGSAP(() => {
        const mm = gsap.matchMedia();
        const s = sentidoDoIdioma(codigo);
        const inicio = inicioDoIdioma(codigo);
        const fim = inicio === 'left' ? 'right' : 'left';
        mm.add(COM_MOVIMENTO, () => {
            if (jaApareceu(comparacao.current)) return;
            const q = gsap.utils.selector(comparacao);
            const tl = gsap.timeline({ scrollTrigger: { trigger: comparacao.current, start: 'top 75%', once: true } });
            tl.from(q('[data-m="legenda-antes"]'), { y: 16, autoAlpha: 0, duration: 0.6 })
                .from(q('[data-m="conversa"]'), { y: 30, autoAlpha: 0, duration: 0.7 }, '-=0.3');
            // Enquanto o balão do "digitando" aparece, o cabeçalho troca "online" por "digitando...", como no WhatsApp.
            const online = q('[data-m="online"]');
            const statusDigitando = q('[data-m="status-digitando"]');
            const trocaStatus = online.length > 0 && statusDigitando.length > 0;
            q('[data-m="msg"]').forEach((msg) => {
                const digitando = msg.previousElementSibling?.dataset.m === 'digitando' ? msg.previousElementSibling : null;
                if (digitando) {
                    if (trocaStatus) tl.set(online, { display: 'none' }).set(statusDigitando, { display: 'inline' });
                    tl.set(digitando, { display: 'inline-flex' })
                        .fromTo(digitando, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
                        .to(digitando, { autoAlpha: 0, duration: 0.15 }, '+=0.9')
                        .set(digitando, { display: 'none' });
                    if (trocaStatus) tl.set(statusDigitando, { display: 'none' }).set(online, { display: 'inline' });
                }
                const lado = msg.dataset.lado === 'enviada' ? fim : inicio;
                tl.from(msg, { y: 14, scale: 0.94, autoAlpha: 0, transformOrigin: `${lado} top`, duration: 0.5, ease: 'back.out(1.6)' }, digitando ? '>' : '+=0.6');
            });
            tl.from(q('[data-m="legenda-depois"]'), { scaleX: 0, transformOrigin: `${inicio} center`, duration: 0.7, ease: 'power3.inOut' }, '+=0.15')
                .from(q('[data-m="portal"]'), { x: 80 * s, rotationY: -35 * s, autoAlpha: 0, duration: 1.1 }, '-=0.3')
                .from(q('[data-m="acesso"]'), { y: 80, rotationZ: 8 * s, autoAlpha: 0, duration: 1 }, '-=0.6');
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
                    <a {...comecar} className={`acao ${styles.acao}`}>{t('hero.comecar')}</a>
                </div>

                <div className={styles.comparacao} ref={comparacao}>
                    <figure className={styles.antes}>
                        <figcaption className={styles.legenda} data-m="legenda-antes">{t('cliente.antes')}</figcaption>
                        <ConversaSimulada codigo={codigo} />
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
