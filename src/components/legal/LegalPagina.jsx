// Termos de Uso e Política de Privacidade no idioma do endereço.
// O texto aparece na hora quando a página foi gerada no build ou já foi lido nesta máquina, e é
// conferido no Firestore uma vez por visita (src/legal/dados.js). Quando há versão nova com
// aviso (liberada para uma data futura), a página avisa e deixa ler a nova.
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { conferirTexto, textoDaProxima, textoGuardado } from '../../legal/dados.js';
import { lerTexto, sumario, tituloDoTexto } from '../../legal/markdown.js';
import { caminhoLegal } from '../../i18n/idiomas.js';
import { useRotaEquivalente } from '../../i18n/RotaDoIdioma.jsx';
import styles from './Legal.module.css';

function useTexto(documento, codigo) {
    const [tentativa, setTentativa] = useState(0);
    const chave = `${documento}:${codigo}:${tentativa}`;
    const guardado = useMemo(() => textoGuardado(documento, codigo), [documento, codigo]);
    const [estado, setEstado] = useState({ chave: null, tipo: 'carregando', dados: null });

    useEffect(() => {
        let vivo = true;
        conferirTexto(documento, codigo)
            .then((dados) => { if (vivo) setEstado({ chave, tipo: dados ? 'pronto' : 'vazio', dados }); })
            .catch(() => { if (vivo) setEstado({ chave, tipo: 'erro', dados: null }); });
        return () => { vivo = false; };
    }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps

    let atual;
    if (estado.chave === chave && !(estado.tipo === 'erro' && guardado)) atual = estado;
    else if (guardado) atual = { tipo: 'pronto', dados: guardado };
    else atual = { tipo: 'carregando', dados: null };
    return { ...atual, tentarDeNovo: () => setTentativa((n) => n + 1) };
}

function dataPorExtenso(ms, codigo) {
    return new Intl.DateTimeFormat(codigo, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(ms);
}

function Trechos({ lista }) {
    return lista.map((t, i) => (t.negrito ? <strong key={i}>{t.texto}</strong> : <span key={i}>{t.texto}</span>));
}

function Bloco({ bloco }) {
    if (bloco.tipo === 'secao') return <h2 id={bloco.id} className={styles.secao}>{bloco.texto}</h2>;
    if (bloco.tipo === 'subsecao') return <h3 id={bloco.id} className={styles.subsecao}>{bloco.texto}</h3>;
    if (bloco.tipo === 'lista') {
        return <ul className={styles.lista}>{bloco.itens.map((item, i) => <li key={i}><Trechos lista={item} /></li>)}</ul>;
    }
    return <p className={styles.paragrafo}><Trechos lista={bloco.trechos} /></p>;
}

export default function LegalPagina({ codigo, documento }) {
    const { t } = useTranslation();
    const estado = useTexto(documento, codigo);
    const [agora] = useState(() => Date.now());
    const [proxima, setProxima] = useState({ chave: null, tipo: 'fechada', dados: null });
    const chaveProxima = `${documento}:${codigo}:${estado.dados?.proxima?.versao ?? ''}`;
    const vendoProxima = proxima.chave === chaveProxima && proxima.tipo === 'pronta';

    useRotaEquivalente((outro) => caminhoLegal(outro, documento), [documento]);

    const mostrado = vendoProxima ? proxima.dados : estado.dados?.atual;
    const blocos = useMemo(() => (mostrado ? lerTexto(mostrado.texto) : []), [mostrado]);
    const titulo = tituloDoTexto(blocos) || t(documento === 'termos' ? 'footer.terms' : 'footer.privacy');
    const secoes = useMemo(() => sumario(blocos), [blocos]);

    useEffect(() => {
        document.title = `${titulo} · ObraFácil`;
    }, [titulo]);

    const abrirProxima = () => {
        const p = estado.dados?.proxima;
        if (!p) return;
        setProxima({ chave: chaveProxima, tipo: 'carregando', dados: null });
        textoDaProxima(documento, codigo, p)
            .then((dados) => setProxima({ chave: chaveProxima, tipo: dados ? 'pronta' : 'erro', dados }))
            .catch(() => setProxima({ chave: chaveProxima, tipo: 'erro', dados: null }));
    };

    const outroDocumento = documento === 'termos' ? 'privacidade' : 'termos';

    if (estado.tipo === 'carregando') {
        return (
            <main className={styles.pagina}>
                <div className={styles.estado} role="status">{t('legal.carregando')}</div>
            </main>
        );
    }
    if (estado.tipo !== 'pronto') {
        return (
            <main className={styles.pagina}>
                <div className={styles.estado} role="alert">
                    <p>{t(estado.tipo === 'vazio' ? 'legal.indisponivel' : 'legal.erro')}</p>
                    {estado.tipo === 'erro' && <button type="button" className={styles.botao} onClick={estado.tentarDeNovo}>{t('legal.tentarDeNovo')}</button>}
                </div>
            </main>
        );
    }

    const { atual, proxima: infoProxima } = estado.dados;
    const vigencia = mostrado?.vigenteDesde;

    return (
        <main className={styles.pagina}>
            <header className={styles.cabecalho}>
                <h1 className={styles.titulo}>{titulo}</h1>
                <p className={styles.versao}>
                    {t('legal.versao', { versao: mostrado.versao })}
                    {vigencia ? ` · ${t(vigencia > agora ? 'legal.valeAPartir' : 'legal.emVigorDesde', { data: dataPorExtenso(vigencia, codigo) })}` : ''}
                </p>
                {infoProxima && !vendoProxima && (
                    <div className={styles.aviso} role="note">
                        <p>{t('legal.novaVersao', { versao: infoProxima.versao, data: dataPorExtenso(infoProxima.vigenteDesde, codigo) })}</p>
                        <button type="button" className={styles.botao} onClick={abrirProxima} disabled={proxima.chave === chaveProxima && proxima.tipo === 'carregando'}>
                            {t('legal.lerNova')}
                        </button>
                        {proxima.chave === chaveProxima && proxima.tipo === 'erro' && <p>{t('legal.erro')}</p>}
                    </div>
                )}
                {vendoProxima && (
                    <div className={styles.aviso} role="note">
                        <p>{t('legal.vendoNova', { versao: atual.versao })}</p>
                        <button type="button" className={styles.botao} onClick={() => setProxima({ chave: null, tipo: 'fechada', dados: null })}>
                            {t('legal.voltarAtual')}
                        </button>
                    </div>
                )}
            </header>

            <div className={styles.corpo}>
                {secoes.length > 2 && (
                    <nav className={styles.sumario} aria-label={t('legal.sumario')}>
                        <p className={styles.sumarioTitulo}>{t('legal.sumario')}</p>
                        <ol>
                            {secoes.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.texto}</a></li>)}
                        </ol>
                    </nav>
                )}
                <article className={styles.texto}>
                    {blocos.filter((b) => b.tipo !== 'titulo').map((b, i) => <Bloco key={i} bloco={b} />)}
                    <p className={styles.outro}>
                        <Link to={caminhoLegal(codigo, outroDocumento)}>{t(outroDocumento === 'termos' ? 'footer.terms' : 'footer.privacy')}</Link>
                    </p>
                </article>
            </div>
        </main>
    );
}
