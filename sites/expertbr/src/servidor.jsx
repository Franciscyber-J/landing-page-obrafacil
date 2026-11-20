// Entrada do build das páginas prontas (vite build --ssr): desenha cada página em HTML para o
// ferramentas/gerar.mjs gravar em dist/. React só aqui, no build.
import { renderToStaticMarkup } from 'react-dom/server';
import Pagina, { Raiz } from './Pagina.jsx';
import { tradutor } from './i18n.js';
import { cabecaDaPagina, etiquetasDaCabeca, llms, robots, sitemap } from './seo.js';

export { cabecaDaPagina, etiquetasDaCabeca, llms, robots, sitemap, tradutor };

export function desenharPagina(codigo) {
    return renderToStaticMarkup(<Pagina t={tradutor(codigo)} codigo={codigo} />);
}

export function desenharRaiz() {
    return renderToStaticMarkup(<Raiz />);
}
