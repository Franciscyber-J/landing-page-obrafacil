// Página de um modelo grátis (modo de leitura): um dos 27 checklists de qualidade do app ou o diário de obra (RDO).
// Mostra o modelo inteiro (os itens ou os campos, com o texto do app), como usar no papel, o PDF para baixar e o que
// o mesmo modelo faz no app. O primeiro desenho só depende do idioma e dos dados do idioma (igual no build e no
// navegador): nada de aparelho, tema ou data de hoje (src/useNavegador.js).
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, TriangleAlert } from 'lucide-react';
import { caminhoModelo, caminhoModelos, idioma } from '../../i18n/idiomas.js';
import { useRotaEquivalente } from '../../i18n/RotaDoIdioma.jsx';
import { dadosIniciais } from '../../dadosIniciais.js';
import { useDadosDosModelos, useEnderecosDosModelos } from '../../modelos/carregar.js';
import {
    CAMPOS_DO_DIARIO, DIARIO, caminhoDoModelo, contagem, itensPorSecao, modeloPeloSlug, modelosDoIdioma, nomeDoGrupo,
    partesDoTexto, rotuloDoApp, textoDoApp,
} from '../../modelos/modelos.js';
import { comDestaque } from '../../texto.jsx';
import { tituloDaPagina, descricaoDaPagina } from '../../seo/textos.js';
import useCabecaDaPagina from '../conta/useCabecaDaPagina.js';
import { AvisoTecnico, BaixarPdf, Carregando, Erro, NoApp, NotaDoPdf, ParaALista, Trilha } from './partes.jsx';
import styles from './Modelos.module.css';

// Endereço do mesmo modelo nos outros idiomas: o diário pela palavra do cadastro; o checklist pelos endereços que o
// build manda na página pronta (dadosIniciais().modelos.slugs) ou pelo mapa de endereços (navegando dentro do site).
// Sem nenhum dos dois (o mapa ainda não chegou), a lista de modelos do outro idioma.
function useEnderecoNosOutrosIdiomas(codigo, modelo) {
    const enderecos = useEnderecosDosModelos();
    useRotaEquivalente((outro) => {
        if (!modelo) return caminhoModelos(outro);
        if (modelo.id === DIARIO) return caminhoModelo(outro, idioma(outro).rotas.diario);
        const slugs = dadosIniciais()?.modelos?.slugs;
        const slug = (slugs?.id === modelo.id ? slugs.porIdioma?.[outro] : null) ?? enderecos?.[modelo.id]?.[outro];
        return slug ? caminhoModelo(outro, slug) : caminhoModelos(outro);
    }, [codigo, modelo?.id, enderecos]);
}

// Texto do app com os campos em branco desenhados como linha para preencher ("Data: ____ | cliente: ____").
function CampoEmBranco({ dados, chave, valores }) {
    return (
        <span className={styles.campoForm}>
            {partesDoTexto(dados, chave, valores).map((p, i) => (p.branco
                ? <span key={i} className={styles.branco} aria-hidden="true" />
                : <Fragment key={i}>{p.texto}</Fragment>))}
        </span>
    );
}

function Respostas({ dados }) {
    return (
        <span className={styles.respostas} aria-hidden="true">
            {['checklistRespostaConforme', 'checklistRespostaNaoConforme', 'checklistRespostaNaoSeAplica'].map((c) => (
                <span key={c} className={styles.resposta} title={textoDoApp(dados, c)}><span className={styles.caixa} /></span>
            ))}
        </span>
    );
}

