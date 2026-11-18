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
// Número do WhatsApp do suporte. O site lê também o documento configuracoes/suporte_publico (src/atendimento/estado.js): se o
// Francis trocar o número no painel, o site segue o novo sem versão nova; este é o que vale até a leitura.
export const WHATSAPP = '5562992666759';
export const ID_GOOGLE_PLAY = 'com.expertbr.obrafacil';
export const APP_STORE_ID = '6760675010';
// E-mail oficial do suporte (o mesmo da tela Sobre o App do aplicativo).
export const EMAIL_SUPORTE = 'suporte@appobrafacil.expertbr.com';

// Lojas no idioma da página (a loja usa o país da conta da pessoa; o idioma só muda os textos).
export function googlePlay(codigo) {
    return `https://play.google.com/store/apps/details?id=${ID_GOOGLE_PLAY}&hl=${encodeURIComponent(codigo)}`;
}

export function appStore() {
    return `https://apps.apple.com/app/id${APP_STORE_ID}`;
}

// Conversa no WhatsApp do ObraFácil já com a primeira mensagem escrita.
// numero: o do documento configuracoes/suporte_publico, quando já lido (useAtendimento); sem ele, o daqui.
export function linkWhatsApp(mensagem, numero = WHATSAPP) {
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
