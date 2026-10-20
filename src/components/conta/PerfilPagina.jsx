// Link "ver meu perfil / assinatura" dos e-mails de cobrança do app (endereço antigo /perfil). O site não
// entra na conta: a página explica onde a assinatura fica no app (Perfil > Seu plano > Gerenciar).
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CreditCard, UserRound } from 'lucide-react';
import { caminhoArtigo, caminhoPerfil } from '../../i18n/idiomas.js';
import { useRotaEquivalente } from '../../i18n/RotaDoIdioma.jsx';
import { AbrirApp, Artigos, Cabeca, Cartao, Lista, Lojas, Pagina, Paragrafo, Passos } from './partes.jsx';
import useCabecaDaPagina from './useCabecaDaPagina.js';
import styles from './Conta.module.css';

export default function PerfilPagina({ codigo }) {
    const { t } = useTranslation();

    useRotaEquivalente((outro) => caminhoPerfil(outro), []);
    useCabecaDaPagina({ titulo: t('perfil.metaTitulo'), descricao: t('perfil.metaDescricao'), semIndexar: true });

    return (
        <Pagina>
            <Cabeca icone={UserRound} sobretitulo={t('perfil.sobretitulo')} titulo={t('perfil.titulo')} texto={t('perfil.texto')}>
                <AbrirApp />
                <Link to={caminhoArtigo(codigo, 'cancelar-assinatura')} className={`acao-clara ${styles.botao}`}>{t('perfil.artigoBotao')}</Link>
            </Cabeca>

            <div className={styles.grade}>
                <div className={styles.coluna}>
                    <Cartao id="perfil-passos" titulo={t('perfil.passosTitulo')}>
                        <Passos
                            itens={[1, 2, 3].map((n) => ({ titulo: t(`perfil.passo${n}Titulo`), texto: t(`perfil.passo${n}Texto`) }))}
                        />
                    </Cartao>
                    <Cartao id="perfil-gerenciar" titulo={t('perfil.gerenciarTitulo')}>
                        <Lista itens={[t('perfil.gerenciarCelular'), t('perfil.gerenciarSite'), t('perfil.gerenciarLugar')]} />
                    </Cartao>
                </div>

                <div className={styles.coluna}>
                    <Cartao id="perfil-aviso" titulo={t('perfil.avisoTitulo')} icone={CreditCard} destaque>
                        <Paragrafo>{t('perfil.avisoTexto')}</Paragrafo>
                    </Cartao>
                    <Cartao id="perfil-artigos" titulo={t('perfil.artigosTitulo')}>
                        <Artigos
                            codigo={codigo}
                            itens={[
                                { id: 'cartao-do-plano', texto: t('perfil.artigoCartao') },
                                { id: 'cancelar-assinatura', texto: t('perfil.artigoCancelar') },
                                { id: 'pagamentos-e-reembolso', texto: t('perfil.artigoPagamentos') },
                            ]}
                        />
                    </Cartao>
                    <Lojas codigo={codigo} />
                </div>
            </div>
        </Pagina>
    );
}
