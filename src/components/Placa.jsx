// Primeira dobra: a placa da obra. Os campos são abas: escolher um campo troca a tela do app
// no painel (a tela real daquela parte, no idioma da página).
// Movimento: a placa se monta ao abrir (faixa, título linha por linha, campos, planta desenhando,
// celular entrando em 3D); com mouse, o celular inclina seguindo o ponteiro; as abas passam sozinhas
// a cada 4,5 s até a pessoa mexer nelas (e param fora da tela ou com "menos movimento").
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { caminhoInicio } from '../i18n/idiomas.js';
import { useIdioma } from '../i18n/RotaDoIdioma.jsx';
import { CADASTRO, WINDOWS, appStore, googlePlay } from '../links.js';
import { enderecoDaTela } from '../telas.js';
import { COM_MOUSE, COM_MOVIMENTO, gsap, inclinarComPonteiro, magnetico, tituloSobe, useGSAP } from '../movimento/index.js';
import styles from './Placa.module.css';

const CAMPOS = [
    { id: 'cronograma', tela: 'etapas' },
    { id: 'diario', tela: 'rdo' },
    { id: 'financeiro', tela: 'financeiro' },
    { id: 'cliente', tela: 'portal' },
];

// Planta baixa desenhada a traço atrás do celular (decorativa).
function Planta() {
    return (
        <svg className={styles.planta} viewBox="0 0 360 520" aria-hidden="true" focusable="false">
            <g className={styles.plantaParede}>
                <path d="M30 60 H330 V460 H30 Z" />
                <path d="M30 250 H190" />
                <path d="M190 60 V200" />
                <path d="M190 250 V460" />
                <path d="M250 250 H330" />
                <path d="M110 250 V340" />
                <path d="M30 340 H110" />
            </g>
            <g className={styles.plantaDetalhe}>
                <path d="M190 200 A50 50 0 0 1 240 250" />
                <path d="M110 340 A40 40 0 0 0 150 380" />
                <path d="M80 60 H150 M80 67 H150" />
                <path d="M230 460 H300 M230 453 H300" />
                <path d="M330 110 V180 M323 110 V180" />
            </g>
            <g className={styles.plantaCota}>
                <path d="M30 30 H330 M30 22 V38 M330 22 V38 M190 24 V36" />
                <path d="M8 60 V460 M0 60 H16 M0 460 H16 M2 250 H14" />
            </g>
        </svg>
    );
}

