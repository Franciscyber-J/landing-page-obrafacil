// sitemap.xml (com as versões em cada idioma, xhtml:link hreflang) e robots.txt, gerados no build.

import { SITE, absoluto } from './paginas.js';

function escaparXml(texto) {
    return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Data no formato que o sitemap aceita (W3C), ou null se não der para ler.
export function dataDoSitemap(valor) {
    if (!valor) return null;
    const ms = typeof valor === 'number' ? valor : Date.parse(valor);
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

// entradas: [{ url (absoluto), lastmod, alternativos: [{ hreflang, href }] }]
export function gerarSitemap(entradas) {
    const vistos = new Set();
    const linhas = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ];
    for (const e of entradas) {
        if (vistos.has(e.url)) throw new Error(`Endereço repetido no sitemap: ${e.url}`);
        vistos.add(e.url);
        linhas.push('  <url>', `    <loc>${escaparXml(e.url)}</loc>`);
        const data = dataDoSitemap(e.lastmod);
        if (data) linhas.push(`    <lastmod>${data}</lastmod>`);
        for (const a of e.alternativos) {
            linhas.push(`    <xhtml:link rel="alternate" hreflang="${escaparXml(a.hreflang)}" href="${escaparXml(a.href)}" />`);
        }
        linhas.push('  </url>');
    }
    linhas.push('</urlset>', '');
    return linhas.join('\n');
}

// Robôs que buscam ou citam páginas (Google, Bing e os buscadores com IA). Todos podem ler tudo o que é público:
// as únicas páginas que não devem aparecer (volta do pagamento e Perfil) têm "noindex" na própria página, e o
// robô precisa poder abri-las para ver esse aviso. Nada é bloqueado aqui; arquivos do site (assets/, dados/)
// também ficam liberados, porque o Google precisa deles para ver a página como a pessoa vê.
export const ROBOS = [
    'Googlebot', 'Google-Extended', 'Bingbot',
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
    'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
    'PerplexityBot', 'Perplexity-User',
];

export function gerarRobots() {
    const linhas = [
        `# ${SITE}`,
        '# Gerado no build (ferramentas/paginas/gerar.mjs). Todo o site público pode ser lido e citado.',
        '',
    ];
    for (const robo of ROBOS) linhas.push(`User-agent: ${robo}`, 'Allow: /', '');
    linhas.push('User-agent: *', 'Allow: /', '', `Sitemap: ${absoluto('/sitemap.xml')}`, '');
    return linhas.join('\n');
}
