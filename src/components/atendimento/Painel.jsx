// Painel da conversa com o Max. Baixado só quando a pessoa abre a conversa (Atendimento.jsx, React.lazy); o SDK do
// Firebase vem depois, sob demanda (src/atendimento/servidor.js). Nunca está na página pronta do build.
//
// Acessibilidade: janela não modal (a página continua usável), com título, Esc fecha e o foco volta para quem abriu;
// as mensagens novas são lidas pelo leitor de tela (role="log"), o "Max está digitando" e os avisos também.
// Segurança: a resposta do Max é texto (src/atendimento/resposta.js); nada vira HTML; só links da lista fechada.
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MessageCircle, SendHorizontal, Sparkles, X } from 'lucide-react';
import { EMAIL_SUPORTE, linkWhatsApp } from '../../links.js';
import { caminhoLegal } from '../../i18n/idiomas.js';
import { formatarNumero } from '../../i18n/formatos.js';
import { TEXTO_MAXIMO, criarConversa, textoParaEnviar } from '../../atendimento/conversa.js';
import { fecharConversa, paisDoVisitante, useAtendimento } from '../../atendimento/estado.js';
import { lerResposta } from '../../atendimento/resposta.js';
import styles from './Painel.module.css';

// Servidor de verdade no site; o simulado só no "npm run dev" com VITE_ATENDIMENTO_SIMULADO=sim (a expressão
// inteira é trocada pelo Vite, e no build o simulado nem entra no pacote).
const SIMULADO = import.meta.env.DEV && import.meta.env.VITE_ATENDIMENTO_SIMULADO === 'sim';
function carregarServidor() {
    if (SIMULADO) return import('../../atendimento/simulado.js').then((m) => m.criarServidorSimulado());
    return import('../../atendimento/servidor.js').then((m) => m.criarServidor());
}

// Uma conversa por página aberta: fechar e abrir o painel, ou trocar de página no site, não apaga as mensagens.
// Recarregar a página começa outra (as mensagens não ficam guardadas no navegador).
let servidor = null;
const servidorPronto = () => (servidor ??= carregarServidor().catch((erro) => {
    servidor = null;
    throw erro;
}));
let conversa = null;
const ouvintes = new Set();
function pegarConversa(codigo) {
    if (!conversa) {
        conversa = criarConversa({
            idioma: codigo,
            // O país do visitante no momento do envio (o cálculo pode terminar depois de o painel abrir).
            servidor: { enviar: async (entrada) => (await servidorPronto()).enviar({ ...entrada, pais: paisDoVisitante() }) },
            aoMudar: () => ouvintes.forEach((ouvir) => ouvir()),
        });
    }
    return conversa;
}
const assinar = (ouvir) => {
    ouvintes.add(ouvir);
    return () => ouvintes.delete(ouvir);
};

const ALTURA_MAXIMA_CAMPO = 140;
const AVISO_CONTADOR = 800;

function Pedacos({ pedacos }) {
    return pedacos.map((p, i) => {
        const conteudo = p.tipo === 'link'
            ? <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">{p.texto}</a>
            : p.texto;
        if (p.tipo === 'link') return p.negrito ? <strong key={i}>{conteudo}</strong> : conteudo;
        return p.negrito ? <strong key={i}>{conteudo}</strong> : <span key={i}>{conteudo}</span>;
    });
}

function TextoDoMax({ texto }) {
    return lerResposta(texto).map((bloco, i) => {
        if (bloco.tipo === 'lista') {
            const Lista = bloco.numerada ? 'ol' : 'ul';
            return (
                <Lista key={i} className={styles.lista}>
                    {bloco.itens.map((item, j) => <li key={j}><Pedacos pedacos={item} /></li>)}
                </Lista>
            );
        }
        return (
            <p key={i}>
                {bloco.linhas.map((linha, j) => (
                    <span key={j} className={styles.linha}><Pedacos pedacos={linha} /></span>
                ))}
            </p>
        );
    });
}

function Mensagem({ autor, nome, children }) {
    return (
        <div className={styles.mensagem} data-autor={autor}>
            <span className="somente-leitor">{nome}: </span>
            {children}
        </div>
    );
}

