// Programa Influenciadores ObraFácil (piloto P0, só no pt-BR): a página do programa (regras resumidas, tabela de
// pontos e o botão "Quero participar", que abre o direct da @oficial.obrafacil) e a página do regulamento (texto
// inteiro, cópia conferida do gestao_obras). Página estática: nada aqui lê dados nem chama o servidor; o link do
// Instagram é um link comum (nenhum script de fora).
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarClock, Gift, Handshake, ListChecks, MessageCircle, ScrollText, Trophy, Video } from 'lucide-react';
import { caminhoPrograma, caminhoRegulamentoDoPrograma } from '../../i18n/idiomas.js';
import { useRotaEquivalente } from '../../i18n/RotaDoIdioma.jsx';
import { formatarNumero } from '../../i18n/formatos.js';
import { lerTexto, sumario, tituloDoTexto } from '../../legal/markdown.js';
import { comNegrito } from '../../texto.jsx';
import {
    ACEITE, CICLOS, CONTA, DIAS_DO_CICLO, DIAS_NO_AR, DIRECT, MINIMO_PUBLICACOES, MINIMO_SEGUIDORES, NIVEIS, PALAVRA,
    PERFIL, PONTOS, PONTOS_POR_MES, VAGAS, VALIDADE_MESES, VERSAO,
} from '../../programas/influenciadores.js';
import regulamento from '../../programas/regulamento-influenciadores-1.0.pt-BR.md?raw';
import { Cabeca, Cartao, Lista, Pagina, Paragrafo, Passos } from '../conta/partes.jsx';
import useCabecaDaPagina from '../conta/useCabecaDaPagina.js';
import { descricaoDaPagina, tituloDaPagina } from '../../seo/textos.js';
import conta from '../conta/Conta.module.css';
import legal from '../legal/Legal.module.css';
import styles from './Programas.module.css';

const PROGRAMA = 'influenciadores';
const PASSOS = ['chamar', 'aceitar', 'esperar', 'publicar'];

// Valores que entram nos textos (números no formato do idioma).
function useValores(codigo) {
    return useMemo(() => {
        const n = (v) => formatarNumero(codigo, v);
        return {
            conta: `@${CONTA}`, palavra: PALAVRA, aceite: ACEITE, vagas: n(VAGAS), ciclos: n(CICLOS), dias: n(DIAS_DO_CICLO),
            diasNoAr: n(DIAS_NO_AR), seguidores: n(MINIMO_SEGUIDORES), publicacoes: n(MINIMO_PUBLICACOES),
            pontosPorMes: n(PONTOS_POR_MES), validade: n(VALIDADE_MESES), versao: VERSAO,
        };
    }, [codigo]);
}

// Botão do direct. No celular, o ig.me abre a conversa no app do Instagram; no computador, o Instagram não abre o
// ig.me, então ao lado vai o perfil (lá, "Enviar mensagem").
function BotoesDoDirect({ t, classe = '' }) {
    return (
        <div className={`${styles.botoes} ${classe}`}>
            <a href={DIRECT} target="_blank" rel="noopener noreferrer" className={`acao ${conta.botao}`} data-conversao="influenciadores_direct">
                {t('influenciadores.quero')}
            </a>
            <a href={PERFIL} target="_blank" rel="noopener noreferrer" className={`acao-contorno ${conta.botao}`}>
                {t('influenciadores.perfil')}
            </a>
        </div>
    );
}

// A palavra que a pessoa manda, com o botão de copiar (o resultado só aparece depois do toque: o primeiro desenho é
// igual no build e no navegador).
function Palavra({ t }) {
    const [copiado, setCopiado] = useState(false);
    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(PALAVRA);
            setCopiado(true);
        } catch {
            setCopiado(false);
        }
    };
    return (
        <div className={styles.palavra}>
            <p className={styles.palavraTexto}>{comNegrito(t('influenciadores.palavraTexto', { palavra: PALAVRA, conta: `@${CONTA}` }))}</p>
            <div className={styles.palavraLinha}>
                <code className={styles.palavraCodigo}>{PALAVRA}</code>
                <button type="button" className={`acao-contorno ${styles.copiar}`} onClick={copiar} aria-live="polite">
                    {copiado ? t('influenciadores.copiado') : t('influenciadores.copiar')}
                </button>
            </div>
            <p className={styles.palavraNota}>{t('influenciadores.computador')}</p>
        </div>
    );
}

