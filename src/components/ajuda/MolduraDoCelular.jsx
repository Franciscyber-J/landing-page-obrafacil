// Moldura de celular em volta do print do passo (src/ajuda/moldura.js): corpo do aparelho, faixa de status
// desenhada (hora, câmera e ícones) e barra de gestos. O print fica inteiro entre as duas faixas: a moldura nunca
// cobre a tela do app, e a marcação animada continua medindo só o print.
// Tudo o que é da moldura é enfeite (aria-hidden): para o leitor de tela existe só o texto alternativo do print.
// O primeiro desenho (build e hidratação) é sempre o estilo "furo"; o do aparelho de quem abre entra logo depois.
import { useSyncExternalStore } from 'react';
import { HORA_DA_MOLDURA, estiloDaMoldura } from '../../ajuda/moldura.js';
import styles from './Ajuda.module.css';

const semMudanca = () => () => {};

// Sinal, Wi-Fi e bateria: desenho genérico, igual nos dois estilos.
function IconesDeStatus() {
    return (
        <svg className={styles.celularIcones} viewBox="0 0 44 12" focusable="false">
            <path d="M1 9h2v3H1zM4.5 7h2v5h-2zM8 4.5h2V12H8zM11.5 2h2v10h-2z" />
            <path d="M22 11.6 16.6 5a8.4 8.4 0 0 1 10.8 0z" />
            <path d="M30.5 2.2h9.2a1.6 1.6 0 0 1 1.6 1.6v4.4a1.6 1.6 0 0 1-1.6 1.6h-9.2a1.6 1.6 0 0 1-1.6-1.6V3.8a1.6 1.6 0 0 1 1.6-1.6zm11.6 2.3h.6a.7.7 0 0 1 .7.7v1.6a.7.7 0 0 1-.7.7h-.6z" />
        </svg>
    );
}

export default function MolduraDoCelular({ children }) {
    const estilo = useSyncExternalStore(semMudanca, () => estiloDaMoldura(), () => 'furo');
    return (
        <figure className={styles.celular} data-moldura={estilo}>
            <div className={styles.celularTela}>
                <div className={styles.celularTopo} aria-hidden="true" dir="ltr">
                    <span className={styles.celularHora}>{HORA_DA_MOLDURA}</span>
                    <span className={styles.celularCamera} />
                    <IconesDeStatus />
                </div>
                {children}
                <div className={styles.celularBase} aria-hidden="true">
                    <span className={styles.celularGestos} />
                </div>
            </div>
        </figure>
    );
}
