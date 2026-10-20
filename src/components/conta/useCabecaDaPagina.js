import { useEffect } from 'react';

// Título da aba, descrição da página e, nas páginas que não devem aparecer no Google (volta do pagamento e
// Perfil), <meta name="robots" content="noindex">. Tudo volta ao que era quando a página sai da tela.
export default function useCabecaDaPagina({ titulo, descricao, semIndexar = false }) {
    useEffect(() => {
        const tituloAnterior = document.title;
        if (titulo) document.title = titulo;
        const meta = document.querySelector('meta[name="description"]');
        const descricaoAnterior = meta?.getAttribute('content') ?? null;
        if (meta && descricao) meta.setAttribute('content', descricao);
        let robots = null;
        if (semIndexar) {
            robots = document.createElement('meta');
            robots.setAttribute('name', 'robots');
            robots.setAttribute('content', 'noindex');
            document.head.appendChild(robots);
        }
        return () => {
            document.title = tituloAnterior;
            if (meta && descricaoAnterior !== null) meta.setAttribute('content', descricaoAnterior);
            robots?.remove();
        };
    }, [titulo, descricao, semIndexar]);
}
