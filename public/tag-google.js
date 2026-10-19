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

// Cliques que contam como conversão: todo link com data-conversao (src/comecar.js e os botões das lojas e do PRO).
// Vão como eventos para o Google Ads e, com o código acima preenchido, para o Analytics:
// - "comecar_gratis" (cadastro no navegador ou loja aberta pelo botão; parâmetro "destino");
// - "assinar_pro" (parâmetro "plano": mensal ou anual).
// Para o Google Ads contar como conversão, criar no Ads uma conversão do tipo "site" com o nome "Clique para
// começar grátis" (é um clique de intenção, não o cadastro feito), contagem "Uma", e colar abaixo o rótulo dela
// (a parte depois da barra em "AW-18200904302/xxxxxxxx"). Vazio = só o evento, sem conversão.
var ROTULO_CONVERSAO_CADASTRO = '';
var ROTULO_CONVERSAO_ASSINATURA = '';
var conversoesEnviadas = {};
document.addEventListener('click', function (evento) {
  var alvo = evento.target && evento.target.closest ? evento.target.closest('[data-conversao]') : null;
  if (!alvo) return;
  var tipo = alvo.getAttribute('data-conversao');
  var assinatura = tipo.indexOf('assinar_') === 0;
  gtag('event', assinatura ? 'assinar_pro' : 'comecar_gratis', assinatura
    ? { plano: tipo.slice(8), transport_type: 'beacon' }
    : { destino: tipo, transport_type: 'beacon' });
  // A conversão do Ads conta uma vez por página aberta (dois toques ou loja + cadastro não viram duas).
  var rotulo = assinatura ? ROTULO_CONVERSAO_ASSINATURA : ROTULO_CONVERSAO_CADASTRO;
  if (rotulo && !conversoesEnviadas[rotulo]) {
    conversoesEnviadas[rotulo] = true;
    gtag('event', 'conversion', { send_to: 'AW-18200904302/' + rotulo, transport_type: 'beacon' });
  }
}, true);