function ItensDoChecklist({ dados, modelo }) {
    const { t } = useTranslation();
    return (
        <section className={styles.bloco} aria-labelledby="modelo-itens">
            <div className={styles.blocoTopo}>
                <h2 id="modelo-itens" className={styles.blocoTitulo}>{t('modelos.checklist.itensTitulo')}</h2>
                <p className={styles.legendaRespostas}>
                    {['checklistRespostaConforme', 'checklistRespostaNaoConforme', 'checklistRespostaNaoSeAplica'].map((c) => (
                        <span key={c}><span className={styles.caixa} aria-hidden="true" />{textoDoApp(dados, c)}</span>
                    ))}
                </p>
            </div>
            <p className={styles.criterio}>
                <strong>{t('modelos.checklist.criterio')}:</strong> {dados.biblioteca.criterio}
            </p>
            {itensPorSecao(modelo).map((secao) => (
                <div key={secao.codigo} className={styles.secao}>
                    <h3 className={styles.secaoTitulo}>{textoDoApp(dados, secao.chave)}</h3>
                    <ol className={styles.itens}>
                        {secao.itens.map((item) => (
                            <li key={item.codigo} className={styles.item} value={item.numero}>
                                <span className={styles.itemNumero} aria-hidden="true">{item.numero}</span>
                                <div className={styles.itemCorpo}>
                                    <p className={styles.itemTexto}>{item.texto}</p>
                                    {(item.critico || item.foto) && (
                                        <p className={styles.etiquetas}>
                                            {item.critico && (
                                                <span className={styles.etiquetaCritico}>
                                                    <TriangleAlert size={14} strokeWidth={2.5} aria-hidden="true" />
                                                    {textoDoApp(dados, 'checklistItemCritico')}
                                                </span>
                                            )}
                                            {item.foto && (
                                                <span className={styles.etiqueta}>
                                                    <Camera size={14} strokeWidth={2.5} aria-hidden="true" />
                                                    {textoDoApp(dados, 'checklistFotoObrigatoria')}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>
                                <Respostas dados={dados} />
                            </li>
                        ))}
                    </ol>
                </div>
            ))}
            <AvisoTecnico id="modelo-aviso" classe={styles.avisoNosItens} />
        </section>
    );
}

function CamposDoDiario({ dados }) {
    const { t } = useTranslation();
    return (
        <section className={styles.bloco} aria-labelledby="modelo-campos">
            <div className={styles.blocoTopo}>
                <h2 id="modelo-campos" className={styles.blocoTitulo}>{t('modelos.diario.camposTitulo')}</h2>
            </div>
            <ol className={styles.campos}>
                {CAMPOS_DO_DIARIO.map((campo, n) => (
                    <li key={campo.id} className={styles.campo}>
                        <span className={styles.itemNumero} aria-hidden="true">{n + 1}</span>
                        <div className={styles.itemCorpo}>
                            <h3 className={styles.campoTitulo}>
                                {campo.id === 'data' || campo.id === 'avanco'
                                    ? <CampoEmBranco dados={dados} chave={campo.rotulo} />
                                    : rotuloDoApp(dados, campo.rotulo)}
                            </h3>
                            <p className={styles.itemTexto}>{t(`modelos.diario.campos.${campo.id}`)}</p>
                            {campo.opcoes && (
                                <p className={styles.opcoes}>
                                    {campo.opcoes.map((o) => (
                                        <span key={o} className={styles.opcao}><span className={styles.caixa} aria-hidden="true" />{textoDoApp(dados, o)}</span>
                                    ))}
                                </p>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
            <AvisoTecnico id="modelo-aviso" classe={styles.avisoNosItens} />
        </section>
    );
}

function ComoUsar({ tipo }) {
    const { t } = useTranslation();
    const passos = t(`modelos.usar.${tipo}`, { returnObjects: true });
    return (
        <section className={styles.bloco} aria-labelledby="modelo-usar">
            <h2 id="modelo-usar" className={styles.blocoTitulo}>{t('modelos.usar.titulo')}</h2>
            <ol className={styles.passos}>
                {(Array.isArray(passos) ? passos : []).map((texto, i) => (
                    <li key={i}>
                        <span className={styles.passoNumero} aria-hidden="true">{i + 1}</span>
                        <p>{texto}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}

function MaisModelos({ codigo, dados, modelo }) {
    const { t } = useTranslation();
    const todos = modelosDoIdioma(dados, codigo);
    const doGrupo = modelo.tipo === 'checklist'
        ? todos.filter((m) => m.tipo === 'checklist' && m.grupo === modelo.grupo && m.id !== modelo.id)
        : todos.filter((m) => m.tipo === 'checklist').slice(0, 6);
    const titulo = modelo.tipo === 'checklist'
        ? t('modelos.outros', { grupo: nomeDoGrupo(dados, modelo.grupo) })
        : t('recursos.itens.checklists.titulo');
    return (
        <nav className={styles.mais} aria-labelledby="modelo-mais">
            <h2 id="modelo-mais" className={styles.maisTitulo}>{titulo}</h2>
            <ul className={styles.maisLista}>
                {doGrupo.map((m) => (
                    <li key={m.id}>
                        <Link to={caminhoDoModelo(codigo, m)}>
                            <span>{m.nome}</span>
                            <ArrowRight size={18} aria-hidden="true" className="seta" />
                        </Link>
                    </li>
                ))}
            </ul>
            <Link to={caminhoModelos(codigo)} className={`acao-contorno ${styles.botao}`}>{t('modelos.todos')}</Link>
        </nav>
    );
}

function Conteudo({ codigo, dados, modelo }) {
    const { t } = useTranslation();
    const diario = modelo.tipo === 'diario';
    const nome = diario ? t('modelos.diario.nome') : modelo.nome;
    const titulo = diario ? t('modelos.diario.titulo') : t('modelos.checklist.titulo', { nome: modelo.nome });
    const pagina = { tipo: 'modelo', codigo };
    useCabecaDaPagina({
        titulo: tituloDaPagina(t, pagina, { modelo, nome }),
        descricao: descricaoDaPagina(t, pagina, { modelo, nome }),
    });
    const conta = diario ? null : contagem(modelo);

    return (
        <main className={styles.pagina}>
            <div className={styles.brilho} aria-hidden="true" />
            <div className={styles.conteudo}>
                <Trilha codigo={codigo} itens={[{ texto: t('modelos.nav'), para: caminhoModelos(codigo) }, { texto: nome }]} />
                <header className={styles.cabeca} data-painel>
                    <h1 className={styles.titulo}>{comDestaque(titulo)}</h1>
                    {conta && (
                        <p className={styles.resumo}>
                            {nomeDoGrupo(dados, modelo.grupo) !== modelo.nome && <span>{nomeDoGrupo(dados, modelo.grupo)}</span>}
                            <span>{t('modelos.itens', { count: conta.itens })}</span>
                            {conta.criticos > 0 && <span>{t('modelos.criticos', { count: conta.criticos })}</span>}
                            {conta.fotos > 0 && <span>{t('modelos.fotos', { count: conta.fotos })}</span>}
                        </p>
                    )}
                    <p className={styles.texto}>{t(diario ? 'modelos.diario.paraQue' : 'modelos.checklist.paraQue')}</p>
                    <div className={styles.acoes}>
                        <BaixarPdf codigo={codigo} modelo={modelo} nome={nome} classe="acao-clara" />
                        <NotaDoPdf codigo={codigo} classe={styles.notaNoPainel} />
                    </div>
                </header>

                <div className={styles.leitura}>
                    {diario ? <CamposDoDiario dados={dados} /> : <ItensDoChecklist dados={dados} modelo={modelo} />}
                    <ComoUsar tipo={diario ? 'diario' : 'checklist'} />
                    <div className={styles.baixarFim}>
                        <BaixarPdf codigo={codigo} modelo={modelo} nome={nome} />
                        <NotaDoPdf codigo={codigo} />
                    </div>
                </div>

                <NoApp codigo={codigo} tipo={diario ? 'diario' : 'checklist'} id="modelo-no-app" />
                <MaisModelos codigo={codigo} dados={dados} modelo={modelo} />
            </div>
        </main>
    );
}

export default function ModeloPagina({ codigo, slug }) {
    const { dados, erro, tentarDeNovo } = useDadosDosModelos(codigo);
    const modelo = dados ? modeloPeloSlug(dados, codigo, slug) : null;
    useEnderecoNosOutrosIdiomas(codigo, modelo);
    if (erro) return <main className={styles.pagina}><div className={styles.conteudo}><Erro aoTentarDeNovo={tentarDeNovo} /></div></main>;
    if (!dados) return <main className={styles.pagina}><div className={styles.conteudo}><Carregando /></div></main>;
    if (!modelo) return <ParaALista para={caminhoModelos(codigo)} />;
    return <Conteudo codigo={codigo} dados={dados} modelo={modelo} />;
}
