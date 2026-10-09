import { useEffect } from 'react';

// Título da aba e descrição da página (para quem compartilha o link e para o Google).
export default function useTituloDaPagina(titulo, descricao) {
    useEffect(() => {
        const anterior = document.title;
        if (titulo) document.title = titulo;
        const meta = document.querySelector('meta[name="description"]');
        const descricaoAnterior = meta?.getAttribute('content') ?? null;
        if (meta && descricao) meta.setAttribute('content', descricao);
        return () => {
            document.title = anterior;
            if (meta && descricaoAnterior !== null) meta.setAttribute('content', descricaoAnterior);
        };
    }, [titulo, descricao]);
}
