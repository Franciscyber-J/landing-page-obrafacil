// O site no Firebase: o ÚNICO lugar para preencher o que o Francis cria no console (passo a passo em
// src/atendimento/LEIAME.md, "Ligar a conversa"). Tudo aqui é configuração PÚBLICA de aplicativo web (vai para o
// navegador de qualquer visitante e não é segredo); nenhuma chave de servidor entra no site.
//
// Enquanto `recaptchaEnterprise` ou `appId` estiverem vazios, a conversa com o Max fica DESLIGADA: o botão "Fale com a
// gente" não aparece em nenhum grupo de países e o site mostra o WhatsApp, como antes. Assim o site nunca chama o
// servidor sem o App Check.

export const SITE_NO_FIREBASE = Object.freeze({
    // Chave própria do site, "Site ObraFácil (navegador)" (criada em 18/11/2026): só aceita pedidos de
    // https://appobrafacil.expertbr.com/* e só as APIs do login (Identity Toolkit e Token Service) e do App Check
    // (LEIAME.md, "Chave de API do site").
    apiKey: 'AIzaSyBeNZVFFYtwpQ5iADTC_YqPO4lgyziLKyg',
    authDomain: 'gestao-obras-app-8342c.firebaseapp.com',
    projectId: 'gestao-obras-app-8342c',
    messagingSenderId: '1030083935852',
    // ID do app web "Site ObraFácil" no Firebase (Configurações do projeto > Seus apps), ex.: '1:1030083935852:web:…'.
    appId: '1:1030083935852:web:5263820e011dcf60ac2249',
    // Chave do reCAPTCHA Enterprise do site (Google Cloud > Segurança > reCAPTCHA), registrada no App Check desse app.
    recaptchaEnterprise: '6LcvUCcuAAAAAMZs1Q8IEasWBhmHDdp0ozxtYlnM',
});

// Região das functions do app (contrato, item 3).
export const REGIAO = 'us-central1';

// Servidor simulado só no "npm run dev" com VITE_ATENDIMENTO_SIMULADO=sim (a expressão inteira é trocada pelo Vite; no
// build ela vira false e o simulado nem entra no pacote). Nos testes do Node não existe import.meta.env.
export const SIMULADO = typeof import.meta.env !== 'undefined'
    && import.meta.env.DEV && import.meta.env.VITE_ATENDIMENTO_SIMULADO === 'sim';

// A conversa só existe com o App Check do site preenchido (ou no simulado do desenvolvimento).
export function conversaLigada(config = SITE_NO_FIREBASE) {
    return SIMULADO || Boolean(config.appId && config.recaptchaEnterprise);
}
