#!/usr/bin/env node
// Confere o site no ar (só faz leituras): endereços, redirecionamentos, páginas prontas para o Google e os
// buscadores com IA, robots.txt, sitemap.xml, llms.txt e cabeçalhos de segurança.
//   node hospedagem/verificar.mjs
//   node hospedagem/verificar.mjs https://outro-endereco.exemplo   (para testar outra cópia)
// Sai com código 1 se alguma conferência falhar.

import { IDIOMAS, caminhoAjuda, caminhoInicio, caminhoLegal, caminhoPagamento, caminhoPerfil } from '../src/i18n/idiomas.js';
import {
  ARTIGOS_RETIRADOS, ASSUNTOS_RENOMEADOS, caminhoDoAssuntoAntigo, caminhoDoAssuntoNovo, caminhosDoArtigoRetirado,
} from '../src/ajuda/antigos.js';

const SITE = 'https://appobrafacil.expertbr.com';
// Os idiomas de antes da 2.0 têm conferências próprias abaixo; os outros, a página inicial e os Termos de cada um.
const IDIOMAS_DE_ANTES = ['pt-BR', 'pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX'];
const NOVOS = IDIOMAS.map((i) => i.codigo).filter((c) => !IDIOMAS_DE_ANTES.includes(c));
const BASE = (process.argv[2] ?? SITE).replace(/\/$/, '');
const PRONTA = '<div id="root" data-pronta>';
const CASCA = '<div id="root"></div>';

let falhas = 0;
function linha(ok, texto) {
  if (!ok) falhas++;
  console.log(`${ok ? 'OK   ' : 'FALHA'}  ${texto}`);
}

async function pedir(caminho, { idioma, metodo = 'GET' } = {}) {
  const resposta = await fetch(BASE + caminho, {
    method: metodo,
    redirect: 'manual',
    // Sem idioma = como os robôs (o Google não manda Accept-Language). O fetch do Node mandaria "*" sozinho.
    headers: { 'User-Agent': 'ObraFacil-verificacao/2.0', 'Accept-Language': idioma ?? '' },
  });
  const corpo = metodo === 'GET' ? await resposta.text() : '';
  const destino = resposta.headers.get('location');
  return { status: resposta.status, corpo, cabecalhos: resposta.headers, destino: destino ? new URL(destino, BASE) : null };
}

// Endereço do sitemap/canonical (sempre o do site no ar) → mesmo caminho na cópia conferida.
const naCopia = (url) => url.replace(SITE, BASE);
const caminhoDe = (url) => { const u = new URL(url); return u.pathname + u.search; };

function canonical(html) {
  return /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? null;
}

function jsonLdValido(html) {
  const blocos = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (!blocos.length) return false;
  try {
    return blocos.every((b) => JSON.parse(b[1])['@context'] === 'https://schema.org');
  } catch {
    return false;
  }
}

// Página pronta: 200, conteúdo no HTML, canonical absoluto igual ao próprio endereço, hreflang com x-default,
// dados estruturados válidos e um título (h1) visível sem JavaScript.
async function paginaPronta(nome, caminho, { semIndexar = false } = {}) {
  try {
    const r = await pedir(caminho);
    const problemas = [];
    if (r.status !== 200) problemas.push(`HTTP ${r.status}`);
    if (!r.corpo.includes(PRONTA)) problemas.push('sem o conteúdo pronto');
    const c = canonical(r.corpo);
    if (c !== `${SITE}${caminho}`) problemas.push(`canonical ${c}`);
    if (!/hreflang="x-default"/.test(r.corpo)) problemas.push('sem hreflang x-default');
    if (!jsonLdValido(r.corpo)) problemas.push('JSON-LD ausente ou inválido');
    if (!/<h1[\s>]/.test(r.corpo)) problemas.push('sem <h1>');
    const noindex = /<meta name="robots" content="noindex/.test(r.corpo);
    if (noindex !== semIndexar) problemas.push(semIndexar ? 'sem noindex' : 'com noindex');
    linha(!problemas.length, `${nome.padEnd(44)} ${caminho}  (${problemas.join(', ') || 'pronta'})`);
  } catch (e) {
    linha(false, `${nome.padEnd(44)} ${caminho}  (erro: ${e.message})`);
  }
}