export default function Placa() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const [ativo, setAtivo] = useState(0);
    const [anterior, setAnterior] = useState(null);
    const [automatico, setAutomatico] = useState(true);
    const abas = useRef([]);
    const raiz = useRef(null);

    // Entrada da placa e inclinação do celular
    useGSAP(() => {
        const mm = gsap.matchMedia();
        mm.add(COM_MOVIMENTO, () => {
            const q = gsap.utils.selector(raiz);
            const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
            tl.from(q('[data-m="placa"]'), { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power3.inOut' })
                .from(q('[data-m="faixa"]'), { scaleX: 0, transformOrigin: 'left center', duration: 0.7 }, '-=0.35')
                .add(() => { tituloSobe(q('[data-m="titulo"]')[0]); }, '-=0.45')
                .from(q('[data-m="subtitulo"]'), { y: 24, autoAlpha: 0, duration: 0.9 }, '+=0.25')
                .from(q('[data-m="campo"]'), { x: -28, autoAlpha: 0, stagger: 0.07, duration: 0.8 }, '-=0.6')
                .from(q('[data-m="acao"]'), { y: 18, autoAlpha: 0, stagger: 0.08, duration: 0.7 }, '-=0.5')
                .from(q('[data-m="planta"] path'), { drawSVG: 0, stagger: 0.04, duration: 1.4, ease: 'power2.inOut' }, 0.5)
                .from(q('[data-m="aparelho"]'), { y: 90, rotationY: -28, rotationX: 10, autoAlpha: 0, duration: 1.4 }, 0.7)
                .from(q('[data-m="loja"]'), { y: 16, autoAlpha: 0, stagger: 0.06, duration: 0.6 }, '-=0.8');
        });
        mm.add(COM_MOUSE, () => {
            const q = gsap.utils.selector(raiz);
            const limpar = [
                inclinarComPonteiro(q('[data-m="painel"]')[0], q('[data-m="aparelho"]')[0], { graus: 9 }),
                ...q('[data-m="acao"]').map((b) => magnetico(b, { forca: 0.2 })),
            ];
            return () => limpar.forEach((f) => f());
        });
    }, { scope: raiz, dependencies: [codigo], revertOnUpdate: true });

    // Depois da primeira tela, baixa as outras três em segundo plano (troca sem espera).
    useEffect(() => {
        const id = window.setTimeout(() => {
            CAMPOS.slice(1).forEach((c) => { const img = new Image(); img.src = enderecoDaTela(codigo, c.tela); });
        }, 1200);
        return () => window.clearTimeout(id);
    }, [codigo]);

    const ativoAgora = useRef(0);
    const trocar = useCallback((indice) => {
        const atual = ativoAgora.current;
        if (indice === atual) return;
        ativoAgora.current = indice;
        setAnterior(atual);
        setAtivo(indice);
    }, []);

    // A pessoa mexeu nas abas: param de passar sozinhas.
    const escolher = (indice) => {
        setAutomatico(false);
        trocar(indice);
    };

    // Abas passando sozinhas enquanto a placa está na tela e ninguém mexeu nela.
    useEffect(() => {
        if (!automatico || !raiz.current) return undefined;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
        let visivel = false;
        const observador = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }, { threshold: 0.4 });
        observador.observe(raiz.current);
        const id = window.setInterval(() => {
            if (visivel && !document.hidden) trocar((ativoAgora.current + 1) % CAMPOS.length);
        }, 4500);
        return () => {
            window.clearInterval(id);
            observador.disconnect();
        };
    }, [automatico, trocar]);

    const teclado = (e, indice) => {
        let novo = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') novo = (indice + 1) % CAMPOS.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') novo = (indice - 1 + CAMPOS.length) % CAMPOS.length;
        if (e.key === 'Home') novo = 0;
        if (e.key === 'End') novo = CAMPOS.length - 1;
        if (novo === null) return;
        e.preventDefault();
        escolher(novo);
        abas.current[novo]?.focus();
    };

    const campo = CAMPOS[ativo];

    return (
        <section ref={raiz} className={styles.secao} aria-labelledby="placa-titulo">
            <div className="container">
                <div className={styles.placa} data-m="placa">
                    <div className={styles.faixa} data-m="faixa">
                        <span>{t('hero.faixa')}</span>
                        <span className={styles.plataformas}>{t('hero.plataformas')}</span>
                    </div>

                    <div className={styles.corpo}>
                        <div className={styles.texto}>
                            <h1 id="placa-titulo" className={styles.titulo} data-m="titulo">{t('hero.titulo')}</h1>
                            <p className={styles.subtitulo} data-m="subtitulo">{t('hero.subtitulo')}</p>

                            <div
                                className={styles.campos}
                                role="tablist"
                                aria-label={t('hero.camposRotulo')}
                                aria-orientation="vertical"
                                onFocus={() => setAutomatico(false)}
                            >
                                {CAMPOS.map((c, i) => (
                                    <button
                                        key={c.id}
                                        ref={(el) => { abas.current[i] = el; }}
                                        type="button"
                                        role="tab"
                                        id={`campo-${c.id}`}
                                        aria-selected={i === ativo}
                                        aria-controls="placa-tela"
                                        tabIndex={i === ativo ? 0 : -1}
                                        className={styles.campo}
                                        data-m="campo"
                                        onClick={() => escolher(i)}
                                        onPointerEnter={(e) => { if (e.pointerType === 'mouse') escolher(i); }}
                                        onKeyDown={(e) => teclado(e, i)}
                                    >
                                        <span className={styles.rotulo}>{t(`hero.campos.${c.id}.rotulo`)}</span>
                                        <span className={styles.valor}>{t(`hero.campos.${c.id}.valor`)}</span>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.acoes}>
                                <a href={CADASTRO} className="acao" data-m="acao">{t('hero.comecar')}</a>
                                <Link to={caminhoInicio(codigo, 'precos')} className="acao-clara" data-m="acao">{t('hero.verPlanos')}</Link>
                            </div>
                            <p className={styles.nota}>{t('hero.semCartao')}</p>
                        </div>

                        <div className={`${styles.painel} palco-3d`} data-m="painel">
                            <div data-m="planta" className={styles.plantaCaixa}><Planta /></div>
                            <figure
                                data-m="aparelho"
                                id="placa-tela"
                                role="tabpanel"
                                aria-labelledby={`campo-${campo.id}`}
                                className={styles.aparelho}
                            >
                                {anterior !== null && (
                                    <img
                                        key={`a-${CAMPOS[anterior].id}`}
                                        src={enderecoDaTela(codigo, CAMPOS[anterior].tela)}
                                        alt=""
                                        aria-hidden="true"
                                        className={styles.telaBaixo}
                                        width="720"
                                        height="1600"
                                    />
                                )}
                                <img
                                    key={campo.id}
                                    src={enderecoDaTela(codigo, campo.tela)}
                                    alt={t(`hero.telas.${campo.id}`)}
                                    className={anterior === null ? styles.tela : `${styles.tela} ${styles.telaNova}`}
                                    width="720"
                                    height="1600"
                                    fetchPriority={anterior === null ? 'high' : undefined}
                                    onAnimationEnd={() => setAnterior(null)}
                                />
                            </figure>
                            <p className={styles.legenda}>{t('hero.legendaTela')}</p>
                        </div>
                    </div>
                </div>

                <ul className={styles.lojas}>
                    <li data-m="loja">
                        <a href={googlePlay(codigo)} target="_blank" rel="noopener noreferrer">
                            <small>{t('hero.disponivelNo')}</small> Google Play
                        </a>
                    </li>
                    <li data-m="loja">
                        <a href={appStore()} target="_blank" rel="noopener noreferrer">
                            <small>{t('hero.baixarNa')}</small> App Store
                        </a>
                    </li>
                    <li data-m="loja">
                        <a href={WINDOWS}>
                            <small>{t('hero.baixarPara')}</small> Windows
                        </a>
                    </li>
                </ul>
            </div>
        </section>
    );
}
