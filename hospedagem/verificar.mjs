#!/usr/bin/env node
// Confere a segurança e os endereços do site no ar (só faz leituras).
//   node hospedagem/verificar.mjs
//   node hospedagem/verificar.mjs https://outro-endereco.exemplo   (para testar outra cópia)
// Sai com código 1 se alguma conferência falhar.

const BASE = (process.argv[2] ?? 'https://appobrafacil.expertbr.com').replace(/\/$/, '');
const SPA = '<div id="root">';

const conferencias = [
  // O site (React) abre em qualquer endereço dele, inclusive direto pelo link.
  { nome: 'início do site', url: '/', status: 200, contem: SPA },
  { nome: 'link antigo /ajuda', url: '/ajuda', status: 200, contem: SPA },
  { nome: 'artigo pelo link direto', url: '/ajuda/pt-BR/criar-rdo', status: 200, contem: SPA },
  { nome: 'endereço com idioma', url: '/pt-br/ajuda', status: 200, contem: SPA },
  { nome: 'início do idioma (pasta sem index.html)', url: '/pt-br/', status: 200, contem: SPA },
  { nome: 'início de outro idioma', url: '/en-us/', status: 200, contem: SPA },
  { nome: 'endereço em inglês', url: '/en-us/help/topic/projects', status: 200, contem: SPA },
  { nome: 'endereço em espanhol', url: '/es-mx/ayuda/crear-reporte-diario', status: 200, contem: SPA },
  { nome: 'bandeira do menu de idiomas', url: '/bandeiras/br.svg', status: 200, contem: '<svg' },
  // Termos e Política: páginas do site em cada idioma, com o texto já dentro do HTML.
  { nome: 'Termos de Uso (pt-BR)', url: '/pt-br/termos-de-uso/', status: 200, contem: 'id="legal-inicial"' },
  { nome: 'Política de Privacidade (pt-BR)', url: '/pt-br/politica-de-privacidade/', status: 200, contem: 'id="legal-inicial"' },
  { nome: 'Terms of Use (en-US)', url: '/en-us/terms-of-use/', status: 200, contem: 'id="legal-inicial"' },
  { nome: 'Política de Privacidad (es-MX)', url: '/es-mx/politica-de-privacidad/', status: 200, contem: 'id="legal-inicial"' },
  { nome: 'Termos de Utilização (pt-PT)', url: '/pt-pt/termos-de-utilizacao/', status: 200, contem: 'id="legal-inicial"' },
  // Endereços antigos (cadastrados nas lojas): levam à página no idioma do navegador.
  { nome: 'termos antigo, navegador pt-BR', url: '/termos-de-uso/', idioma: 'pt-BR,pt;q=0.9', status: 302, destino: '/pt-br/termos-de-uso' },
  { nome: 'privacidade antiga, navegador pt-BR', url: '/politicas-de-privacidade/', idioma: 'pt-BR', status: 302, destino: '/pt-br/politica-de-privacidade' },
  { nome: 'privacidade antiga, navegador pt-PT', url: '/politicas-de-privacidade/', idioma: 'pt-PT,pt;q=0.8', status: 302, destino: '/pt-pt/politica-de-privacidade' },
  { nome: 'termos antigo, navegador es-AR', url: '/termos-de-uso', idioma: 'es-AR,es;q=0.9', status: 302, destino: '/es-mx/terminos-de-uso' },
  { nome: 'termos antigo, navegador es', url: '/termos-de-uso/', idioma: 'es', status: 302, destino: '/es-es/terminos-de-uso' },
  { nome: 'privacidade antiga, navegador en-GB', url: '/politicas-de-privacidade/', idioma: 'en-GB,en;q=0.9', status: 302, destino: '/en-gb/privacy-policy' },
  { nome: 'privacidade antiga, navegador de-DE', url: '/politicas-de-privacidade/', idioma: 'de-DE', status: 302, destino: '/en-us/privacy-policy' },
  { nome: 'privacidade antiga, sem idioma', url: '/politicas-de-privacidade/', status: 302, destino: '/en-us/privacy-policy' },
  // O WordPress continua servindo as páginas que o app usa.
  { nome: 'Suporte (WordPress)', url: '/suporte/', status: 200, naoContem: SPA },
  { nome: 'login do WordPress continua abrindo', url: '/wp-login.php', status: 200 },
  // O que não pode mais aparecer.
  { nome: 'lista de usuários pela API', url: '/wp-json/wp/v2/users', status: [401, 403] },
  { nome: 'lista de usuários com cookie falso', url: '/wp-json/wp/v2/users', cookie: 'wordpress_logged_in_x=1', status: [401, 403] },
  { nome: 'lista de usuários por rest_route', url: '/?rest_route=%2Fwp%2Fv2%2Fusers', status: [401, 403] },
  { nome: 'usuário por ?author=1', url: '/?author=1', status: [301, 302, 403], naoContem: 'author' },
  { nome: 'xmlrpc.php', url: '/xmlrpc.php', status: 403 },
  { nome: 'readme.html (versão)', url: '/readme.html', status: 403 },
  { nome: 'license.txt (versão)', url: '/license.txt', status: 403 },
  { nome: 'wp-config.php', url: '/wp-config.php', status: 403 },
  { nome: 'mapa de usuários do WordPress', url: '/wp-sitemap-users-1.xml', status: [403, 404, 301, 302] },
];

