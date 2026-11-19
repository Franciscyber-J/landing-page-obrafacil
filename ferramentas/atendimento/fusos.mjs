// Gera src/atendimento/fusos.js: o país (ISO 3166, 2 letras) de cada fuso horário da IANA, para o site saber o país do
// visitante pelo fuso do navegador, sem localizar pela internet (src/atendimento/LEIAME.md).
//
// Fonte: o banco de fusos da IANA instalado no computador (zone.tab: um fuso → um país; tzdata.zi: os nomes antigos,
// como Asia/Calcutta e Europe/Kiev, que alguns navegadores ainda devolvem). Fusos sem país (Etc/UTC, GMT, Etc/GMT+3)
// ficam de fora: para eles o site usa a região do idioma do navegador e, na dúvida, o grupo "os dois".
//
// Uso (Linux ou WSL, com o pacote tzdata):  node ferramentas/atendimento/fusos.mjs [pasta do zoneinfo]
// Rode de novo quando sair versão nova do tzdata com país ou fuso novo (é raro; o arquivo diz a versão usada).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PASTA = process.argv[2] ?? '/usr/share/zoneinfo';
const DESTINO = fileURLToPath(new URL('../../src/atendimento/fusos.js', import.meta.url));

const zoneTab = readFileSync(join(PASTA, 'zone.tab'), 'utf8');
const zi = readFileSync(join(PASTA, 'tzdata.zi'), 'utf8');
const versao = /^# version (\S+)/m.exec(zi)?.[1] ?? 'desconhecida';

const paisDoFuso = new Map();
for (const linha of zoneTab.split('\n')) {
    if (!linha || linha.startsWith('#')) continue;
    const [pais, , fuso] = linha.split('\t');
    if (/^[A-Z]{2}$/.test(pais) && fuso) paisDoFuso.set(fuso, pais);
}

// Nomes antigos (L <fuso de hoje> <nome antigo>): o país do fuso de hoje. Só nomes com região ("Asia/...", "US/...").
for (const linha of zi.split('\n')) {
    const m = /^L (\S+) (\S+)$/.exec(linha);
    if (!m) continue;
    const [, alvo, antigo] = m;
    if (paisDoFuso.has(antigo) || !antigo.includes('/') || antigo.startsWith('Etc/')) continue;
    const pais = paisDoFuso.get(alvo);
    if (pais) paisDoFuso.set(antigo, pais);
}

const porPais = new Map();
for (const [fuso, pais] of [...paisDoFuso].sort(([a], [b]) => a.localeCompare(b))) {
    if (!porPais.has(pais)) porPais.set(pais, []);
    porPais.get(pais).push(fuso);
}

const linhas = [...porPais].sort(([a], [b]) => a.localeCompare(b)).map(([pais, fusos]) => `    ${pais}: '${fusos.join(' ')}',`);

const saida = `// GERADO por ferramentas/atendimento/fusos.mjs (banco de fusos da IANA ${versao}). Não edite à mão.
// País (ISO 3166, 2 letras) → fusos horários da IANA daquele país, com os nomes antigos que alguns navegadores ainda
// devolvem. Baixado só depois de a página abrir (src/atendimento/estado.js), para o site saber o grupo de atendimento.
const PAISES = {
${linhas.join('\n')}
};

let mapa = null;

// Fuso → país, ou null (fuso sem país, como Etc/UTC, ou desconhecido).
export function paisDoFuso(fuso) {
    if (!mapa) {
        mapa = new Map();
        for (const [pais, fusos] of Object.entries(PAISES)) for (const f of fusos.split(' ')) mapa.set(f, pais);
    }
    return typeof fuso === 'string' ? mapa.get(fuso) ?? null : null;
}
`;

writeFileSync(DESTINO, saida);
console.log(`${paisDoFuso.size} fusos, ${porPais.size} países (tzdata ${versao}) → src/atendimento/fusos.js`);