// Redirecionamento: status esperado e destino (caminho + consulta) exatos.
async function redireciona(nome, caminho, status, destino, idioma) {
  try {
    const r = await pedir(caminho, { idioma });
    const para = r.destino ? r.destino.pathname + r.destino.search : '(nenhum)';
    const ok = r.status === status && para === destino;
    linha(ok, `${nome.padEnd(44)} ${caminho}${idioma ? ` [${idioma}]` : ''}  (HTTP ${r.status} para ${para}; esperado ${status} para ${destino})`);
    return r;
  } catch (e) {
    linha(false, `${nome.padEnd(44)} ${caminho}  (erro: ${e.message})`);
    return null;
  }
}

async function abre(nome, caminho, contem) {
  try {
    const r = await pedir(caminho);
    linha(r.status === 200 && r.corpo.includes(contem), `${nome.padEnd(44)} ${caminho}  (HTTP ${r.status})`);
    return r;
  } catch (e) {
    linha(false, `${nome.padEnd(44)} ${caminho}  (erro: ${e.message})`);
    return null;
  }
}

console.log(`Conferindo ${BASE}\n`);

console.log('Raiz: 302 para o idioma do navegador (sem idioma conhecido, inglês)');
await redireciona('raiz, navegador pt-BR', '/', 302, '/pt-br/', 'pt-BR,pt;q=0.9');
await redireciona('raiz, navegador es-AR', '/', 302, '/es-mx/', 'es-AR,es;q=0.9');
await redireciona('raiz, navegador de-DE (idioma do site)', '/', 302, '/de-de/', 'de-DE,de;q=0.9,pt;q=0.8');
await redireciona('raiz, navegador sv-SE com português depois', '/', 302, '/pt-br/', 'sv-SE,sv;q=0.9,pt;q=0.8');
await redireciona('raiz, navegador pt-AO', '/', 302, '/pt-pt/', 'pt-AO');
await redireciona('raiz, navegador en-NZ', '/', 302, '/en-au/', 'en-NZ,en;q=0.9');
await redireciona('raiz, sem idioma (robôs)', '/', 302, '/en-us/');
const raiz = await pedir('/', { idioma: 'pt-BR' });
linha(/accept-language/i.test(raiz.cabecalhos.get('vary') ?? ''), `raiz avisa que varia com o idioma          (Vary: ${raiz.cabecalhos.get('vary') ?? 'ausente'})`);

console.log('\nUm endereço só para cada página (301)');
await redireciona('index.html da raiz', '/index.html', 301, '/');
await redireciona('index.html do idioma', '/pt-br/index.html', 301, '/pt-br/');
await redireciona('arquivo .html da página pronta', '/pt-br/ajuda.html', 301, '/pt-br/ajuda');
await redireciona('idioma em maiúsculas', '/PT-BR/', 301, '/pt-br/');
await redireciona('idioma em maiúsculas com página', '/EN-US/help', 301, '/en-us/help');
await redireciona('página inicial sem barra', '/pt-br', 301, '/pt-br/');
await redireciona('barra no fim', '/pt-br/ajuda/', 301, '/pt-br/ajuda');
await redireciona('barra no fim (Termos, pasta antiga)', '/pt-br/termos-de-uso/', 301, '/pt-br/termos-de-uso');
await redireciona('barra no fim mantém a consulta', '/en-us/help/?utm_source=teste', 301, '/en-us/help?utm_source=teste');

