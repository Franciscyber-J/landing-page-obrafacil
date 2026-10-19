// Escolha de cookies da pessoa (fica no navegador) e o modo de consentimento do Google.
// A tag (public/tag-google.js) já começa sem gravar nada; aqui só se muda depois da escolha.

const CHAVE = 'obrafacil:cookies';
export const EVENTO_ABRIR = 'obrafacil:cookies-abrir';

export function lerEscolha() {
    try {
        return window.localStorage.getItem(CHAVE);
    } catch {
        return null;
    }
}

export function aplicarEscolha(aceito) {
    try {
        window.localStorage.setItem(CHAVE, aceito ? 'aceito' : 'recusado');
    } catch {
        // sem permissão para guardar: vale só nesta visita
    }
    const valor = aceito ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
            ad_storage: valor, ad_user_data: valor, ad_personalization: valor, analytics_storage: valor,
        });
        window.gtag('set', 'ads_data_redaction', !aceito);
    }
}

// Reabre o aviso (link "Cookies" do rodapé).
export function abrirAvisoCookies() {
    window.dispatchEvent(new Event(EVENTO_ABRIR));
}
