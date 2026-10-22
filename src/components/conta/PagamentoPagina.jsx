// Volta do pagamento pelo navegador (Stripe Checkout e Payment Link do site). A página é estática: não lê a
// sessão de pagamento nem chama o servidor. Quem libera a compra é o aviso da Stripe ao servidor (webhook);
// aqui só explicamos o que acontece e o que fazer se demorar. Endereços antigos: /primeiros-passos (PRO),
// /pagamento-ok/ (Acesso Cliente), /pacote-downloads-extras/ e /expansao-20gb-ok/ (ver PAGINAS_ANTIGAS).
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CircleCheckBig } from 'lucide-react';
import { caminhoArtigo, caminhoPagamento, caminhoSuporte } from '../../i18n/idiomas.js';
import { useRotaEquivalente } from '../../i18n/RotaDoIdioma.jsx';
import { AbrirApp, Cabeca, Cartao, Lista, Lojas, Pagina, Passos } from './partes.jsx';
import useCabecaDaPagina from './useCabecaDaPagina.js';
import styles from './Conta.module.css';

// Artigo da Central (id) com o passo a passo de cada compra.
const ARTIGO = {
    geral: 'pagamentos-e-reembolso',
    pro: 'ativar-pro-do-site',
    acesso: 'acesso-cliente',
    downloads: 'downloads-extras',
    armazenamento: 'contratar-armazenamento',
};

export default function PagamentoPagina({ codigo, compra }) {
    const { t } = useTranslation();
    const tipo = compra ?? 'geral';
    const texto = (chave) => t(`pagamento.compras.${tipo}.${chave}`);

    useRotaEquivalente((outro) => caminhoPagamento(outro, compra), [compra]);
    useCabecaDaPagina({ titulo: t('pagamento.metaTitulo'), descricao: t('pagamento.metaDescricao'), semIndexar: true });

    const demora = [
        t('pagamento.demoraEsperar'),
        ...(tipo === 'pro' ? [t('pagamento.demoraSairEntrar')] : []),
        t('pagamento.demoraRestaurar'),
        t('pagamento.demoraSuporte'),
    ];

    return (
        <Pagina>
            <Cabeca icone={CircleCheckBig} sobretitulo={texto('sobretitulo')} titulo={texto('titulo')} texto={texto('texto')}>
                <AbrirApp />
                <Link to={caminhoArtigo(codigo, ARTIGO[tipo])} className={`acao-clara ${styles.botao}`}>{texto('artigo')}</Link>
            </Cabeca>

            {/* Os dois cartões lado a lado com a mesma altura e as lojas na largura toda embaixo (antes as lojas
                ficavam sob o cartão da direita, deixando um vazio grande à esquerda e quebrando o Windows sozinho). */}
            <div className={`${styles.grade} ${styles.gradePareada}`}>
                <Cartao id="pagamento-agora" titulo={t('pagamento.agoraTitulo')}>
                    <Passos
                        itens={[
                            { titulo: t('pagamento.voltarTitulo'), texto: t('pagamento.voltarTexto') },
                            { titulo: t('pagamento.automaticoTitulo'), texto: t('pagamento.automaticoTexto') },
                            { titulo: t('pagamento.conferirTitulo'), texto: texto('conferir') },
                        ]}
                    />
                </Cartao>

                <Cartao id="pagamento-demora" titulo={t('pagamento.demoraTitulo')}>
                    <Lista itens={demora} />
                    <Link to={caminhoSuporte(codigo)} className={`acao-contorno ${styles.botao} ${styles.botaoCartao}`}>
                        {t('conta.falarSuporte')}
                    </Link>
                </Cartao>

                <Lojas codigo={codigo} classe={styles.larguraToda} />
            </div>
        </Pagina>
    );
}
