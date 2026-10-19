// Endereço de um arquivo da pasta public/. No site é "/arquivo"; na prévia (build com base "./",
// ver vite.config.js) vira relativo, para funcionar fora da raiz do domínio.
export function publico(caminho) {
    return `${import.meta.env.BASE_URL}${String(caminho).replace(/^\//, '')}`;
}
