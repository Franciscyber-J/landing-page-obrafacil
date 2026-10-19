// Print do passo com a marcação animada por cima (Fase 12), igual à do app a partir da 1.9.2: escurecer o
// resto, contorno pulsando, seta apontando e zoom no alvo. As contas ficam em src/ajuda/marcacao.js.
//
// - A imagem não muda: a marcação é um SVG por cima, decorativo (aria-hidden); o texto alternativo é o da imagem.
// - O espaço do print é reservado antes de a imagem chegar (todos os prints são 1080 × 2400), sem pulo na página.
// - A animação só roda com o print na tela (um IntersectionObserver para todos os prints da página) e com a
//   imagem carregada. Fora da tela não há nenhum quadro calculado.
// - Com "reduzir movimento" no aparelho, a marcação aparece parada, já no estado final.
// - Passo sem marcação (ou com marcação inválida): só o print, como antes.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { DURACAO_ENTRADA, desenhoDaMarcacao, quadroNoTempo } from '../../ajuda/marcacao.js';
import styles from './Ajuda.module.css';

// Proporção dos prints da Central (tela fixa do roteiro dos prints, 1080 × 2400). Vale até a imagem chegar;
// depois, a proporção real da imagem.
const PROPORCAO_PADRAO = 1080 / 2400;
// Parte do print que precisa estar na tela para a entrada começar (a pessoa vê a marcação chegar).
const PARTE_VISIVEL = 0.35;

// ---------- "Reduzir movimento" do aparelho (acompanha a troca com a página aberta) ----------

const MENOS_MOVIMENTO = '(prefers-reduced-motion: reduce)';

function assinarMovimento(aviso) {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const consulta = window.matchMedia(MENOS_MOVIMENTO);
    consulta.addEventListener('change', aviso);
    return () => consulta.removeEventListener('change', aviso);
}

function lerMenosMovimento() {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(MENOS_MOVIMENTO).matches;
}

// ---------- Um observador para todos os prints da página ----------

const avisos = new Map();
let observador = null;

function observarNaTela(elemento, aviso) {
    if (typeof IntersectionObserver === 'undefined') {
        // Navegador sem o recurso: trata como sempre na tela.
        aviso({ naTela: true, bemVisivel: true });
        return () => {};
    }
    if (!observador) {
        observador = new IntersectionObserver((entradas) => {
            for (const e of entradas) {
                avisos.get(e.target)?.({
                    naTela: e.isIntersecting,
                    bemVisivel: e.isIntersecting && e.intersectionRatio >= PARTE_VISIVEL,
                });
            }
        }, { threshold: [0, PARTE_VISIVEL] });
    }
    avisos.set(elemento, aviso);
    observador.observe(elemento);
    return () => {
        observador.unobserve(elemento);
        avisos.delete(elemento);
    };
}

// ---------- Componente ----------

const INICIO = { entrada: 0, pulso: 0 };