console.log('\nPáginas prontas (texto no HTML, canonical, hreflang, dados estruturados)');
for (const [nome, caminho] of [
  ['início pt-BR', '/pt-br/'], ['início pt-PT', '/pt-pt/'], ['início en-US', '/en-us/'], ['início en-GB', '/en-gb/'],
  ['início en-AU', '/en-au/'], ['início en-CA', '/en-ca/'], ['início es-ES', '/es-es/'], ['início es-MX', '/es-mx/'],
  ['Central pt-BR', '/pt-br/ajuda'], ['Central en-US', '/en-us/help'], ['Central es-ES', '/es-es/ayuda'],
  ['assunto en-US', '/en-us/help/topic/daily-reports'],
  ['artigo pt-BR', '/pt-br/ajuda/criar-rdo'], ['artigo en-GB', '/en-gb/help/create-daily-report'],
  ['artigo es-MX', '/es-mx/ayuda/crear-informe-diario'],
  ['Termos pt-BR', '/pt-br/termos-de-uso'], ['Política pt-BR', '/pt-br/politica-de-privacidade'],
  ['Terms en-US', '/en-us/terms-of-use'], ['Termos pt-PT', '/pt-pt/termos-de-utilizacao'],
  ['Política es-MX', '/es-mx/politica-de-privacidad'],
  ['Suporte pt-BR', '/pt-br/suporte'], ['Suporte es-ES', '/es-es/soporte'],
  ...NOVOS.flatMap((c) => [
    [`início ${c}`, caminhoInicio(c)], [`Termos ${c}`, encodeURI(caminhoLegal(c, 'termos'))], [`Central ${c}`, encodeURI(caminhoAjuda(c))],
  ]),
]) await paginaPronta(nome, caminho);
// Direção da escrita na Central de cada idioma (árabe e hebraico da direita para a esquerda).
for (const { codigo, direcao = 'ltr' } of IDIOMAS) {
  try {
    const r = await pedir(encodeURI(caminhoAjuda(codigo)));
    const dir = /<html[^>]*\bdir="(rtl|ltr)"/.exec(r.corpo)?.[1] ?? 'ltr';
    linha(dir === direcao, `direção da escrita ${codigo.padEnd(25)} ${caminhoAjuda(codigo)}  (dir=${dir}; esperado ${direcao})`);
  } catch (e) {
    linha(false, `direção da escrita ${codigo}  (erro: ${e.message})`);
  }
}
await paginaPronta('volta do pagamento (noindex)', '/pt-br/pagamento-confirmado/pro', { semIndexar: true });
await paginaPronta('Perfil (noindex)', '/en-us/profile', { semIndexar: true });
await abre('artigo publicado depois do build abre o site', '/pt-br/ajuda/artigo-publicado-depois-do-build', CASCA);
await abre('bandeira do menu de idiomas', '/bandeiras/br.svg', '<svg');

console.log('\nArquivos que não podem sair do ar');
for (const [nome, caminho, tipo, metodo] of [
  ['logo dos e-mails do app', '/email/logo-obrafacil.png', /^image\/png/, 'GET'],
  ['instalador do Windows', '/download/Instalador_ObraFacil_Windows.exe', /./, 'HEAD'],
]) {
  try {
    const r = await pedir(caminho, { metodo });
    const conteudo = r.cabecalhos.get('content-type') ?? '';
    linha(r.status === 200 && tipo.test(conteudo), `${nome.padEnd(44)} ${caminho}  (HTTP ${r.status}, ${conteudo || 'sem tipo'})`);
  } catch (e) {
    linha(false, `${nome.padEnd(44)} ${caminho}  (erro: ${e.message})`);
  }
}
const wp = await pedir('/wp-login.php');
linha(wp.status === 404, `WordPress desligado                           /wp-login.php  (HTTP ${wp.status}; esperado 404)`);

