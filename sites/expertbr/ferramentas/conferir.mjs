// Conferência do dist do site da ExpertBR (o gerar.mjs roda no fim do build; o teste roda de novo se houver dist).
// Devolve { paginas, problemas }: qualquer problema para o build.
import fs from 'node:fs';
import path from 'node:path';
import { ESCRITAS, IDIOMAS, SITE, absoluto, caminhoInicio } from '../src/idiomas.js';
import { PRODUTOS } from '../src/produtos.js';

// Dados que a empresa não tem (ainda não existe formalmente): nunca podem aparecer nos dados estruturados.
export const CAMPOS_PROIBIDOS = [
    'legalName', 'taxID', 'vatID', 'address', 'telephone', 'foundingDate', 'founder', 'numberOfEmployees',
    'aggregateRating', 'review', 'award', 'duns', 'leiCode', 'iso6523Code', 'offers',
];

const desfazer = (t) => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function arquivoDoEndereco(dist, endereco) {
    const caminho = decodeURI(endereco.split('#')[0].split('?')[0]);
    const partes = caminho.split('/').filter(Boolean);
    if (caminho.endsWith('/')) return path.join(dist, ...partes, 'index.html');
    return path.join(dist, ...partes);
}

function procurarCampos(objeto, achados = []) {
    if (Array.isArray(objeto)) objeto.forEach((o) => procurarCampos(o, achados));
    else if (objeto && typeof objeto === 'object') {
        for (const [chave, valor] of Object.entries(objeto)) {
            if (CAMPOS_PROIBIDOS.includes(chave)) achados.push(chave);
            procurarCampos(valor, achados);
        }
    }
    return achados;
}

