// Primeira dobra: a placa da obra. Os campos são abas: escolher um campo troca a tela do app
// no painel (a tela real daquela parte, no idioma da página).
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { caminhoInicio } from '../i18n/idiomas.js';
import { useIdioma } from '../i18n/RotaDoIdioma.jsx';
import { CADASTRO, WINDOWS, appStore, googlePlay } from '../links.js';
import { enderecoDaTela } from '../telas.js';
import styles from './Placa.module.css';

const CAMPOS = [
    { id: 'cronograma', tela: 'etapas' },
    { id: 'diario', tela: 'rdo' },
    { id: 'financeiro', tela: 'financeiro' },
    { id: 'cliente', tela: 'portal' },
];

export default function Placa() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    const [ativo, setAtivo] = useState(0);
    const [anterior, setAnterior] = useState(null);
    const abas = useRef([]);

    // Depois da primeira tela, baixa as outras três em segundo plano (troca sem espera).
    useEffect(() => {
        const id = window.setTimeout(() => {
            CAMPOS.slice(1).forEach((c) => { const img = new Image(); img.src = enderecoDaTela(codigo, c.tela); });
        }, 1200);
        return () => window.clearTimeout(id);
    }, [codigo]);

    const escolher = (indice) => {
        if (indice === ativo) return;
        setAnterior(ativo);
        setAtivo(indice);
    };

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
        <section className={styles.secao} aria-labelledby="placa-titulo">
            <div className="container">
                <div className={styles.placa}>
                    <div className={styles.faixa}>
                        <span>{t('hero.faixa')}</span>
                        <span className={styles.plataformas}>{t('hero.plataformas')}</span>
                    </div>

                    <div className={styles.corpo}>
                        <div className={styles.texto}>
                            <h1 id="placa-titulo" className={styles.titulo}>{t('hero.titulo')}</h1>
                            <p className={styles.subtitulo}>{t('hero.subtitulo')}</p>

                            <div className={styles.campos} role="tablist" aria-label={t('hero.camposRotulo')} aria-orientation="vertical">
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
                                <a href={CADASTRO} className="acao">{t('hero.comecar')}</a>
                                <Link to={caminhoInicio(codigo, 'precos')} className="acao-clara">{t('hero.verPlanos')}</Link>
                            </div>
                            <p className={styles.nota}>{t('hero.semCartao')}</p>
                        </div>

                        <div className={styles.painel}>
                            <figure
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
                                    fetchpriority={anterior === null ? 'high' : undefined}
                                    onAnimationEnd={() => setAnterior(null)}
                                />
                            </figure>
                            <p className={styles.legenda}>{t('hero.legendaTela')}</p>
                        </div>
                    </div>
                </div>

                <ul className={styles.lojas}>
                    <li>
                        <a href={googlePlay(codigo)} target="_blank" rel="noopener noreferrer">
                            <small>{t('hero.disponivelNo')}</small> Google Play
                        </a>
                    </li>
                    <li>
                        <a href={appStore()} target="_blank" rel="noopener noreferrer">
                            <small>{t('hero.baixarNa')}</small> App Store
                        </a>
                    </li>
                    <li>
                        <a href={WINDOWS}>
                            <small>{t('hero.baixarPara')}</small> Windows
                        </a>
                    </li>
                </ul>
            </div>
        </section>
    );
}
