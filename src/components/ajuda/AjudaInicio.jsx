import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Route } from 'lucide-react';
import AjudaBusca from './AjudaBusca.jsx';
import IconeModulo from './IconeModulo.jsx';
import { BandaSuporte } from './Estados.jsx';
import useTituloDaPagina from './useTituloDaPagina.js';
import styles from './Ajuda.module.css';

const PERFIS = ['todos', 'gestor', 'equipe', 'cliente'];

export default function AjudaInicio({ indice, preparado, rotas }) {
    const { t } = useTranslation();
    const [perfil, setPerfil] = useState('todos');
    useTituloDaPagina(`${t('ajuda.titulo')} · ObraFácil`, t('ajuda.metaDescricao'));

    const modulos = useMemo(() => new Map(indice.modulos.map((m) => [m.id, m])), [indice]);
    const doPerfil = (a) => perfil === 'todos' || a.publico.includes(perfil);

    // Total de artigos de cada módulo para o perfil escolhido; módulo sem artigo some.
    const assuntos = indice.modulos
        .map((m) => ({ ...m, quantos: indice.artigos.filter((a) => a.modulo === m.id && doPerfil(a)).length }))
        .filter((m) => m.quantos > 0);
    const guias = indice.artigos.filter((a) => a.tipo === 'fluxo' && a.prioritario).slice(0, 3);
    const essenciais = indice.artigos.filter((a) => a.tipo !== 'fluxo' && a.prioritario).slice(0, 6);
    const sugestoes = [1, 2, 3, 4].map((n) => t(`ajuda.sugestao${n}`)).filter(Boolean);
    const endereco = (a) => rotas.artigo(a.slug);

    return (
        <>
            <section className={styles.heroi}>
                <div className={styles.brilho} aria-hidden="true" />
                <div className={styles.heroiConteudo}>
                    <span className={styles.sobretitulo}>{t('ajuda.titulo')}</span>
                    <h1 className={styles.heroiTitulo}>
                        {t('ajuda.heroiAntes')} <span className={styles.destaque}>{t('ajuda.heroiDestaque')}</span>{t('ajuda.heroiDepois')}
                    </h1>
                    <p className={styles.heroiSubtitulo}>{t('ajuda.heroiSubtitulo')}</p>
                    <AjudaBusca rotas={rotas} indice={indice} preparado={preparado} sugestoes={sugestoes} />
                </div>
            </section>

            <div className={styles.container}>
                {guias.length > 0 && (
                    <section className={styles.secao} aria-labelledby="ajuda-guias">
                        <h2 id="ajuda-guias" className={styles.secaoTitulo}>{t('ajuda.comeceTitulo')}</h2>
                        <p className={styles.secaoSubtitulo}>{t('ajuda.comeceSubtitulo')}</p>
                        <div className={styles.gradeGuias}>
                            {guias.map((a) => (
                                <Link key={a.id} to={endereco(a)} className={styles.guia}>
                                    <span className={styles.guiaRotulo}><Route size={16} aria-hidden="true" />{t('ajuda.tipo_fluxo')}</span>
                                    <span className={styles.guiaTitulo}>{a.titulo}</span>
                                    <span className={styles.guiaResumo}>{a.resumo}</span>
                                    <span className={styles.guiaAcao}>{t('ajuda.comecar')} →</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <section className={styles.secao} aria-labelledby="ajuda-assuntos">
                    <div className={styles.secaoCabecalho}>
                        <div>
                            <h2 id="ajuda-assuntos" className={styles.secaoTitulo}>{t('ajuda.assuntosTitulo')}</h2>
                            <p className={styles.secaoSubtitulo}>{t(`ajuda.assuntosPerfil_${perfil}`)}</p>
                        </div>
                        <div role="group" aria-label={t('ajuda.perfilGrupo')} className={styles.segmentos}>
                            {PERFIS.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`${styles.segmento} ${perfil === p ? styles.segmentoAtivo : ''}`}
                                    aria-pressed={perfil === p}
                                    onClick={() => setPerfil(p)}
                                >
                                    {t(`ajuda.perfil_${p}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {assuntos.length === 0 && <p className={styles.semAssuntos}>{t('ajuda.assuntosVazio')}</p>}
                    <div className={styles.gradeAssuntos}>
                        {assuntos.map((m) => (
                            <Link key={m.id} to={rotas.assunto(m)} className={styles.assunto}>
                                <span className={styles.iconeCaixa}><IconeModulo nome={m.icone} /></span>
                                <span className={styles.assuntoTexto}>
                                    <span className={styles.assuntoNome}>{m.nome}</span>
                                    {m.descricao && <span className={styles.assuntoDescricao}>{m.descricao}</span>}
                                    <span className={styles.assuntoTotal}>{t('ajuda.artigos', { count: m.quantos })}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                {essenciais.length > 0 && (
                    <section className={styles.secao} aria-labelledby="ajuda-essenciais">
                        <h2 id="ajuda-essenciais" className={styles.secaoTitulo}>{t('ajuda.essenciaisTitulo')}</h2>
                        <p className={styles.secaoSubtitulo}>{t('ajuda.essenciaisSubtitulo')}</p>
                        <div className={styles.gradeLinhas}>
                            {essenciais.map((a) => (
                                <Link key={a.id} to={endereco(a)} className={styles.linha}>
                                    <span className={styles.iconeCaixaPequena}><IconeModulo nome={modulos.get(a.modulo)?.icone} size={18} /></span>
                                    <span className={styles.linhaTexto}>{a.titulo}</span>
                                    <ChevronRight size={18} aria-hidden="true" className={styles.linhaSeta} />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <BandaSuporte />
            </div>
        </>
    );
}
