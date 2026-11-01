// Endereços de fora do site (app, lojas, WhatsApp). Num lugar só para não ficarem espalhados.
export const APP = 'https://obrafacilapp.expertbr.com';
// Os links do app web levam o idioma da página (?idioma=fr-FR): o app abre nele, se a pessoa ainda não escolheu
// outro no aparelho (lib/utils/idioma_do_endereco.dart no gestao_obras).
const comIdioma = (caminho, codigo) => `${APP}${caminho}${caminho.includes('?') ? '&' : '?'}idioma=${encodeURIComponent(codigo)}`;
export const cadastro = (codigo) => comIdioma('/cadastro', codigo);
export const login = (codigo) => comIdioma('/login', codigo);
export const assinarMensal = (codigo) => comIdioma('/cadastro?checkout=true', codigo);
export const assinarAnual = (codigo) => comIdioma('/cadastro?checkout=anual', codigo);
export const WINDOWS = 'https://appobrafacil.expertbr.com/download/Instalador_ObraFacil_Windows.exe';
export const WHATSAPP = '5562992666759';
// E-mail oficial do suporte (o mesmo da tela Sobre o App do aplicativo).
export const EMAIL_SUPORTE = 'suporte@appobrafacil.expertbr.com';

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
