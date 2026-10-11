import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { lerTexto } from '../../ajuda/texto.js';

// Mostra o texto de um passo como elementos React (nunca como HTML).
// enderecoDoArtigo(id) devolve o endereço do artigo citado, ou null se ele não existe
// neste idioma (aí o texto do link aparece sem link).
function Pedacos({ pedacos, enderecoDoArtigo }) {
    return pedacos.map((p, i) => {
        let conteudo = p.texto;
        if (p.tipo === 'link') {
            const destino = enderecoDoArtigo(p.id);
            if (destino) conteudo = <Link to={destino}>{p.texto}</Link>;
        }
        return p.negrito ? <strong key={i}>{conteudo}</strong> : <Fragment key={i}>{conteudo}</Fragment>;
    });
}

export default function TextoDoPasso({ texto, enderecoDoArtigo, classeParagrafo, classeLista }) {
    return lerTexto(texto).map((bloco, i) =>
        bloco.tipo === 'lista' ? (
            <ul key={i} className={classeLista}>
                {bloco.itens.map((item, j) => (
                    <li key={j}><Pedacos pedacos={item} enderecoDoArtigo={enderecoDoArtigo} /></li>
                ))}
            </ul>
        ) : (
            <p key={i} className={classeParagrafo}>
                <Pedacos pedacos={bloco.pedacos} enderecoDoArtigo={enderecoDoArtigo} />
            </p>
        ),
    );
}