export function conferirPagina(dist, codigo, html) {
    const p = [];
    const onde = `/${codigo.toLowerCase()}/`;
    const url = absoluto(caminhoInicio(codigo));
    const idioma = IDIOMAS.find((i) => i.codigo === codigo);
    if (!new RegExp(`<html lang="${codigo}" dir="${idioma.direcao}"`).test(html)) p.push(`${onde}: <html> sem lang="${codigo}" dir="${idioma.direcao}"`);
    const titulo = /<title>([^<]+)<\/title>/.exec(html)?.[1];
    if (!titulo) p.push(`${onde}: sem título`);
    else if (desfazer(titulo).length > 75) p.push(`${onde}: título com ${desfazer(titulo).length} letras (até 75)`);
    const descricao = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
    // Japonês e chinês dizem o mesmo com bem menos letras (cada uma é uma palavra ou sílaba).
    const minimo = ['japonesa', 'chinesaTradicional'].includes(ESCRITAS[codigo]) ? 30 : 70;
    const tamanho = desfazer(descricao).length;
    if (tamanho < minimo || tamanho > 200) p.push(`${onde}: descrição com ${tamanho} letras (de ${minimo} a 200)`);
    const canonicos = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
    if (canonicos.length !== 1 || canonicos[0] !== url) p.push(`${onde}: canonical ${canonicos.join(', ') || 'ausente'} (esperado ${url})`);
    const alternativos = new Map([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
    for (const i of IDIOMAS) if (alternativos.get(i.codigo) !== absoluto(caminhoInicio(i.codigo))) p.push(`${onde}: hreflang ${i.codigo} errado ou ausente`);
    if (alternativos.get('x-default') !== `${SITE}/`) p.push(`${onde}: sem hreflang x-default para a raiz`);
    if (alternativos.size !== IDIOMAS.length + 1) p.push(`${onde}: ${alternativos.size} hreflang (esperado ${IDIOMAS.length + 1})`);
    if (!/<meta property="og:image" content="https:\/\/expertbr\.com\/og\.png"/.test(html)) p.push(`${onde}: sem og:image`);

    const jsonld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
    if (!jsonld) p.push(`${onde}: sem dados estruturados`);
    else {
        try {
            const dados = JSON.parse(jsonld);
            const tipos = (dados['@graph'] ?? []).map((n) => n['@type']);
            for (const tipo of ['Organization', 'WebSite', 'WebPage', 'SoftwareApplication']) {
                if (!tipos.includes(tipo)) p.push(`${onde}: dados estruturados sem ${tipo}`);
            }
            const proibidos = procurarCampos(dados);
            if (proibidos.length) p.push(`${onde}: dados estruturados com dado que a empresa não tem: ${[...new Set(proibidos)].join(', ')}`);
            const apps = (dados['@graph'] ?? []).filter((n) => n['@type'] === 'SoftwareApplication').map((n) => n.name);
            for (const prod of PRODUTOS) {
                const dentro = apps.includes(prod.nome);
                if (prod.estado === 'no-ar' && !dentro) p.push(`${onde}: ${prod.nome} está no ar e falta nos dados estruturados`);
                if (prod.estado !== 'no-ar' && dentro) p.push(`${onde}: ${prod.nome} ainda não foi lançado e está nos dados estruturados`);
            }
        } catch (erro) {
            p.push(`${onde}: dados estruturados não são JSON (${erro.message})`);
        }
    }

    const corpo = html.slice(html.indexOf('<body'));
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(corpo)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
    if (h1.length < 3) p.push(`${onde}: sem título <h1> com texto`);
    const texto = corpo.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
    for (const sobra of ['{{', '}}', 'obrafacil:', 'undefined', 'NaN', '[object Object]']) {
        if (texto.includes(sobra)) p.push(`${onde}: texto com "${sobra}" (chave ou valor que não foi trocado)`);
    }
    // App "em breve": nenhum link para o endereço dele (ainda não existe para o público).
    for (const prod of PRODUTOS.filter((x) => x.estado !== 'no-ar')) {
        if (html.includes(`href="${prod.endereco}`)) p.push(`${onde}: link para ${prod.endereco}, que ainda não foi lançado`);
    }
    for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) {
        if (!m[1].startsWith('/')) p.push(`${onde}: script de outro site: ${m[1]}`);
    }
    // A política de segurança do site (hospedagem/.htaccess) não aceita estilo nem script embutido.
    if (/\sstyle="/.test(html)) p.push(`${onde}: estilo embutido (style="...") que a política de segurança bloqueia`);
    if (/<script(?![^>]*\ssrc=)(?![^>]*type="application\/ld\+json")[^>]*>/.test(html)) p.push(`${onde}: script embutido que a política de segurança bloqueia`);
    for (const m of corpo.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) p.push(`${onde}: imagem sem alt: ${m[0].slice(0, 80)}`);
    // Endereços do próprio site (arquivos e páginas) existem no dist; âncoras existem na página.
    for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
        const endereco = desfazer(m[1]);
        if (endereco.startsWith('/') && !endereco.startsWith('//')) {
            if (!fs.existsSync(arquivoDoEndereco(dist, endereco))) p.push(`${onde}: endereço sem arquivo no dist: ${endereco}`);
        } else if (endereco.startsWith('#')) {
            const id = endereco.slice(1);
            if (id && !html.includes(` id="${id}"`)) p.push(`${onde}: âncora sem destino: ${endereco}`);
        }
    }
    return p;
}

export function conferirDist(dist) {
    const problemas = [];
    let paginas = 0;
    for (const { codigo } of IDIOMAS) {
        const arquivo = arquivoDoEndereco(dist, caminhoInicio(codigo));
        if (!fs.existsSync(arquivo)) {
            problemas.push(`falta a página ${caminhoInicio(codigo)}`);
            continue;
        }
        paginas += 1;
        problemas.push(...conferirPagina(dist, codigo, fs.readFileSync(arquivo, 'utf8')));
    }
    const ler = (nome) => (fs.existsSync(path.join(dist, nome)) ? fs.readFileSync(path.join(dist, nome), 'utf8') : null);
    const sitemap = ler('sitemap.xml');
    if (!sitemap) problemas.push('falta sitemap.xml');
    else {
        const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        if (locs.length !== IDIOMAS.length) problemas.push(`sitemap.xml com ${locs.length} endereço(s) (esperado ${IDIOMAS.length})`);
        for (const i of IDIOMAS) if (!locs.includes(absoluto(caminhoInicio(i.codigo)))) problemas.push(`sitemap.xml sem ${caminhoInicio(i.codigo)}`);
    }
    const robots = ler('robots.txt');
    if (!robots?.includes(`Sitemap: ${SITE}/sitemap.xml`)) problemas.push('robots.txt sem a linha do sitemap');
    if (robots && /Disallow:\s*\/\s*$/m.test(robots)) problemas.push('robots.txt bloqueia o site');
    const llms = ler('llms.txt');
    if (!llms?.startsWith('# ExpertBR')) problemas.push('llms.txt ausente ou sem o título');
    for (const prod of PRODUTOS.filter((x) => x.estado !== 'no-ar')) {
        if (llms?.includes(prod.endereco)) problemas.push(`llms.txt com o endereço de ${prod.nome}, que ainda não foi lançado`);
    }
    if (!fs.existsSync(path.join(dist, 'index.html'))) problemas.push('falta a raiz index.html');
    for (const arquivo of ['tema.js', 'favicon.svg', 'apple-touch-icon.png', 'og.png', 'logo.png']) {
        if (!fs.existsSync(path.join(dist, arquivo))) problemas.push(`falta ${arquivo}`);
    }
    return { paginas, problemas };
}
