// Moldura de notebook em volta do print de computador (a largura a partir de 1024 px; src/ajuda/larguras.js): a tampa
// escura com a borda fina e a câmera no alto, a tela com o print e a base mais larga que a tampa, com o recorte de
// abrir no meio. Sem faixa de status (o app no computador não tem a do sistema por cima). O app desenha o mesmo
// notebook (gestao_obras lib/ajuda/widgets/moldura_do_celular.dart, AparelhoDaMoldura.computador): mudou lá, muda aqui.
// Tudo o que é da moldura é enfeite (aria-hidden): para o leitor de tela existe só o texto alternativo do print.
import styles from './Ajuda.module.css';

export default function MolduraDoNotebook({ children }) {
    return (
        <figure className={styles.notebook}>
            <div className={styles.notebookTampa}>
                <span className={styles.notebookCamera} aria-hidden="true" />
                <div className={styles.notebookTela}>{children}</div>
            </div>
            <div className={styles.notebookBase} aria-hidden="true">
                <span className={styles.notebookRecorte} />
            </div>
        </figure>
    );
}
