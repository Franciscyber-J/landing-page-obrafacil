// Para onde vai o "Começar grátis" (decisão do Francis em 19/10/2026): no celular, a loja do próprio aparelho,
// porque é dentro do app que ficam o primeiro uso, os avisos e a oferta do PRO; no computador, o cadastro no
// navegador. Cada link leva também o nome da conversão que o public/tag-google.js mede no clique.
import { CADASTRO, appStore, googlePlay } from './links.js';

// 'android', 'ios' ou 'outro'. O iPad com iPadOS se apresenta como Mac: a tela de toque denuncia.
export function aparelho(nav = typeof navigator === 'undefined' ? null : navigator) {
    if (!nav) return 'outro';
    const agente = String(nav.userAgent || '');
    if (/android/i.test(agente)) return 'android';
    if (/iphone|ipad|ipod/i.test(agente)) return 'ios';
    if (/macintosh/i.test(agente) && Number(nav.maxTouchPoints) > 1) return 'ios';
    return 'outro';
}

// Atributos do link "Começar grátis" para o idioma da página: { href, 'data-conversao' }.
export function linkComecar(codigo, nav) {
    const tipo = aparelho(nav);
    if (tipo === 'android') return { href: googlePlay(codigo), 'data-conversao': 'loja_android' };
    if (tipo === 'ios') return { href: appStore(), 'data-conversao': 'loja_ios' };
    return { href: CADASTRO, 'data-conversao': 'cadastro' };
}
