// O print do passo em cada largura da tela (src/ajuda/larguras.js): o de celular e, quando o passo tem, o da largura
// média e o de computador, cada um no aparelho em que foi tirado (celular, dobrável ou notebook) e com a marcação
// medida nele. Todos vão no HTML, cada um marcado com as larguras em que aparece (data-celular, data-media,
// data-computador), e o CSS mostra só o da largura da tela (Ajuda.module.css, .printNaFaixa). Por isso a página pronta
// e o site no navegador desenham a mesma coisa em qualquer tela (sem erro de hidratação), o Google lê o de celular, e
// o navegador baixa só a imagem que aparece: as outras ficam escondidas (display: none) e com loading="lazy", e
// imagem preguiçosa que não aparece não é baixada.
import PrintComMarcacao from './PrintComMarcacao.jsx';
import MolduraDoCelular from './MolduraDoCelular.jsx';
import MolduraDoNotebook from './MolduraDoNotebook.jsx';
import { APARELHO_DA_FAIXA, PROPORCAO_DA_FAIXA } from '../../ajuda/larguras.js';
import styles from './Ajuda.module.css';

export default function PrintDoPasso({ versoes, alt }) {
    return versoes.map((v) => {
        const aparelho = APARELHO_DA_FAIXA[v.faixa];
        const print = (
            <PrintComMarcacao
                key={v.endereco}
                src={v.endereco}
                alt={alt}
                marcacao={v.marcacao}
                proporcao={PROPORCAO_DA_FAIXA[v.faixa]}
            />
        );
        return (
            <div
                key={v.faixa}
                className={aparelho === 'computador' ? `${styles.printNaFaixa} ${styles.printLargo}` : styles.printNaFaixa}
                data-celular={v.faixas.includes('celular') ? '' : undefined}
                data-media={v.faixas.includes('media') ? '' : undefined}
                data-computador={v.faixas.includes('computador') ? '' : undefined}
            >
                {aparelho === 'computador'
                    ? <MolduraDoNotebook>{print}</MolduraDoNotebook>
                    : <MolduraDoCelular aparelho={aparelho}>{print}</MolduraDoCelular>}
            </div>
        );
    });
}