console.log('\nEndereços antigos do WordPress (lojas, Stripe, e-mails): 301 para o idioma do navegador (sem idioma, pt-BR; idioma fora do site, inglês)');
await redireciona('termos antigo, navegador pt-BR', '/termos-de-uso/', 301, '/pt-br/termos-de-uso', 'pt-BR,pt;q=0.9');
await redireciona('privacidade antiga, navegador pt-PT', '/politicas-de-privacidade/', 301, '/pt-pt/politica-de-privacidade', 'pt-PT,pt;q=0.8');
await redireciona('termos antigo, navegador es-AR', '/termos-de-uso', 301, '/es-mx/terminos-de-uso', 'es-AR,es;q=0.9');
await redireciona('termos antigo, navegador es', '/termos-de-uso/', 301, '/es-es/terminos-de-uso', 'es');
await redireciona('privacidade antiga, navegador en-GB', '/politicas-de-privacidade/', 301, '/en-gb/privacy-policy', 'en-GB,en;q=0.9');
await redireciona('privacidade antiga, sem idioma (robôs)', '/politicas-de-privacidade/', 301, '/pt-br/politica-de-privacidade');
await redireciona('privacidade antiga, navegador de-DE', '/politicas-de-privacidade/', 301, '/de-de/datenschutz', 'de-DE,de;q=0.9');
await redireciona('privacidade antiga, navegador sv-SE (sem o idioma no site)', '/politicas-de-privacidade/', 301, '/en-us/privacy-policy', 'sv-SE,sv;q=0.9');
await redireciona('termos antigo, navegador "*"', '/termos-de-uso/', 301, '/en-us/terms-of-use', '*');
await redireciona('Perfil, navegador fr-FR', '/perfil', 301, '/fr-fr/profil', 'fr-FR');
await redireciona('termos antigo em maiúsculas', '/Termos-De-Uso/', 301, '/pt-br/termos-de-uso');
const PAGAMENTO = [
  ['volta do PRO pago pelo site', '/primeiros-passos', '/pt-br/pagamento-confirmado/pro'],
  ['volta do Acesso Cliente', '/pagamento-ok', '/pt-br/pagamento-confirmado/acesso-cliente'],
  ['volta dos downloads extras', '/pacote-downloads-extras', '/pt-br/pagamento-confirmado/downloads-extras'],
  ['volta da expansão de +20 GB', '/expansao-20gb-ok', '/pt-br/pagamento-confirmado/mais-20-gb'],
  ['Perfil (e-mails de cobrança)', '/perfil', '/pt-br/perfil'],
  ['Suporte', '/suporte', '/pt-br/suporte'],
];
for (const [nome, antigo, novo] of PAGAMENTO) {
  await redireciona(nome, antigo, 301, novo);
  await redireciona(`${nome} com barra`, `${antigo}/`, 301, novo);
  await paginaPronta(`${nome}: a página abre`, novo, { semIndexar: !novo.endsWith('/suporte') });
}
await redireciona('volta do pagamento descarta o ?session_id', '/pagamento-ok/?session_id=cs_test_verificacao', 301, '/pt-br/pagamento-confirmado/acesso-cliente');
await redireciona('volta do pagamento, navegador en-US', '/primeiros-passos', 301, '/en-us/payment-confirmed/pro', 'en-US,en;q=0.9');
await redireciona('Perfil, navegador es-MX', '/perfil', 301, '/es-mx/perfil', 'es-MX');
await redireciona('Suporte mantém o ?utm_', '/suporte/?utm_source=teste', 301, '/pt-br/suporte?utm_source=teste');
const antigo = await pedir('/termos-de-uso/', { idioma: 'en-US' });
linha(/accept-language/i.test(antigo.cabecalhos.get('vary') ?? '') && /no-cache|no-store/.test(antigo.cabecalhos.get('cache-control') ?? ''),
  `antigo não fica guardado com um idioma só  (Vary: ${antigo.cabecalhos.get('vary') ?? 'ausente'}; Cache-Control: ${antigo.cabecalhos.get('cache-control') ?? 'ausente'})`);