export default function PrintComMarcacao({ src, alt, marcacao }) {
    const caixa = useRef(null);
    const parado = useSyncExternalStore(assinarMovimento, lerMenosMovimento, () => false);
    const [area, setArea] = useState(null);
    const [proporcao, setProporcao] = useState(PROPORCAO_PADRAO);
    const [carregou, setCarregou] = useState(false);
    const [tela, setTela] = useState({ naTela: false, comecou: false });
    const [quadro, setQuadro] = useState(INICIO);
    // Tempo de entrada já corrido: se o print sai da tela no meio, ela continua de onde parou na volta.
    const entradaCorrida = useRef(0);
    const temMarcacao = !!marcacao;

    const aoCarregar = useCallback((img) => {
        if (!img || !img.naturalWidth || !img.naturalHeight) return;
        setProporcao(img.naturalWidth / img.naturalHeight);
        setCarregou(true);
    }, []);

    // Imagem que já estava pronta (cache) antes de o React ligar o onLoad.
    const refDaImagem = useCallback((img) => {
        if (img?.complete) aoCarregar(img);
    }, [aoCarregar]);

    // Tamanho do print na tela: a marcação acompanha qualquer largura.
    useEffect(() => {
        const el = caixa.current;
        if (!temMarcacao || !el || typeof ResizeObserver === 'undefined') return undefined;
        const medir = new ResizeObserver(([e]) => {
            const { width, height } = e.contentRect;
            setArea((antes) => (antes && antes.largura === width && antes.altura === height ? antes : { largura: width, altura: height }));
        });
        medir.observe(el);
        return () => medir.disconnect();
    }, [temMarcacao]);

    // Na tela ou não (só importa com marcação e sem "reduzir movimento").
    useEffect(() => {
        const el = caixa.current;
        if (!temMarcacao || parado || !el) return undefined;
        return observarNaTela(el, ({ naTela, bemVisivel }) => {
            setTela((antes) => {
                const comecou = antes.comecou || bemVisivel;
                return antes.naTela === naTela && antes.comecou === comecou ? antes : { naTela, comecou };
            });
        });
    }, [temMarcacao, parado]);

    // Quadros da animação: só com a imagem pronta, o print na tela e a entrada já começada.
    // O pulso recomeça do zero a cada volta para a tela (no app, entrada e pulso começam juntos).
    const animar = temMarcacao && !parado && carregou && tela.naTela && tela.comecou;
    useEffect(() => {
        if (!animar) return undefined;
        let pedido = 0;
        let inicio = null;
        const jaCorrida = entradaCorrida.current;
        const passo = (agora) => {
            if (inicio === null) inicio = agora;
            const pulso = agora - inicio;
            entradaCorrida.current = Math.min(DURACAO_ENTRADA, jaCorrida + pulso);
            setQuadro(quadroNoTempo(entradaCorrida.current, pulso));
            pedido = requestAnimationFrame(passo);
        };
        pedido = requestAnimationFrame(passo);
        return () => cancelAnimationFrame(pedido);
    }, [animar]);

    const desenho = marcacao && carregou && area ? desenhoDaMarcacao(area, marcacao, quadro, parado) : null;
    const zoom = desenho?.zoom && desenho.zoom.escala !== 1
        ? { transform: `scale(${desenho.zoom.escala})`, transformOrigin: desenho.zoom.origem }
        : undefined;

    return (
        <div ref={caixa} className={styles.print} style={{ aspectRatio: proporcao }}>
            <img
                ref={refDaImagem}
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                style={zoom}
                onLoad={(e) => aoCarregar(e.currentTarget)}
            />
            {desenho && (
                <svg
                    className={styles.marcacao}
                    viewBox={`0 0 ${area.largura} ${area.altura}`}
                    aria-hidden="true"
                    focusable="false"
                    data-marcacao={marcacao.efeitos.join(' ')}
                >
                    {desenho.veu && (
                        <path className={styles.marcacaoVeu} d={desenho.veu.d} fillRule="evenodd" fillOpacity={desenho.veu.opacidade} />
                    )}
                    {desenho.circulo && (
                        <g fill="none">
                            {desenho.circulo.onda && (
                                <path className={styles.marcacaoCor} d={desenho.circulo.onda.d} strokeWidth={desenho.circulo.traco} strokeOpacity={desenho.circulo.onda.opacidade} />
                            )}
                            <path className={styles.marcacaoContorno} d={desenho.circulo.d} strokeWidth={desenho.circulo.tracoContorno} strokeOpacity={desenho.circulo.opacidade} />
                            <path className={styles.marcacaoCor} d={desenho.circulo.d} strokeWidth={desenho.circulo.traco} strokeOpacity={desenho.circulo.opacidade} />
                        </g>
                    )}
                    {desenho.seta && (
                        <path
                            className={styles.marcacaoSeta}
                            d={desenho.seta.d}
                            transform={desenho.seta.transform}
                            strokeWidth={desenho.seta.tracoContorno}
                            strokeOpacity={desenho.seta.opacidade}
                            fillOpacity={desenho.seta.opacidade}
                        />
                    )}
                </svg>
            )}
        </div>
    );
}
