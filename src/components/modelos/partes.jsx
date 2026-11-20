// Peças das páginas dos modelos grátis (src/modelos/): trilha, botão do PDF, a parte "no ObraFácil" que leva ao app
// e os estados de carregamento. Texto só por chave de tradução; o texto do modelo vem do app (src/modelos/dados).
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import { Check, Download, RefreshCw } from 'lucide-react';
import { caminhoInicio } from '../../i18n/idiomas.js';
import { caminhoDoPdf, nomeDoArquivo, papelDoIdioma } from '../../modelos/modelos.js';
import { publico } from '../../publico.js';
import { comDestaque } from '../../texto.jsx';
import { useLinkComecar } from '../../useNavegador.js';
import useCabecaDaPagina from '../conta/useCabecaDaPagina.js';
import styles from './Modelos.module.css';

// "Início / Modelos grátis / Alvenaria estrutural". itens: [{ texto, para? }]; o último é a página aberta.
export function Trilha({ codigo, itens }) {
    const { t } = useTranslation();
    return (
        <nav aria-label={t('ajuda.trilha')} className={styles.trilha}>
            <ol>
                <li><Link to={caminhoInicio(codigo)}>ObraFácil</Link></li>
                {itens.map((item, i) => (
                    <li key={i}>
                        {item.para ? <Link to={item.para}>{item.texto}</Link> : <span aria-current="page">{item.texto}</span>}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

// Botão (ou link compacto, na lista) que baixa o PDF do modelo: o arquivo gerado no build a partir dos mesmos dados
// (ferramentas/modelos/pdf.mjs). Sem data-conversao: o public/tag-google.js contaria o download como "começar grátis".
export function BaixarPdf({ codigo, modelo, nome, classe = 'acao-contorno', compacto = false }) {
    const { t } = useTranslation();
    const papel = t(`modelos.papel.${papelDoIdioma(codigo)}`);
    return (
        <a
            href={publico(caminhoDoPdf(codigo, modelo.slug))}
            download={nomeDoArquivo(nome)}
            type="application/pdf"
            className={compacto ? styles.pdfCompacto : `${classe} ${styles.botao}`}
            aria-label={compacto ? `${t('modelos.baixar')}: ${nome} (PDF ${papel})` : undefined}
        >
            <Download size={compacto ? 18 : 20} strokeWidth={2.25} aria-hidden="true" />
            {compacto ? <span>PDF</span> : t('modelos.baixar')}
        </a>
    );
}

export function NotaDoPdf({ codigo, classe = '' }) {
    const { t } = useTranslation();
    return <p className={`${styles.notaPdf} ${classe}`}>{t('modelos.baixarNota', { papel: t(`modelos.papel.${papelDoIdioma(codigo)}`) })}</p>;
}

// A parte que mostra o que o app faz com o mesmo modelo, com os limites reais do plano grátis e do PRO, e leva ao
// app ("Começar grátis": loja no celular, cadastro no computador, src/comecar.js). tipo: 'checklist' | 'diario'.
export function NoApp({ codigo, tipo, id }) {
    const { t } = useTranslation();
    const comecar = useLinkComecar(codigo);
    const chave = tipo === 'diario' ? 'Diario' : 'Checklist';
    const lista = t(`modelos.app.${tipo}`, { returnObjects: true });
    return (
        <section className={styles.noApp} data-painel aria-labelledby={id}>
            <h2 id={id} className={styles.noAppTitulo}>{comDestaque(t(`modelos.app.titulo${chave}`))}</h2>
            <ul className={styles.noAppLista}>
                {(Array.isArray(lista) ? lista : []).map((texto, i) => (
                    <li key={i}>
                        <span className={styles.noAppMarca} aria-hidden="true"><Check size={16} strokeWidth={3} /></span>
                        <span>{texto}</span>
                    </li>
                ))}
            </ul>
            <p className={styles.noAppPlanos}>{t(`modelos.app.planos${chave}`)}</p>
            <div className={styles.noAppAcoes}>
                <a {...comecar} className={`acao ${styles.botao}`}>{t('footer.ctaBtn')}</a>
                <p className={styles.noAppNota}>{t('modelos.app.nota')}</p>
            </div>
        </section>
    );
}

export function Carregando() {
    const { t } = useTranslation();
    return (
        <div className={styles.estado} role="status" aria-live="polite">
            <span className={styles.giro} aria-hidden="true" />
            <p>{t('modelos.carregando')}</p>
        </div>
    );
}

export function Erro({ aoTentarDeNovo }) {
    const { t } = useTranslation();
    useCabecaDaPagina({ semIndexar: true });
    return (
        <div className={styles.estado} role="alert">
            <p>{t('ajuda.erroTitulo')}</p>
            <button type="button" className={`acao-contorno ${styles.botao}`} onClick={aoTentarDeNovo}>
                <RefreshCw size={18} aria-hidden="true" />
                {t('ajuda.tentarDeNovo')}
            </button>
        </div>
    );
}

// Endereço de modelo que não existe neste idioma (nome de outro idioma, modelo renomeado): fora do Google e de volta
// para a lista dos modelos, como as outras páginas inexistentes do site.
export function ParaALista({ para }) {
    useCabecaDaPagina({ semIndexar: true });
    return <Navigate to={para} replace />;
}