await redireciona('Central antiga', '/ajuda', 301, '/pt-br/ajuda');
await redireciona('Central antiga, navegador en-GB', '/ajuda', 301, '/en-gb/help', 'en-GB');
await redireciona('artigo antigo com idioma', '/ajuda/pt-BR/criar-rdo', 301, '/pt-br/ajuda/criar-rdo');
await redireciona('artigo antigo em inglês', '/ajuda/en-US/create-daily-report', 301, '/en-us/help/create-daily-report');

// Removido de vez: 410, com o site no corpo (ErrorDocument 410), que leva ao início da Central do idioma.
async function removido(nome, caminho) {
  try {
    const r = await pedir(caminho);
    linha(r.status === 410 && r.corpo.includes(CASCA), `${nome.padEnd(44)} ${caminho}  (HTTP ${r.status}${r.corpo.includes(CASCA) ? ', abre o site' : ', sem o site no corpo'}; esperado 410 com o site)`);
  } catch (e) {
    linha(false, `${nome.padEnd(44)} ${caminho}  (erro: ${e.message})`);
  }
}

console.log('\nCentral: assunto com nome novo (301) e artigos que ficaram só no pt-BR (410), src/ajuda/antigos.js');
for (const a of ASSUNTOS_RENOMEADOS) {
  await redireciona(`assunto renomeado ${a.idioma}`, encodeURI(caminhoDoAssuntoAntigo(a)), 301, encodeURI(caminhoDoAssuntoNovo(a)));
  await paginaPronta(`assunto novo ${a.idioma}`, encodeURI(caminhoDoAssuntoNovo(a)));
}
for (const a of ARTIGOS_RETIRADOS) {
  for (const c of caminhosDoArtigoRetirado(a)) await removido(`só no pt-BR: ${a.id} (${a.idioma})`, encodeURI(c));
}
// No pt-BR os artigos continuam (pelo id, o site leva ao endereço do artigo): nada de 410 ali.
for (const id of [...new Set(ARTIGOS_RETIRADOS.map((a) => a.id))]) {
  try {
    const r = await pedir(`/pt-br/ajuda/${id}`);
    linha(r.status === 200, `${`continua no pt-BR: ${id}`.padEnd(44)} /pt-br/ajuda/${id}  (HTTP ${r.status}; esperado 200)`);
  } catch (e) {
    linha(false, `continua no pt-BR: ${id}  (erro: ${e.message})`);
  }
}

