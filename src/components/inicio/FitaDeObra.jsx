// Duas fitas de obra cruzadas, com as partes do app passando (decorativas: o mesmo conteúdo está
// na seção de recursos). Andam sozinhas e aceleram com a rolagem; com "menos movimento", ficam paradas.
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { COM_MOVIMENTO, ScrollTrigger, gsap, sentidoDoIdioma, useGSAP } from '../../movimento/index.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import styles from './FitaDeObra.module.css';

const ITENS = ['cronograma', 'diario', 'financeiro', 'equipe', 'compras', 'marca', 'offline', 'aparelhos'];

function Fita({ textos, className }) {
    // Duas cópias seguidas: quando a primeira sai inteira, a volta recomeça sem emenda.
    return (
        <div className={`${styles.fita} ${className}`}>
            <div className={styles.trilho} data-m="trilho">
                {[0, 1].map((copia) => (
                    <ul key={copia} className={styles.lista}>
                        {textos.map((texto) => <li key={texto}>{texto}</li>)}
                    </ul>
                ))}
            </div>
        </div>
    );
}

export default function FitaDeObra() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const raiz = useRef(null);
    const textos = ITENS.map((id) => t(`recursos.itens.${id}.titulo`));
    const inverso = [...textos].reverse();

    useGSAP(() => {
        const mm = gsap.matchMedia();
        // Na escrita da direita para a esquerda o trilho começa na direita: as fitas andam ao contrário (sem emenda).
        const s = sentidoDoIdioma(codigo);
        mm.add(COM_MOVIMENTO, () => {
            const [a, b] = gsap.utils.toArray('[data-m="trilho"]', raiz.current);
            const ida = gsap.to(a, { xPercent: -50 * s, duration: 38, ease: 'none', repeat: -1 });
            const volta = gsap.fromTo(b, { xPercent: -50 * s }, { xPercent: 0, duration: 44, ease: 'none', repeat: -1 });
            // A velocidade da rolagem dá um empurrão nas fitas, que voltam ao ritmo normal aos poucos.
            const gatilho = ScrollTrigger.create({
                trigger: raiz.current,
                start: 'top bottom',
                end: 'bottom top',
                onUpdate(self) {
                    const empurrao = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 6);
                    gsap.to([ida, volta], {
                        timeScale: empurrao,
                        duration: 0.3,
                        overwrite: true,
                        onComplete: () => gsap.to([ida, volta], { timeScale: 1, duration: 1.4, overwrite: true }),
                    });
                },
            });
            // Paradas fora da tela (não gastam bateria) e enquanto o mouse está em cima (dá para ler).
            const visivel = ScrollTrigger.create({
                trigger: raiz.current,
                start: 'top bottom',
                end: 'bottom top',
                onToggle: (self) => [ida, volta].forEach((tw) => tw.paused(!self.isActive)),
            });
            if (!visivel.isActive) [ida, volta].forEach((tw) => tw.pause());
            const parar = () => [ida, volta].forEach((tw) => tw.pause());
            const seguir = () => { if (visivel.isActive) [ida, volta].forEach((tw) => tw.play()); };
            raiz.current.addEventListener('pointerenter', parar);
            raiz.current.addEventListener('pointerleave', seguir);
            const elemento = raiz.current;
            return () => {
                gatilho.kill();
                visivel.kill();
                elemento.removeEventListener('pointerenter', parar);
                elemento.removeEventListener('pointerleave', seguir);
            };
        });
    }, { scope: raiz, dependencies: [codigo], revertOnUpdate: true });

    return (
        <div ref={raiz} className={styles.cruzamento} aria-hidden="true">
            <Fita textos={textos} className={styles.laranja} />
            <Fita textos={inverso} className={styles.azul} />
        </div>
    );
}