export default function Painel({ codigo }) {
    const { t } = useTranslation();
    const { grupo, whatsapp } = useAtendimento(codigo);
    const c = pegarConversa(codigo);
    const { mensagens, esperando, erro, motivo } = useSyncExternalStore(assinar, c.estado, c.estado);
    const [texto, setTexto] = useState('');
    const campo = useRef(null);
    const lista = useRef(null);
    const preparado = useRef(false);
    const id = useId();
    const ids = { titulo: `${id}-titulo`, aviso: `${id}-aviso`, dica: `${id}-dica`, contador: `${id}-contador`, campo: `${id}-campo` };

    // Ao abrir, o foco vai para o campo.
    useEffect(() => {
        campo.current?.focus();
    }, []);

    // Mensagem nova ou "digitando": rola para o fim.
    useEffect(() => {
        const el = lista.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [mensagens.length, esperando, erro, motivo]);

    // O campo cresce com o texto, até um limite (depois rola por dentro).
    useEffect(() => {
        const el = campo.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, ALTURA_MAXIMA_CAMPO)}px`;
    }, [texto]);

    const valido = textoParaEnviar(texto) !== null;

    const aoEscrever = (evento) => {
        setTexto(evento.target.value.slice(0, TEXTO_MAXIMO));
        if (erro === 'repetida') c.limparAviso();
        if (!preparado.current) {
            preparado.current = true;
            servidorPronto().then((s) => s.preparar?.()).catch(() => {});
        }
    };

    const enviar = async () => {
        if (!valido || esperando) return;
        const enviado = texto;
        setTexto('');
        const resultado = await c.enviar(enviado);
        if (!resultado.enviado && !resultado.ignorado) setTexto((agora) => agora || resultado.devolver || '');
        campo.current?.focus();
    };

    const aoTeclar = (evento) => {
        if (evento.key === 'Enter' && !evento.shiftKey && !evento.nativeEvent.isComposing) {
            evento.preventDefault();
            enviar();
        }
    };

    const aoTeclarNoPainel = (evento) => {
        if (evento.key === 'Escape') {
            evento.stopPropagation();
            fecharConversa();
        }
    };

    const email = EMAIL_SUPORTE;
    const avisos = {
        geral: t('atendimento.erroGeral'),
        rede: t('atendimento.erroRede'),
        limite: t('atendimento.motivoLimite', { email }),
        repetida: t('atendimento.erroRepetida'),
        desligado: t('atendimento.motivoDesligado', { email }),
        teto: t('atendimento.motivoTeto', { email }),
        ocupada: t('atendimento.motivoOcupada'),
        pais_whatsapp: t('atendimento.motivoWhatsapp'),
    };
    const aviso = motivo ? avisos[motivo] : erro ? avisos[erro] : null;
    const nomeMax = t('atendimento.nomeMax');
    const usados = texto.length;

    return (
        <section
            className={styles.painel}
            role="dialog"
            aria-modal="false"
            aria-labelledby={ids.titulo}
            aria-describedby={ids.aviso}
            onKeyDown={aoTeclarNoPainel}
        >
            <header className={styles.cabeca}>
                <span className={styles.avatar} aria-hidden="true"><Sparkles size={20} strokeWidth={2.25} /></span>
                <div className={styles.cabecaTexto}>
                    <h2 id={ids.titulo} className={styles.titulo}>{t('atendimento.painelTitulo')}</h2>
                    <p className={styles.subtitulo}>{t('atendimento.painelSubtitulo')}</p>
                </div>
                <button type="button" className={styles.fechar} onClick={fecharConversa} aria-label={t('atendimento.fechar')}>
                    <X size={20} strokeWidth={2.5} aria-hidden="true" />
                </button>
            </header>

            <p id={ids.aviso} className={styles.aviso}>
                {t('atendimento.aviso')}{' '}
                <Link to={caminhoLegal(codigo, 'privacidade')} onClick={fecharConversa}>{t('atendimento.avisoLink')}</Link>
            </p>

            {grupo === 'os_dois' && (
                <p className={styles.outroCanal}>
                    {t('atendimento.preferirWhatsapp')}{' '}
                    <a href={linkWhatsApp(t('whatsapp.message'), whatsapp)} target="_blank" rel="noopener noreferrer">
                        {t('atendimento.abrirWhatsapp')}
                    </a>
                </p>
            )}

            <div ref={lista} className={styles.mensagens} role="log" aria-live="polite" aria-relevant="additions" tabIndex={0} aria-label={t('atendimento.historico')}>
                <Mensagem autor="max" nome={nomeMax}><p>{t('atendimento.boasVindas')}</p></Mensagem>
                {mensagens.map((m) => (
                    <Mensagem key={m.id} autor={m.autor} nome={m.autor === 'max' ? nomeMax : t('atendimento.voce')}>
                        {m.autor === 'max' ? <TextoDoMax texto={m.texto} /> : <p className={styles.textoPessoa}>{m.texto}</p>}
                    </Mensagem>
                ))}
                {esperando && (
                    <div className={styles.digitando} aria-hidden="true">
                        <span /><span /><span />
                    </div>
                )}
            </div>
            <p className="somente-leitor" role="status">{esperando ? t('atendimento.digitando') : ''}</p>

            <div className={styles.alertaLugar} role="alert">
                {aviso && (
                    <div className={styles.alerta}>
                        <p>{aviso}</p>
                        {motivo === 'pais_whatsapp' && (
                            <a className={`acao ${styles.botaoWhatsapp}`} href={linkWhatsApp(texto || t('whatsapp.message'), whatsapp)} target="_blank" rel="noopener noreferrer">
                                <MessageCircle size={18} aria-hidden="true" />
                                {t('atendimento.abrirWhatsapp')}
                            </a>
                        )}
                    </div>
                )}
            </div>

            <form
                className={styles.envio}
                onSubmit={(evento) => {
                    evento.preventDefault();
                    enviar();
                }}
            >
                <label htmlFor={ids.campo} className="somente-leitor">{t('atendimento.campoRotulo')}</label>
                <textarea
                    id={ids.campo}
                    ref={campo}
                    className={styles.campo}
                    rows={1}
                    maxLength={TEXTO_MAXIMO}
                    value={texto}
                    onChange={aoEscrever}
                    onKeyDown={aoTeclar}
                    placeholder={t('atendimento.campoDica')}
                    aria-describedby={`${ids.dica} ${ids.contador}`}
                    autoComplete="off"
                    enterKeyHint="send"
                />
                <button type="submit" className={styles.enviar} disabled={!valido || esperando} aria-label={t('atendimento.enviar')}>
                    <SendHorizontal size={20} strokeWidth={2.25} aria-hidden="true" />
                </button>
                <p id={ids.dica} className="somente-leitor">{t('atendimento.dicaTeclado')}</p>
                <p id={ids.contador} className={styles.contador} data-visivel={usados >= AVISO_CONTADOR ? 'sim' : 'nao'}>
                    {t('atendimento.contador', { usados: formatarNumero(codigo, usados), limite: formatarNumero(codigo, TEXTO_MAXIMO) })}
                </p>
            </form>
        </section>
    );
}
