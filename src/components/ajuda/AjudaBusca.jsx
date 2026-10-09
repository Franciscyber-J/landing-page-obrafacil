import { useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { buscar } from '../../ajuda/busca.js';
import IconeModulo from './IconeModulo.jsx';
import styles from './Ajuda.module.css';

// Campo de busca com a lista de resultados embaixo. Setas sobem e descem, Enter abre,
// Esc limpa. compacto: versão menor, usada no topo das páginas de assunto e de artigo.
export default function AjudaBusca({ idioma, indice, preparado, compacto = false, sugestoes = [] }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const id = useId();
    const campo = useRef(null);
    const [consulta, setConsulta] = useState('');
    // -1: nenhum resultado escolhido com as setas (Enter abre o primeiro).
    const [ativo, setAtivo] = useState(-1);
    const [aberto, setAberto] = useState(false);

    const modulos = useMemo(() => new Map(indice.modulos.map((m) => [m.id, m])), [indice]);
    const resultados = useMemo(() => buscar(preparado, consulta, { limite: 8 }), [preparado, consulta]);
    const temConsulta = consulta.trim().length > 0;
    const mostrar = aberto && temConsulta;
    const endereco = (a) => `/ajuda/${idioma}/${a.slug}`;

    const aoDigitar = (e) => {
        setConsulta(e.target.value);
        setAtivo(-1);
        setAberto(true);
    };

    const aoTeclar = (e) => {
        if (e.key === 'ArrowDown' && resultados.length) {
            e.preventDefault();
            setAberto(true);
            setAtivo((n) => (n + 1) % resultados.length);
        } else if (e.key === 'ArrowUp' && resultados.length) {
            e.preventDefault();
            setAtivo((n) => (n <= 0 ? resultados.length - 1 : n - 1));
        } else if (e.key === 'Enter' && mostrar && resultados.length) {
            e.preventDefault();
            navigate(endereco(resultados[Math.max(ativo, 0)]));
        } else if (e.key === 'Escape') {
            if (consulta) setConsulta('');
            setAberto(false);
        }
    };

    const usarSugestao = (texto) => {
        setConsulta(texto);
        setAtivo(-1);
        setAberto(true);
        campo.current?.focus();
    };

    const idLista = `${id}-resultados`;
    return (
        <div className={compacto ? styles.buscaCompacta : styles.buscaGrande}>
            <div
                className={styles.buscaCaixa}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setAberto(false); }}
            >
                <label htmlFor={`${id}-campo`} className={styles.somenteLeitor}>{t('ajuda.buscaRotulo')}</label>
                <div className={styles.buscaCampo}>
                    <Search size={compacto ? 18 : 22} aria-hidden="true" />
                    <input
                        ref={campo}
                        id={`${id}-campo`}
                        type="search"
                        autoComplete="off"
                        spellCheck="false"
                        role="combobox"
                        aria-expanded={mostrar}
                        aria-controls={idLista}
                        aria-autocomplete="list"
                        aria-activedescendant={mostrar && resultados[ativo] ? `${id}-r${ativo}` : undefined}
                        placeholder={t('ajuda.buscaPlaceholder')}
                        value={consulta}
                        onChange={aoDigitar}
                        onFocus={() => setAberto(true)}
                        onKeyDown={aoTeclar}
                    />
                    {consulta && (
                        <button type="button" className={styles.buscaLimpar} onClick={() => { setConsulta(''); campo.current?.focus(); }} aria-label={t('ajuda.buscaLimpar')}>
                            <X size={18} aria-hidden="true" />
                        </button>
                    )}
                </div>
                {mostrar && (
                    <div className={styles.buscaPainel}>
                        {resultados.length > 0 ? (
                            <ul id={idLista} role="listbox" aria-label={t('ajuda.buscaResultados')} className={styles.buscaLista}>
                                {resultados.map((a, i) => (
                                    <li key={a.id} id={`${id}-r${i}`} role="option" aria-selected={i === ativo}>
                                        <Link
                                            to={endereco(a)}
                                            className={`${styles.buscaItem} ${i === ativo ? styles.buscaItemAtivo : ''}`}
                                            onMouseEnter={() => setAtivo(i)}
                                            tabIndex={-1}
                                        >
                                            <span className={styles.iconeCaixaPequena}><IconeModulo nome={modulos.get(a.modulo)?.icone} size={18} /></span>
                                            <span className={styles.buscaItemTexto}>
                                                <span className={styles.buscaItemTitulo}>{a.titulo}</span>
                                                <span className={styles.buscaItemModulo}>{modulos.get(a.modulo)?.nome}</span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p id={idLista} className={styles.buscaVazia} role="status">{t('ajuda.buscaSemResultado', { termo: consulta.trim() })}</p>
                        )}
                    </div>
                )}
            </div>
            {sugestoes.length > 0 && (
                <div className={styles.sugestoes}>
                    <span>{t('ajuda.buscasComuns')}</span>
                    {sugestoes.map((s) => (
                        <button key={s} type="button" className={styles.chip} onClick={() => usarSugestao(s)}>{s}</button>
                    ))}
                </div>
            )}
        </div>
    );
}