console.log('\nrobots.txt, sitemap.xml e llms.txt');
const robots = await pedir('/robots.txt');
linha(robots.status === 200 && /text\/plain/.test(robots.cabecalhos.get('content-type') ?? ''), `robots.txt abre como texto                    (HTTP ${robots.status})`);
linha(robots.corpo.includes(`Sitemap: ${SITE}/sitemap.xml`), 'robots.txt aponta o sitemap (endereço absoluto)');
for (const robo of ['Googlebot', 'Google-Extended', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot']) {
  linha(new RegExp(`User-agent: ${robo}\\nAllow: /`).test(robots.corpo), `robots.txt libera ${robo}`);
}
linha(!/^Disallow: \/\s*$/m.test(robots.corpo), 'robots.txt não bloqueia o site inteiro');

// sitemap.xml é o índice; os endereços ficam num sitemap por idioma (sitemap-pt-br.xml...).
const sitemap = await pedir('/sitemap.xml');
linha(sitemap.status === 200 && /xml/.test(sitemap.cabecalhos.get('content-type') ?? ''), `sitemap.xml abre como XML                     (HTTP ${sitemap.status})`);
linha(/<sitemapindex /.test(sitemap.corpo), 'sitemap.xml é o índice dos sitemaps de cada idioma');
const filhos = [...sitemap.corpo.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
linha(filhos.length === IDIOMAS.length, `sitemap.xml aponta um sitemap por idioma      (${filhos.length} de ${IDIOMAS.length})`);
const locs = [];
let comHreflang = 0;
for (const filho of filhos) {
  const caminho = caminhoDe(naCopia(filho));
  try {
    const r = await pedir(caminho);
    const doFilho = [...r.corpo.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    locs.push(...doFilho);
    if (/hreflang="x-default"/.test(r.corpo) && /xmlns:xhtml=/.test(r.corpo)) comHreflang++;
    const prefixo = /sitemap-([a-z]{2}-[a-z]{2})\.xml$/.exec(filho)?.[1];
    const ok = r.status === 200 && /xml/.test(r.cabecalhos.get('content-type') ?? '') && /no-cache/.test(r.cabecalhos.get('cache-control') ?? '')
      && doFilho.length > 0 && doFilho.every((l) => l.startsWith(`${SITE}/${prefixo}/`));
    linha(ok, `${caminho.padEnd(44)} (HTTP ${r.status}, ${doFilho.length} endereços, ${r.cabecalhos.get('cache-control') ?? 'sem Cache-Control'})`);
  } catch (e) {
    linha(false, `${caminho}  (erro: ${e.message})`);
  }
}
linha(locs.length >= IDIOMAS.length * 5, `sitemaps com as páginas dos ${IDIOMAS.length} idiomas      (${locs.length} endereços)`);
linha(new Set(locs).size === locs.length, 'sitemaps sem endereço repetido');
linha(comHreflang === filhos.length, `sitemaps com as versões de cada idioma (hreflang)  (${comHreflang} de ${filhos.length})`);
const removidos = new Set(ARTIGOS_RETIRADOS.flatMap((a) => caminhosDoArtigoRetirado(a)).concat(ASSUNTOS_RENOMEADOS.map(caminhoDoAssuntoAntigo)).map((c) => `${SITE}${encodeURI(c)}`));
linha(!locs.some((l) => removidos.has(l)), 'sitemaps sem os endereços antigos da Central (301 e 410)');
linha(locs.some((l) => /\/ajuda\/[^/]+$/.test(l)), 'sitemaps com os artigos da Central');
const semIndexar = IDIOMAS.flatMap(({ codigo }) => [caminhoPagamento(codigo, null), caminhoPerfil(codigo)]).map((c) => `${SITE}${encodeURI(c)}`);
linha(!locs.some((l) => semIndexar.some((c) => l === c || l.startsWith(`${c}/`))), 'sitemaps sem a volta do pagamento e o Perfil');
// Amostra: endereços espalhados pelo sitemap abrem prontos, com o canonical igual ao endereço.
const passo = Math.max(1, Math.floor(locs.length / 12));
for (let i = 0; i < locs.length; i += passo) {
  const caminho = caminhoDe(naCopia(locs[i]));
  try {
    const r = await pedir(caminho);
    const c = canonical(r.corpo);
    linha(r.status === 200 && r.corpo.includes(PRONTA) && c === locs[i], `sitemap: ${caminho}  (HTTP ${r.status}, canonical ${c === locs[i] ? 'igual' : c})`);
  } catch (e) {
    linha(false, `sitemap: ${caminho}  (erro: ${e.message})`);
  }
}

const llms = await pedir('/llms.txt');
linha(llms.status === 200 && /text\/plain/.test(llms.cabecalhos.get('content-type') ?? '') && /utf-8/i.test(llms.cabecalhos.get('content-type') ?? ''),
  `llms.txt abre como texto UTF-8                 (${llms.cabecalhos.get('content-type') ?? 'sem tipo'})`);
linha(llms.corpo.startsWith('# ObraFácil') && llms.corpo.includes(`${SITE}/pt-br/`) && llms.corpo.includes(`${SITE}/en-us/`), 'llms.txt com o resumo e as páginas em inglês e português');

console.log('\nCabeçalhos de segurança');
const CABECALHOS = [
  ['strict-transport-security', /max-age=\d{7,}/],
  ['x-content-type-options', /^nosniff$/i],
  ['x-frame-options', /^sameorigin$/i],
  ['referrer-policy', /strict-origin-when-cross-origin/],
  ['permissions-policy', /camera=\(\)/],
];
for (const [pagina, caminho] of [['início', '/pt-br/'], ['artigo', '/pt-br/ajuda/criar-rdo'], ['Termos', '/pt-br/termos-de-uso'], ['site no navegador', '/pt-br/ajuda/artigo-publicado-depois-do-build']]) {
  const r = await pedir(caminho);
  for (const [nome, regra] of CABECALHOS) {
    const valor = r.cabecalhos.get(nome);
    linha(Boolean(valor && regra.test(valor)), `cabeçalho ${nome.padEnd(28)} (${pagina}): ${valor ?? 'ausente'}`);
  }
  linha(/no-cache/.test(r.cabecalhos.get('cache-control') ?? ''), `página sem cache longo                         (${pagina}): ${r.cabecalhos.get('cache-control') ?? 'ausente'}`);
  linha(!r.cabecalhos.get('x-powered-by'), `cabeçalho x-powered-by escondido               (${pagina})`);
  // A Hostinger acrescenta a própria "Content-Security-Policy: upgrade-insecure-requests" (forçar HTTPS), e a nossa
  // política vai em "Content-Security-Policy-Report-Only" até ser ativada (.htaccess). Vale a que tiver
  // default-src 'self', em qualquer um dos dois cabeçalhos.
  const cspAplicada = r.cabecalhos.get('content-security-policy') ?? '';
  const cspRelatorio = r.cabecalhos.get('content-security-policy-report-only') ?? '';
  const cspNossa = [cspAplicada, cspRelatorio].find((valor) => /default-src 'self'/.test(valor));
  const situacaoCsp = !cspNossa ? 'ausente' : cspNossa === cspAplicada ? 'aplicada' : 'em modo de relatório';
  linha(Boolean(cspNossa), `política de conteúdo (CSP)                     (${pagina}): ${situacaoCsp}`);
}

// Fontes dos PDFs do app: o app web (outro endereço) só baixa com a liberação de origem.
console.log('\nFontes dos PDFs do app');
{
  const fonte = '/fontes/pdf/NotoSansArabic-Regular.ec12005718f7.ttf';
  const r = await pedir(fonte, { metodo: 'HEAD' });
  linha(r.status === 200, `fonte publicada: HTTP ${r.status}`);
  linha(r.cabecalhos.get('access-control-allow-origin') === '*', `liberação de origem (CORS): ${r.cabecalhos.get('access-control-allow-origin') ?? 'ausente'}`);
  linha(/immutable/.test(r.cabecalhos.get('cache-control') ?? ''), `cache longo: ${r.cabecalhos.get('cache-control') ?? 'ausente'}`);
}

// Índice da Central (dados/ajuda/<idioma>.<código>.json): o site lê ao abrir uma página pronta; não é página.
console.log('\nÍndice da Central (arquivo de dados)');
{
  const pagina = await pedir('/pt-br/ajuda');
  const endereco = /"indice":"(\/dados\/ajuda\/[^"]+\.json)"/.exec(pagina.corpo ?? '')?.[1] ?? null;
  linha(Boolean(endereco), `a página /pt-br/ajuda aponta o índice: ${endereco ?? 'não achado'}`);
  if (endereco) {
    const r = await pedir(endereco, { metodo: 'HEAD' });
    linha(r.status === 200, `índice publicado: HTTP ${r.status}`);
    linha(/immutable/.test(r.cabecalhos.get('cache-control') ?? ''), `cache longo: ${r.cabecalhos.get('cache-control') ?? 'ausente'}`);
    linha(/noindex/.test(r.cabecalhos.get('x-robots-tag') ?? ''), `fora do Google (X-Robots-Tag): ${r.cabecalhos.get('x-robots-tag') ?? 'ausente'}`);
  }
}

console.log(`\n${falhas ? `${falhas} conferência(s) falharam.` : 'Tudo certo.'}`);
process.exit(falhas ? 1 : 0);
