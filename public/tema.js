// Tema claro ou escuro antes de a página aparecer (sem piscar): a escolha da pessoa no menu
// ("obrafacil:tema") ou, sem escolha, o tema do aparelho. Arquivo separado para a política de
// segurança do site poder proibir scripts embutidos.
(function () {
  var escolha = null;
  try { escolha = window.localStorage.getItem('obrafacil:tema'); } catch { escolha = null; }
  if (escolha !== 'claro' && escolha !== 'escuro') {
    escolha = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  }
  document.documentElement.setAttribute('data-theme', escolha === 'escuro' ? 'dark' : 'light');
})();
