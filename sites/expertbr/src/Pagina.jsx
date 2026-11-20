// Página da ExpertBR (uma por idioma), desenhada no build em HTML (src/servidor.jsx). No navegador não há React:
// o que se mexe (tema, menu de idioma) é o src/cliente.js, pequeno, e a página funciona inteira sem ele.
// Todo texto vem de src/textos (ou dos textos do ObraFácil, "obrafacil:..."); endereços pelas funções do cadastro.
import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, LifeBuoy, Mail, Moon, Sun } from 'lucide-react';
import { caminhoAjuda, caminhoLegal, caminhoSuporte } from '../../../src/i18n/idiomas.js';
import { EMAIL_SUPORTE } from '../../../src/links.js';
import { idiomaDasTelas } from '../../../src/telas.js';
import { IDIOMAS, caminhoInicio, idioma } from './idiomas.js';
import { NO_AR, PRODUTOS, enderecoDaTela, paginaDoProduto } from './produtos.js';
import { lista } from './i18n.js';

const OBRAFACIL = 'https://appobrafacil.expertbr.com';

// "**palavra**" no texto vira destaque (laranja, sem gradiente).
function ComDestaque({ texto }) {
    const partes = String(texto).split(/\*\*(.+?)\*\*/g);
    return partes.map((parte, n) => (n % 2 ? <em key={n}>{parte}</em> : parte));
}

// Logotipo da ExpertBR ("Rumo", aprovado pelo Francis em 20/11/2026; desenho em ferramentas/marca). Uma imagem
// para cada tema: o CSS mostra a do tema da página (.so-claro / .so-escuro), e sem JavaScript fica a do claro, como o
// resto da página. O nome continua no texto alternativo. Tamanho pelo CSS (.marca-logo--<onde>).
const LOGO = { largura: 150, altura: 36 }; // proporção do desenho (4,15 : 1)

export function Marca({ onde = 'topo' }) {
    return (
        <span className={`marca-logo marca-logo--${onde}`} translate="no">
            <img className="so-claro" src="/logo/expertbr.svg" alt="ExpertBR" width={LOGO.largura} height={LOGO.altura} decoding="async" />
            <img className="so-escuro" src="/logo/expertbr-escuro.svg" alt="ExpertBR" width={LOGO.largura} height={LOGO.altura} decoding="async" />
        </span>
    );
}

function Bandeira({ pais }) {
    return <img className="bandeira" src={`/bandeiras/${pais.toLowerCase()}.svg`} alt="" width="20" height="15" loading="lazy" decoding="async" />;
}

// Âncora de uma seção com a palavra do idioma (#aplicativos, #apps, #アプリ...).
function ancora(t, secao) {
    return `#${t(`ancoras.${secao}`)}`;
}