const CABECALHOS = [
  ['strict-transport-security', /max-age=\d{7,}/],
  ['x-content-type-options', /^nosniff$/i],
  ['x-frame-options', /^sameorigin$/i],
  ['referrer-policy', /strict-origin-when-cross-origin/],
  ['permissions-policy', /camera=\(\)/],
];

let falhas = 0;
function linha(ok, texto) {
  if (!ok) falhas++;
  console.log(`${ok ? 'OK   ' : 'FALHA'}  ${texto}`);
}

async function pedir(caminho, cookie, idioma) {
  const resposta = await fetch(BASE + caminho, {
    redirect: 'manual',
    headers: {
      'User-Agent': 'ObraFacil-verificacao/1.0',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(idioma ? { 'Accept-Language': idioma } : {}),
    },
  });
  const corpo = await resposta.text();
  return { status: resposta.status, corpo, cabecalhos: resposta.headers };
}

console.log(`Conferindo ${BASE}\n`);
for (const c of conferencias) {
  try {
    const r = await pedir(c.url, c.cookie, c.idioma);
    const esperado = Array.isArray(c.status) ? c.status : [c.status];
    let ok = esperado.includes(r.status);
    let detalhe = `HTTP ${r.status}`;
    if (ok && c.contem && !r.corpo.includes(c.contem)) { ok = false; detalhe += ', conteúdo errado'; }
    if (ok && c.naoContem && r.status === 200 && r.corpo.includes(c.naoContem)) { ok = false; detalhe += ', conteúdo errado'; }
    if (c.destino) {
      const para = new URL(r.cabecalhos.get('location') ?? '', BASE).pathname;
      detalhe += ` para ${para}`;
      if (ok && para !== c.destino) { ok = false; detalhe += `, esperado ${c.destino}`; }
    }
    linha(ok, `${c.nome.padEnd(42)} ${c.url}  (${detalhe}; esperado ${esperado.join(' ou ')})`);
  } catch (e) {
    linha(false, `${c.nome.padEnd(42)} ${c.url}  (erro: ${e.message})`);
  }
}

console.log('');
for (const [pagina, caminho] of [['site', '/'], ['Termos', '/pt-br/termos-de-uso/'], ['WordPress', '/suporte/']]) {
  const r = await pedir(caminho);
  for (const [nome, regra] of CABECALHOS) {
    const valor = r.cabecalhos.get(nome);
    linha(Boolean(valor && regra.test(valor)), `cabeçalho ${nome.padEnd(28)} (${pagina}): ${valor ?? 'ausente'}`);
  }
  const poweredBy = r.cabecalhos.get('x-powered-by');
  linha(!poweredBy, `cabeçalho x-powered-by escondido          (${pagina}): ${poweredBy ?? 'ausente'}`);
  if (pagina === 'WordPress') {
    linha(!/name="generator" content="WordPress/i.test(r.corpo), 'versão do WordPress fora do HTML (meta generator)');
  }
}

console.log(`\n${falhas ? `${falhas} conferência(s) falharam.` : 'Tudo certo.'}`);
process.exit(falhas ? 1 : 0);
