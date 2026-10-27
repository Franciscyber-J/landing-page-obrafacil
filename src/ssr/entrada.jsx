// Entrada do build das páginas prontas (vite build --ssr). Desenha uma página do site em HTML, com o mesmo
// App do navegador (StaticRouter no lugar do BrowserRouter), para o ferramentas/paginas/gerar.mjs gravar em dist/.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { RotasDoSite } from '../App.jsx';
import { definirDadosIniciais } from '../dadosIniciais.js';
import i18n from './i18n.js';

// O endereço como o navegador o mostra em location.pathname: letras de outras escritas com %XX
// (/pt-br/ajuda/写真 → /pt-br/ajuda/%E5%86%99%E7%9C%9F). Assim o primeiro desenho do build vê o mesmo endereço
// que o site vê ao "hidratar" a página.
function comoNoNavegador(caminho) {
    return new URL(caminho, 'https://localhost').pathname;
}

// caminho: endereço da página (/pt-br/ajuda/criar-rdo); codigo: idioma dela; dados: o que ela precisa
// (src/dadosIniciais.js). Devolve o HTML do que vai dentro do #root.
export function renderizar({ caminho, codigo, dados = null }) {
    i18n.changeLanguage(codigo);
    if (i18n.language !== codigo) throw new Error(`Idioma ${codigo} não carregou no build`);
    definirDadosIniciais(dados);
    try {
        return renderToString(
            <StrictMode>
                <I18nextProvider i18n={i18n}>
                    <StaticRouter location={comoNoNavegador(caminho)}>
                        <RotasDoSite />
                    </StaticRouter>
                </I18nextProvider>
            </StrictMode>,
        );
    } finally {
        definirDadosIniciais(null);
    }
}

// Tradução fixa num idioma (cabeça das páginas, llms.txt).
export function tradutor(codigo) {
    return i18n.getFixedT(codigo);
}
