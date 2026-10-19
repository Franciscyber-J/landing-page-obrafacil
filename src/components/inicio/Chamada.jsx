// Última chamada da página inicial: a faixa laranja da placa, com o cadastro e o WhatsApp.
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CADASTRO, linkWhatsApp } from '../../links.js';
import { COM_MOUSE, COM_MOVIMENTO, gsap, magnetico, tituloSobe, useGSAP } from '../../movimento/index.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import styles from './Chamada.module.css';

export default function Chamada() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const raiz = useRef(null);

    useGSAP(() => {
        const mm = gsap.matchMedia();
        const q = gsap.utils.selector(raiz);
        mm.add(COM_MOVIMENTO, () => {
            const gatilho = { trigger: raiz.current, start: 'top 80%', once: true };
            tituloSobe(q('[data-m="titulo"]')[0], { scrollTrigger: gatilho, stagger: 0.12 });
            gsap.from(q('[data-m="lado"]'), { x: 40, autoAlpha: 0, duration: 1, delay: 0.3, scrollTrigger: gatilho });
        });
        mm.add(COM_MOUSE, () => magnetico(q('[data-m="botao"]')[0], { forca: 0.3 }));
    }, { scope: raiz, dependencies: [codigo], revertOnUpdate: true });

    return (
        <section ref={raiz} className={styles.chamada} aria-labelledby="chamada-titulo">
            <div className={`container ${styles.grade}`}>
                <div>
                    <h2 id="chamada-titulo" className={styles.titulo} data-m="titulo">{t('chamada.titulo')}</h2>
                    <p className={styles.texto}>{t('chamada.texto')}</p>
                </div>
                <div className={styles.acoes} data-m="lado">
                    <a href={CADASTRO} className={styles.botao} data-m="botao">{t('chamada.acao')}</a>
                    <p className={styles.nota}>{t('hero.semCartao')}</p>
                    <a href={linkWhatsApp(t('whatsapp.message'))} target="_blank" rel="noopener noreferrer" className={styles.whatsapp}>
                        {t('chamada.duvida')}
                    </a>
                </div>
            </div>
        </section>
    );
}
