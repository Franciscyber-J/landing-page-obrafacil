// O que o app faz, em campos de placa (título à esquerda, explicação à direita), ao lado da tela real.
// Movimento (tela larga): o celular fica parado enquanto a lista rola; o item que passa pelo meio da
// tela acende e o celular mostra a tela daquela parte, girando um pouco em 3D. Uma linha laranja
// marca o quanto da lista já foi lido. No celular e com "menos movimento", a lista entra em sequência.
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { idDaSecao } from '../../i18n/idiomas.js';
import { useIdioma } from '../../i18n/RotaDoIdioma.jsx';
import { CADASTRO } from '../../links.js';
import { enderecoDaTela } from '../../telas.js';
import { COM_MOVIMENTO, LARGO, ScrollTrigger, entrarEmGrupo, gsap, useGSAP } from '../../movimento/index.js';
import styles from './Recursos.module.css';

// Cada parte e a tela real que a mostra (com o texto alternativo da tela).
const ITENS = [
    { id: 'cronograma', tela: 'etapas', alt: 'hero.telas.cronograma' },
    { id: 'diario', tela: 'rdo', alt: 'hero.telas.diario' },
    { id: 'financeiro', tela: 'financeiro', alt: 'hero.telas.financeiro' },
    { id: 'equipe', tela: 'equipe', alt: 'equipe.tela' },
    { id: 'compras', tela: 'obra', alt: 'recursos.tela' },
    { id: 'marca', tela: 'obra', alt: 'recursos.tela' },
    { id: 'offline', tela: 'obra', alt: 'recursos.tela' },
    { id: 'aparelhos', tela: 'obra', alt: 'recursos.tela' },
];

export default function Recursos() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const raiz = useRef(null);
    const [ativo, setAtivo] = useState(null);
    const [anterior, setAnterior] = useState(null);
    const telaAgora = useRef('obra');
    const [historia, setHistoria] = useState(false);

    const mostrar = useCallback((indice) => {
        setAtivo(indice);
        const nova = ITENS[indice].tela;
        if (nova !== telaAgora.current) {
            setAnterior(telaAgora.current);
            telaAgora.current = nova;
        }
    }, []);

    useGSAP(() => {
        const mm = gsap.matchMedia();
        const q = gsap.utils.selector(raiz);
        mm.add(LARGO, () => {
            setHistoria(true);
            const itens = q('[data-m="item"]');
            itens.forEach((item, i) => ScrollTrigger.create({
                trigger: item,
                start: 'top 55%',
                end: 'bottom 55%',
                onToggle: (self) => { if (self.isActive) mostrar(i); },
            }));
            gsap.fromTo(q('[data-m="aparelho"]'), { rotationY: 14, rotationX: 4 }, {
                rotationY: -14,
                rotationX: -2,
                ease: 'none',
                scrollTrigger: { trigger: q('[data-m="lista"]')[0], start: 'top 70%', end: 'bottom 40%', scrub: 0.6 },
            });
            gsap.fromTo(q('[data-m="progresso"]'), { scaleY: 0 }, {
                scaleY: 1,
                ease: 'none',
                scrollTrigger: { trigger: q('[data-m="lista"]')[0], start: 'top 55%', end: 'bottom 55%', scrub: true },
            });
            gsap.from(q('[data-m="aparelho"]'), {
                y: 100, autoAlpha: 0, duration: 1.2,
                scrollTrigger: { trigger: raiz.current, start: 'top 70%', once: true },
            });
            return () => {
                setHistoria(false);
                setAtivo(null);
            };
        });
        mm.add(`${COM_MOVIMENTO} and (max-width: 1020px)`, () => {
            entrarEmGrupo(q('[data-m="item"]'), { gatilho: q('[data-m="lista"]')[0], de: { x: -30, autoAlpha: 0 } });
        });
    }, { scope: raiz, dependencies: [codigo], revertOnUpdate: true });

    const item = ativo === null ? null : ITENS[ativo];
    const tela = item ? item.tela : 'obra';
    const alt = item ? t(item.alt) : t('recursos.tela');

    return (
        <section ref={raiz} id={idDaSecao(codigo, 'recursos')} className="secao secao-escura" aria-labelledby="recursos-titulo">
            <div className="container">
                <div className="secao-cabeca">
                    <h2 id="recursos-titulo" className="secao-titulo">{t('recursos.titulo')}</h2>
                </div>

                <div className={styles.grade}>
                    <div className={`${styles.painel} palco-3d`}>
                        <div className={`aparelho ${styles.aparelho}`} data-m="aparelho">
                            {anterior !== null && anterior !== tela && (
                                <img
                                    key={`a-${anterior}`}
                                    src={enderecoDaTela(codigo, anterior)}
                                    alt=""
                                    aria-hidden="true"
                                    className={styles.telaBaixo}
                                    width="720"
                                    height="1600"
                                />
                            )}
                            <img
                                key={tela}
                                src={enderecoDaTela(codigo, tela)}
                                alt={alt}
                                className={anterior !== null && anterior !== tela ? `${styles.tela} ${styles.telaNova}` : styles.tela}
                                width="720"
                                height="1600"
                                loading="lazy"
                                onAnimationEnd={() => setAnterior(null)}
                            />
                        </div>
                        <p className={styles.legenda}>{t('hero.legendaTela')}</p>
                    </div>

                    <div className={styles.listaCaixa}>
                        <span className={styles.progresso} data-m="progresso" aria-hidden="true" />
                        <dl className={`${styles.itens} ${historia ? styles.historia : ''}`} data-m="lista">
                            {ITENS.map((i, n) => (
                                <div key={i.id} className={`${styles.item} ${ativo === n ? styles.itemAtivo : ''}`} data-m="item">
                                    <dt>{t(`recursos.itens.${i.id}.titulo`)}</dt>
                                    <dd>{t(`recursos.itens.${i.id}.texto`)}</dd>
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