function TabelaDePontos({ t, codigo }) {
    const n = (v) => formatarNumero(codigo, v);
    return (
        <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
                <caption className={styles.legenda}>{t('influenciadores.tabelaLegenda')}</caption>
                <thead>
                    <tr>
                        <th scope="col">{t('influenciadores.colunaPublicacao')}</th>
                        <th scope="col">{t('influenciadores.colunaPontos')}</th>
                        <th scope="col">{t('influenciadores.colunaLimite')}</th>
                    </tr>
                </thead>
                <tbody>
                    {PONTOS.map((linha) => (
                        <tr key={linha.id}>
                            <th scope="row">
                                <span className={styles.tipo}>{t(`influenciadores.tipos.${linha.id}.nome`)}</span>
                                <span className={styles.tipoNota}>{t(`influenciadores.tipos.${linha.id}.nota`)}</span>
                            </th>
                            <td className={styles.numero}>{n(linha.pontos)}</td>
                            <td>
                                {Array.isArray(linha.limite)
                                    ? t('influenciadores.limitePorNivel', { a: n(linha.limite[0]), b: n(linha.limite[1]), c: n(linha.limite[2]) })
                                    : t('influenciadores.limite', { count: linha.limite })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Niveis({ t, codigo }) {
    const n = (v) => formatarNumero(codigo, v);
    return (
        <ul className={styles.niveis}>
            {NIVEIS.map((nivel) => (
                <li key={nivel.id} className={styles.nivel}>
                    <p className={styles.nivelNome}>{t(`influenciadores.niveis.${nivel.id}`)}</p>
                    <p className={styles.nivelFaixa}>
                        {nivel.ate ? t('influenciadores.faixa', { de: n(nivel.de), ate: n(nivel.ate) }) : t('influenciadores.faixaAberta', { de: n(nivel.de) })}
                    </p>
                    <p className={styles.nivelTeto}>{comNegrito(t('influenciadores.teto', { teto: n(nivel.teto) }))}</p>
                </li>
            ))}
        </ul>
    );
}

function ProgramaPagina({ codigo }) {
    const { t } = useTranslation();
    const v = useValores(codigo);
    const regulamentoCaminho = caminhoRegulamentoDoPrograma(codigo, PROGRAMA);
    const lista = (chave) => t(chave, { ...v, returnObjects: true });

    return (
        <Pagina>
            <Cabeca icone={Handshake} sobretitulo={t('influenciadores.sobretitulo', v)} titulo={t('influenciadores.titulo')} texto={t('influenciadores.texto', v)}>
                <BotoesDoDirect t={t} classe={styles.botoesNaCabeca} />
                <Link to={regulamentoCaminho} className={styles.linkClaro}>{t('influenciadores.lerRegulamento', v)}</Link>
            </Cabeca>

            <div className={`${conta.grade} ${conta.gradePareada} ${styles.grade}`}>
                <Cartao id="influ-como" titulo={t('influenciadores.comoTitulo')} icone={ListChecks} classe={conta.larguraToda}>
                    <Passos itens={PASSOS.map((id) => ({ titulo: t(`influenciadores.passos.${id}.titulo`), texto: t(`influenciadores.passos.${id}.texto`, v) }))} />
                    <Palavra t={t} />
                </Cartao>

                <Cartao id="influ-quem" titulo={t('influenciadores.quemTitulo')} icone={BadgeCheck}>
                    <Lista itens={lista('influenciadores.requisitos')} />
                </Cartao>

                <Cartao id="influ-conta" titulo={t('influenciadores.contaTitulo')} icone={Video}>
                    <Lista itens={lista('influenciadores.regrasDaPublicacao')} />
                </Cartao>

                <Cartao id="influ-pontos" titulo={t('influenciadores.pontosTitulo')} icone={Trophy} classe={conta.larguraToda}>
                    <Paragrafo>{t('influenciadores.pontosTexto', v)}</Paragrafo>
                    <TabelaDePontos t={t} codigo={codigo} />
                    <h3 className={styles.subtitulo}>{t('influenciadores.niveisTitulo')}</h3>
                    <Niveis t={t} codigo={codigo} />
                    <p className={styles.nota}>{t('influenciadores.niveisNota')}</p>
                </Cartao>

                <Cartao id="influ-mes" titulo={t('influenciadores.mesTitulo')} icone={Gift}>
                    <Lista itens={lista('influenciadores.entrega')} />
                </Cartao>

                <Cartao id="influ-saber" titulo={t('influenciadores.saberTitulo')} icone={CalendarClock}>
                    <Lista itens={lista('influenciadores.bomSaber')} />
                </Cartao>

                <Cartao id="influ-fim" titulo={t('influenciadores.fimTitulo')} icone={MessageCircle} destaque classe={conta.larguraToda}>
                    <Paragrafo>{t('influenciadores.fimTexto', v)}</Paragrafo>
                    <BotoesDoDirect t={t} />
                    <p className={styles.nota}>
                        <Link to={regulamentoCaminho}>{t('influenciadores.lerRegulamento', v)}</Link>
                    </p>
                </Cartao>
            </div>
        </Pagina>
    );
}

function Trechos({ lista }) {
    return lista.map((x, i) => (x.negrito ? <strong key={i}>{x.texto}</strong> : <span key={i}>{x.texto}</span>));
}

function Bloco({ bloco }) {
    if (bloco.tipo === 'secao') return <h2 id={bloco.id} className={legal.secao}>{bloco.texto}</h2>;
    if (bloco.tipo === 'subsecao') return <h3 id={bloco.id} className={legal.subsecao}>{bloco.texto}</h3>;
    if (bloco.tipo === 'lista') return <ul className={legal.lista}>{bloco.itens.map((item, i) => <li key={i}><Trechos lista={item} /></li>)}</ul>;
    return <p className={legal.paragrafo}><Trechos lista={bloco.trechos} /></p>;
}

function RegulamentoPagina({ codigo }) {
    const { t } = useTranslation();
    const v = useValores(codigo);
    const blocos = useMemo(() => lerTexto(regulamento), []);
    const secoes = useMemo(() => sumario(blocos), [blocos]);
    const titulo = tituloDoTexto(blocos);

    return (
        <main className={legal.pagina}>
            <header className={legal.cabecalho}>
                <h1 className={legal.titulo}>{titulo}</h1>
                <p className={legal.versao}>{t('influenciadores.regulamentoVersao', v)}</p>
                <div className={legal.aviso} role="note">
                    <p>{t('influenciadores.regulamentoResumo', v)}</p>
                    <Link to={caminhoPrograma(codigo, PROGRAMA)} className={legal.botao}>{t('influenciadores.voltarAoPrograma')}</Link>
                </div>
            </header>
            <div className={legal.corpo}>
                <nav className={legal.sumario} aria-label={t('legal.sumario')}>
                    <p className={legal.sumarioTitulo}>{t('legal.sumario')}</p>
                    <ol>{secoes.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.texto}</a></li>)}</ol>
                </nav>
                <article className={legal.texto}>
                    {blocos.filter((b) => b.tipo !== 'titulo').map((b, i) => <Bloco key={i} bloco={b} />)}
                    <div className={styles.fimDoRegulamento}>
                        <ScrollText size={22} strokeWidth={2.25} aria-hidden="true" />
                        <p>{comNegrito(t('influenciadores.regulamentoFim', v))}</p>
                        <BotoesDoDirect t={t} />
                    </div>
                </article>
            </div>
        </main>
    );
}

// parte: 'programa' (a página do programa) ou 'regulamento'.
export default function InfluenciadoresPagina({ codigo, parte }) {
    const { t } = useTranslation();
    const ehRegulamento = parte === 'regulamento';
    const pagina = { tipo: ehRegulamento ? 'regulamento-programa' : 'programa', codigo, programa: PROGRAMA };
    const dados = useMemo(() => (ehRegulamento ? { titulo: tituloDoTexto(lerTexto(regulamento)) } : {}), [ehRegulamento]);

    // Nos outros idiomas o programa não existe (piloto só no Brasil): trocar o idioma leva à página inicial deles.
    useRotaEquivalente((outro) => (ehRegulamento ? caminhoRegulamentoDoPrograma(outro, PROGRAMA) : caminhoPrograma(outro, PROGRAMA)), [ehRegulamento]);
    useCabecaDaPagina({ titulo: tituloDaPagina(t, pagina, dados), descricao: descricaoDaPagina(t, pagina, dados) });

    return ehRegulamento ? <RegulamentoPagina codigo={codigo} /> : <ProgramaPagina codigo={codigo} />;
}

