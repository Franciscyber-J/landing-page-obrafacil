// Endereços de fora do site (app, lojas, WhatsApp). Num lugar só para não ficarem espalhados.
export const APP = 'https://obrafacilapp.expertbr.com';
export const CADASTRO = `${APP}/cadastro`;
export const LOGIN = `${APP}/login`;
export const ASSINAR_MENSAL = `${APP}/cadastro?checkout=true`;
export const ASSINAR_ANUAL = `${APP}/cadastro?checkout=anual`;
export const WINDOWS = 'https://appobrafacil.expertbr.com/download/Instalador_ObraFacil_Windows.exe';
export const WHATSAPP = '5562992666759';
export const SUPORTE = 'https://appobrafacil.expertbr.com/suporte/';

// Lojas no idioma da página (a loja usa o país da conta da pessoa; o idioma só muda os textos).
export function googlePlay(codigo) {
    return `https://play.google.com/store/apps/details?id=com.expertbr.obrafacil&hl=${encodeURIComponent(codigo)}`;
}

export function appStore() {
    return 'https://apps.apple.com/app/id6760675010';
}

// Conversa no WhatsApp do ObraFácil já com a primeira mensagem escrita.
export function linkWhatsApp(mensagem) {
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}
