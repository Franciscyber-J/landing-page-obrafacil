// Tag do Google (Google Ads e Google Analytics 4) com o modo de consentimento do Google: a tag carrega, mas não grava
// cookies nem identifica a pessoa até ela aceitar no aviso de cookies do site
// (src/components/AvisoCookies.jsx). A escolha fica no navegador ("obrafacil:cookies").
// Arquivo separado (e não um <script> dentro do index.html) para a política de segurança do site
// poder proibir scripts embutidos.
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;
var escolhaCookies = null;
try { escolhaCookies = window.localStorage.getItem('obrafacil:cookies'); } catch { escolhaCookies = null; }
gtag('consent', 'default', {
  ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
  wait_for_update: 500,
});
if (escolhaCookies === 'aceito') {
  gtag('consent', 'update', {
    ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted',
  });
}
gtag('set', 'ads_data_redaction', escolhaCookies !== 'aceito');
gtag('js', new Date());
gtag('config', 'AW-18200904302');
// Google Analytics 4: preencher com o código de medição (G-...) quando a propriedade for criada.
// Vazio = o Analytics não é carregado. A Política de Privacidade 2.0 já cita o Analytics.
var MEDICAO_GA4 = '';
if (MEDICAO_GA4) gtag('config', MEDICAO_GA4);