function SeletorDeIdioma({ t, codigo }) {
    const atual = idioma(codigo);
    return (
        <details className="idiomas" data-idiomas>
            <summary className="idiomas__botao" aria-label={t('nav.escolherIdioma')}>
                <Bandeira pais={atual.pais} />
                <span className="idiomas__curto" lang={atual.codigo}>{atual.curto}</span>
                <ChevronDown size={16} aria-hidden="true" className="idiomas__seta" />
            </summary>
            <ul className="idiomas__lista">
                {IDIOMAS.map((i) => (
                    <li key={i.codigo}>
                        <a
                            href={caminhoInicio(i.codigo)}
                            hrefLang={i.codigo}
                            lang={i.codigo}
                            aria-current={i.codigo === codigo ? 'true' : undefined}
                        >
                            <Bandeira pais={i.pais} />
                            <span dir={i.direcao}>{i.nome}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </details>
    );
}

function Cabecalho({ t, codigo }) {
    return (
        <header className="topo">
            <div className="container topo__linha">
                <a className="marca" href={caminhoInicio(codigo)} aria-label={t('nav.inicio')}>
                    <Marca />
                </a>
                <nav className="topo__nav" aria-label={t('nav.navegacao')}>
                    <a href={ancora(t, 'produtos')}>{t('nav.produtos')}</a>
                    <a href={ancora(t, 'sobre')}>{t('nav.sobre')}</a>
                    <a href={ancora(t, 'contato')}>{t('nav.contato')}</a>
                </nav>
                <div className="topo__acoes">
                    <SeletorDeIdioma t={t} codigo={codigo} />
                    {/* Sem JavaScript o tema segue o aparelho e o botão fica escondido (src/cliente.js mostra). */}
                    <button type="button" className="tema" data-tema hidden aria-label={t('nav.tema')} title={t('nav.tema')}>
                        <Moon size={19} aria-hidden="true" className="so-claro" />
                        <Sun size={19} aria-hidden="true" className="so-escuro" />
                    </button>
                </div>
            </div>
        </header>
    );
}

function Estado({ t, produto }) {
    return (
        <span className="estado" data-estado={produto.estado}>
            <span className="estado__ponto" aria-hidden="true" />
            {t(produto.estado === 'no-ar' ? 'produtos.noAr' : 'produtos.emBreve')}
        </span>
    );
}

function Abertura({ t, codigo }) {
    const principal = NO_AR[0];
    return (
        <section className="abertura" aria-labelledby="abertura-titulo">
            <div className="container">
                <h1 id="abertura-titulo" className="abertura__titulo"><ComDestaque texto={t('abertura.titulo')} /></h1>
                <p className="abertura__texto">{t('abertura.texto')}</p>
                <div className="abertura__acoes">
                    {principal && (
                        <a className="acao" href={paginaDoProduto(principal, codigo)}>
                            {t('produtos.conhecer', { produto: principal.nome })}
                            <ArrowRight size={18} aria-hidden="true" className="seta" />
                        </a>
                    )}
                    <a className="acao-contorno" href={ancora(t, 'produtos')}>{t('abertura.secundaria')}</a>
                </div>
                {/* Lista dos apps da casa, logo na primeira dobra: cada um leva ao cartão dele. */}
                <ul className="elenco" aria-label={t('nav.produtos')}>
                    {PRODUTOS.map((p) => (
                        <li key={p.id} data-produto={p.cor}>
                            <a href={`#${p.id}`}>
                                <Simbolo produto={p} tamanho={36} />
                                <span className="elenco__nome" translate="no">{p.nome}</span>
                                <Estado t={t} produto={p} />
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

function Simbolo({ produto, tamanho }) {
    if (produto.simbolo) {
        return <img className="simbolo" src={`/${produto.simbolo.arquivo}`} alt="" width={tamanho} height={tamanho} decoding="async" />;
    }
    // App sem símbolo próprio ainda: a inicial do nome na cor do app.
    // (Tamanho por classe, não por "style": a política de segurança do site não aceita estilo embutido.)
    return <span className={`simbolo simbolo--letra simbolo--${tamanho}`} aria-hidden="true">{produto.nome.slice(0, 1)}</span>;
}

function Telas({ t, codigo, produto }) {
    const idiomaTelas = idiomaDasTelas(codigo);
    return (
        <figure className="produto__telas">
            <div className="produto__aparelhos">
                {produto.telas.itens.map((tela, n) => (
                    <div key={tela.nome} className={`aparelho produto__aparelho produto__aparelho--${n + 1}`}>
                        <img
                            src={enderecoDaTela(idiomaTelas, tela.nome)}
                            alt={t(tela.alt)}
                            width="720"
                            height="1600"
                            loading={n === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                        />
                    </div>
                ))}
            </div>
            <figcaption className="produto__legenda">{t(produto.telas.legenda)}</figcaption>
        </figure>
    );
}

// Desenho do Orbit (ainda sem tela para mostrar): as três conversas chegando numa caixa só. Só nomes de canais, sem
// logotipo de outra empresa.
function DesenhoOrbit() {
    const canais = ['Instagram', 'WhatsApp', 'Messenger'];
    return (
        <div className="orbita" aria-hidden="true">
            <svg className="orbita__aneis" viewBox="0 0 320 320">
                <circle cx="160" cy="160" r="150" />
                <circle cx="160" cy="160" r="104" />
                <g className="orbita__giro">
                    <circle className="orbita__satelite" cx="160" cy="10" r="6" />
                    <circle className="orbita__satelite" cx="290" cy="235" r="6" />
                    <circle className="orbita__satelite" cx="30" cy="235" r="6" />
                </g>
            </svg>
            <span className="orbita__centro">
                {/* O símbolo "Monograma" do Orbit (aprovado em 20/11/2026): o O partido, azul a empresa e coral o cliente. */}
                <svg className="orbita__simbolo" viewBox="0 0 64 64">
                    <path d="M25.15,54.87A22.35,22.35 0 0 1 25.15,11.9L28.32,22.97A10.83,10.83 0 0 0 28.32,43.79Z" fill="#154F84" />
                    <path d="M38.85,9.13A22.35,22.35 0 0 1 38.85,52.1L35.68,41.03A10.83,10.83 0 0 0 35.68,20.21Z" fill="#FF7A66" />
                </svg>
            </span>
            {canais.map((c, n) => <span key={c} className={`orbita__canal orbita__canal--${n + 1}`} translate="no">{c}</span>)}
        </div>
    );
}

function Produto({ t, codigo, produto }) {
    const pagina = paginaDoProduto(produto, codigo);
    const destaques = lista(t, produto.textos.destaques);
    const noAr = produto.estado === 'no-ar';
    return (
        <article id={produto.id} className="produto" data-produto={produto.cor} data-estado={produto.estado} aria-labelledby={`${produto.id}-nome`}>
            <div className="produto__texto">
                <div className="produto__cabeca">
                    <Simbolo produto={produto} tamanho={56} />
                    <h3 id={`${produto.id}-nome`} className="produto__nome" translate="no">{produto.nome}</h3>
                    <Estado t={t} produto={produto} />
                </div>
                <p className="produto__linha">{t(produto.textos.linha)}</p>
                <p className="produto__descricao">{t(produto.textos.descricao)}</p>
                <ul className="produto__destaques">
                    {destaques.map((d) => <li key={d}>{d}</li>)}
                </ul>
                {produto.textos.plataformas && <p className="produto__plataformas">{t(produto.textos.plataformas)}</p>}
                {noAr ? (
                    <>
                        <div className="produto__acoes">
                            <a className="acao" href={pagina}>
                                {t('produtos.conhecer', { produto: produto.nome })}
                                <ArrowRight size={18} aria-hidden="true" className="seta" />
                            </a>
                        </div>
                        {produto.textos.nota && <p className="produto__nota">{t(produto.textos.nota)}</p>}
                        {produto.lojas?.length > 0 && (
                            <ul className="produto__lojas" aria-label={t('produtos.ondeUsar', { produto: produto.nome })}>
                                {produto.lojas.map((l) => (
                                    <li key={l.rotulo}>
                                        <a href={l.url(codigo)}>
                                            {l.rotulo.includes('.') ? t(l.rotulo) : l.rotulo}
                                            <ArrowUpRight size={15} aria-hidden="true" className="seta" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                ) : (
                    <p className="produto__aviso">{t(produto.textos.aviso)}</p>
                )}
            </div>
            {produto.telas ? <Telas t={t} codigo={codigo} produto={produto} /> : <DesenhoOrbit />}
        </article>
    );
}

function Produtos({ t, codigo }) {
    return (
        <section id={t('ancoras.produtos')} className="secao produtos" aria-labelledby="produtos-titulo">
            <div className="container">
                <div className="secao__cabeca">
                    <h2 id="produtos-titulo" className="secao__titulo">{t('produtos.titulo')}</h2>
                    <p className="secao__texto">{t('produtos.texto')}</p>
                </div>
                <div className="produtos__lista">
                    {PRODUTOS.map((p) => <Produto key={p.id} t={t} codigo={codigo} produto={p} />)}
                </div>
            </div>
        </section>
    );
}

function Sobre({ t }) {
    const paragrafos = lista(t, 'sobre.paragrafos');
    const itens = [
        { titulo: t('sobre.itens.lugar'), texto: t('obrafacil:recursos.itens.offline.texto') },
        { titulo: t('sobre.itens.aparelhos'), texto: t('obrafacil:recursos.itens.aparelhos.texto') },
        { titulo: t('sobre.itens.idiomas'), texto: t('sobre.itens.idiomasTexto') },
    ];
    return (
        <section id={t('ancoras.sobre')} className="secao sobre" aria-labelledby="sobre-titulo">
            <div className="container sobre__grade">
                <div>
                    <h2 id="sobre-titulo" className="secao__titulo">{t('sobre.titulo')}</h2>
                    {paragrafos.map((p) => <p key={p} className="sobre__paragrafo">{p}</p>)}
                </div>
                <div>
                    <h3 className="sobre__como">{t('sobre.comoTitulo')}</h3>
                    <ul className="sobre__itens">
                        {itens.map((item) => (
                            <li key={item.titulo}>
                                <strong>{item.titulo}</strong>
                                <span><span className="sobre__prova" translate="no">ObraFácil</span>{item.texto}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

function Contato({ t, codigo }) {
    return (
        <section id={t('ancoras.contato')} className="secao contato" aria-labelledby="contato-titulo">
            <div className="container contato__grade">
                <div>
                    <h2 id="contato-titulo" className="secao__titulo">{t('contato.titulo')}</h2>
                    <p className="secao__texto">{t('contato.texto')}</p>
                    <a className="contato__email" href={`mailto:${EMAIL_SUPORTE}`}>
                        <Mail size={22} aria-hidden="true" />
                        <span><span className="somente-leitor">{t('contato.email')}: </span>{EMAIL_SUPORTE.split('@')[0]}@<wbr />{EMAIL_SUPORTE.split('@')[1]}</span>
                    </a>
                </div>
                <div className="contato__ajuda">
                    <h3>{t('contato.ajudaTitulo')}</h3>
                    <p>{t('contato.ajudaTexto')}</p>
                    <div className="contato__links">
                        <a className="acao-contorno" href={`${OBRAFACIL}${caminhoAjuda(codigo)}`}>
                            <BookOpen size={18} aria-hidden="true" />
                            {t('obrafacil:footer.help')}
                        </a>
                        <a className="acao-contorno" href={`${OBRAFACIL}${caminhoSuporte(codigo)}`}>
                            <LifeBuoy size={18} aria-hidden="true" />
                            {t('obrafacil:footer.support')}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Rodape({ t, codigo }) {
    return (
        <footer className="rodape">
            <div className="container">
                <div className="rodape__grade">
                    <div className="rodape__marca">
                        <a className="marca" href={caminhoInicio(codigo)} aria-label={t('nav.inicio')}><Marca onde="rodape" /></a>
                        <p>{t('rodape.descricao')}</p>
                    </div>
                    <nav aria-labelledby="rodape-apps">
                        <h2 id="rodape-apps" className="rodape__titulo">{t('rodape.aplicativos')}</h2>
                        <ul>
                            {PRODUTOS.map((p) => (
                                <li key={p.id}>
                                    {p.estado === 'no-ar'
                                        ? <a href={paginaDoProduto(p, codigo)} translate="no">{p.nome}</a>
                                        : <span><span translate="no">{p.nome}</span> · {t('produtos.emBreve')}</span>}
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <nav aria-labelledby="rodape-politicas">
                        <h2 id="rodape-politicas" className="rodape__titulo">{t('rodape.politicas')}</h2>
                        <ul>
                            <li><a href={`${OBRAFACIL}${caminhoLegal(codigo, 'termos')}`}>{t('rodape.termos')}</a></li>
                            <li><a href={`${OBRAFACIL}${caminhoLegal(codigo, 'privacidade')}`}>{t('rodape.privacidade')}</a></li>
                        </ul>
                    </nav>
                </div>
                <nav className="rodape__idiomas" aria-labelledby="rodape-idiomas">
                    <h2 id="rodape-idiomas" className="rodape__titulo">{t('rodape.idioma')}</h2>
                    <ul>
                        {IDIOMAS.map((i) => (
                            <li key={i.codigo}>
                                <a href={caminhoInicio(i.codigo)} hrefLang={i.codigo} lang={i.codigo} aria-current={i.codigo === codigo ? 'true' : undefined}>{i.nome}</a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </footer>
    );
}

export default function Pagina({ t, codigo }) {
    return (
        <>
            <a className="pular" href="#conteudo">{t('nav.pular')}</a>
            <Cabecalho t={t} codigo={codigo} />
            <main id="conteudo">
                <Abertura t={t} codigo={codigo} />
                <Produtos t={t} codigo={codigo} />
                <Sobre t={t} />
                <Contato t={t} codigo={codigo} />
            </main>
            <Rodape t={t} codigo={codigo} />
        </>
    );
}

// Raiz "/" sem o servidor (o .htaccess leva cada pessoa ao idioma dela com um 302 antes de chegar aqui): a lista dos
// idiomas, e o src/cliente.js escolhe pelo navegador.
export function Raiz() {
    return (
        <main className="raiz" id="conteudo">
            <p className="raiz__marca"><Marca onde="raiz" /></p>
            <ul className="raiz__idiomas" data-raiz>
                {IDIOMAS.map((i) => (
                    <li key={i.codigo}>
                        <a href={caminhoInicio(i.codigo)} hrefLang={i.codigo} lang={i.codigo} data-codigo={i.codigo}>
                            <Bandeira pais={i.pais} />
                            <span>{i.nome}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </main>
    );
}
