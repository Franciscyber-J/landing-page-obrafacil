// Peças das páginas para quem já é cliente (volta do pagamento, Perfil e Suporte): cabeça em painel azul,
// cartões de vidro, passos numerados, lojas e links para a Central de Ajuda. Páginas estáticas: nada aqui
// lê dados do pagamento nem chama o servidor.
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { caminhoArtigo } from '../../i18n/idiomas.js';
import { APP, WINDOWS, appStore, googlePlay } from '../../links.js';
import { comDestaque, comNegrito } from '../../texto.jsx';
import styles from './Conta.module.css';

export function Pagina({ children }) {
    return (
        <main className={styles.pagina}>
            <div className={styles.brilho} aria-hidden="true" />
            <div className={styles.conteudo}>{children}</div>
        </main>
    );
}

export function Cabeca({ icone: Icone, sobretitulo, titulo, texto, children }) {
    return (
        <header className={styles.cabeca} data-painel>
            <div className={styles.cabecaTopo}>
                <span className={styles.cabecaIcone} aria-hidden="true"><Icone size={26} strokeWidth={2.25} /></span>
                <p className={styles.sobretitulo}>{sobretitulo}</p>
            </div>
            <h1 className={styles.titulo}>{comDestaque(titulo)}</h1>
            <p className={styles.texto}>{comNegrito(texto)}</p>
            {children && <div className={styles.acoes}>{children}</div>}
        </header>
    );
}

// classe: posição na grade da página (ex.: cartão que ocupa a largura toda).
export function Cartao({ id, titulo, icone: Icone, destaque = false, classe = '', children }) {
    return (
        <section className={`${styles.cartao} ${destaque ? styles.cartaoDestaque : ''} ${classe}`} aria-labelledby={id}>
            <h2 id={id} className={styles.cartaoTitulo}>
                {Icone && <span className={styles.cartaoIcone} aria-hidden="true"><Icone size={20} strokeWidth={2.25} /></span>}
                <span>{titulo}</span>
            </h2>
            {children}
        </section>
    );
}

// itens: [{ titulo, texto }]
export function Passos({ itens }) {
    return (
        <ol className={styles.passos}>
            {itens.map((p, i) => (
                <li key={i}>
                    <span className={styles.numero} aria-hidden="true">{i + 1}</span>
                    <div>
                        <h3 className={styles.passoTitulo}>{p.titulo}</h3>
                        <p className={styles.passoTexto}>{comNegrito(p.texto)}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

export function Lista({ itens }) {
    return (
        <ul className={styles.lista}>
            {itens.map((texto, i) => <li key={i}>{comNegrito(texto)}</li>)}
        </ul>
    );
}

export function Paragrafo({ children }) {
    return <p className={styles.paragrafo}>{comNegrito(children)}</p>;
}

// Botão principal: o app no navegador (o mesmo endereço para onde a Stripe leva quem desiste do pagamento).
export function AbrirApp({ classe = 'acao' }) {
    const { t } = useTranslation();
    return <a href={APP} className={`${classe} ${styles.botao}`}>{t('conta.abrirApp')}</a>;
}

// Lojas e Windows (sem data-conversao: quem chega aqui já é cliente; não conta como "Começar grátis").
export function Lojas({ codigo, classe = '' }) {
    const { t } = useTranslation();
    return (
        <Cartao id="conta-lojas" titulo={t('conta.lojasTitulo')} classe={classe}>
            <p className={styles.paragrafo}>{t('conta.lojasTexto')}</p>
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
        </Cartao>
    );
}

// Links para artigos da Central pelo id do artigo: a Central leva ao endereço com o nome do artigo no idioma.
// itens: [{ id, texto }]
export function Artigos({ codigo, itens }) {
    return (
        <ul className={styles.artigos}>
            {itens.map((a) => (
                <li key={a.id}>
                    <Link to={caminhoArtigo(codigo, a.id)}>
                        <span>{a.texto}</span>
                        <ArrowRight size={18} aria-hidden="true" className="seta" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}
