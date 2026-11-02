// Endereços da Central de Ajuda que já estiveram no ar e deixaram de existir. Fonte única para:
//   - o .htaccess (npm run htaccess, ferramentas/hospedagem/htaccess.mjs): 301 do assunto renomeado e 410 do artigo
//     retirado, que é o que o Google entende;
//   - o site no navegador (acharModulo e AjudaArtigo): o mesmo destino, para quem chega sem passar pelo servidor;
//   - o build (ferramentas/paginas/gerar.mjs, conferirEnderecosAntigos): para se a lista não bater com o que foi
//     publicado (assunto com nome novo diferente do daqui, artigo retirado que voltou, endereço antigo que virou
//     página de novo);
//   - o verificador do site no ar (hospedagem/verificar.mjs).
//
// Assunto renomeado: 301 para o endereço novo do mesmo assunto, no mesmo idioma (é a mesma página, com outro nome).
// Artigo retirado de um idioma: 410 (removido de vez, sem página equivalente nesse idioma). O Google tira o endereço
// do índice mais depressa que com 404, e não trata como "soft 404" (o que acontece com um 301 para uma página que não
// fala do mesmo assunto, como o início da Central). Quem abre o endereço vê o site (o .htaccess entrega o index.html
// com o 410) e vai para o início da Central do idioma.
//
// Só entram endereços que estiveram no ar (sitemap publicado). Ao renomear um assunto ou tirar um artigo de um
// idioma já publicado, acrescente aqui, rode npm run htaccess e envie o .htaccess junto com o site.

import { caminhoArtigo, caminhoAssunto } from '../i18n/idiomas.js';

// Assunto (módulo) com nome novo no endereço. novo: o nome do módulo no endereço (slugDoModulo) depois da mudança.
export const ASSUNTOS_RENOMEADOS = Object.freeze([
    // 02/11/2026: o módulo de cálculos perdeu a estimativa pelo CUB fora do pt-BR; "Calculators and estimates" virou
    // "Calculators" (gestao_obras, commit dc82fd28). O pt-BR continua "Calculadoras e estimativas".
    ...['pt-PT', 'es-ES', 'es-MX'].map((idioma) => ({
        idioma, modulo: 'calculos',
        antigo: idioma === 'pt-PT' ? 'calculadoras-e-estimativas' : 'calculadoras-y-estimaciones',
        novo: 'calculadoras',
    })),
    ...['en-US', 'en-GB', 'en-AU', 'en-CA'].map((idioma) => ({
        idioma, modulo: 'calculos', antigo: 'calculators-and-estimates', novo: 'calculators',
    })),
    // 02/11/2026: no espanhol da Espanha, "Reportes diarios" virou "Partes diarios" (gestao_obras, commit 94b25e3c).
    { idioma: 'es-ES', modulo: 'diario-de-obra', antigo: 'reportes-diarios', novo: 'partes-diarios' },
]);

// Artigos que passaram a existir só no pt-BR (ferramentas só do Brasil: CUB e cronograma automático, 02/11/2026,
// gestao_obras commit 94b25e3c), com o endereço (slug) que tinham em cada idioma já publicado.
const SLUGS_DOS_RETIRADOS = {
    'estimativa-cub': { 'pt-PT': 'estimativa-cub', en: 'cub-cost-estimate', es: 'estimacion-cub' },
    'o-que-e-o-cub': { 'pt-PT': 'o-que-e-o-cub', en: 'what-is-cub', es: 'que-es-el-cub' },
    'detalhamento-de-custos': { 'pt-PT': 'detalhamento-de-custos', en: 'cub-cost-breakdown', es: 'detalle-de-costos' },
    'pdf-da-estimativa': { 'pt-PT': 'pdf-da-estimativa-cub', en: 'cub-estimate-pdf', es: 'pdf-de-la-estimacion-cub' },
    'cronograma-automatico': { 'pt-PT': 'cronograma-automatico', en: 'automatic-schedule', es: 'cronograma-automatico' },
    'da-estimativa-a-obra': { 'pt-PT': 'da-estimativa-cub-a-obra', en: 'from-cub-estimate-to-project', es: 'de-la-estimacion-cub-a-la-obra' },
    'cub-nao-aparece': { 'pt-PT': 'cub-nao-aparece', en: 'cub-calculator-missing', es: 'calculadora-cub-no-aparece' },
};
const IDIOMAS_DOS_RETIRADOS = ['pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX'];

// [{ idioma, id, enderecos: [slug antigo, id] }]: o slug que esteve no ar e o id (o site aceitava o id no endereço).
export const ARTIGOS_RETIRADOS = Object.freeze(Object.entries(SLUGS_DOS_RETIRADOS).flatMap(([id, slugs]) => (
    IDIOMAS_DOS_RETIRADOS.map((idioma) => {
        const slug = slugs[idioma] ?? slugs[idioma.split('-')[0]];
        return Object.freeze({ idioma, id, enderecos: Object.freeze([...new Set([slug, id])]) });
    })
)));

// Ids dos artigos retirados de algum idioma (para o site reconhecer o id também nos idiomas que nunca o tiveram).
const IDS_RETIRADOS = new Set(Object.keys(SLUGS_DOS_RETIRADOS));

// Assunto renomeado pelo endereço antigo: { modulo, novo } ou null.
export function assuntoRenomeado(idiomaConteudo, parte) {
    const achado = ASSUNTOS_RENOMEADOS.find((a) => a.idioma === idiomaConteudo && a.antigo === parte);
    return achado ? { modulo: achado.modulo, novo: achado.novo } : null;
}

// O endereço é de um artigo que saiu deste idioma? Vale o slug que esteve no ar e o id, em qualquer idioma que não
// tenha o artigo (quem chama confere antes que o endereço não é de um artigo que existe).
export function artigoRetirado(idiomaConteudo, parte) {
    if (IDS_RETIRADOS.has(parte)) return true;
    return ARTIGOS_RETIRADOS.some((a) => a.idioma === idiomaConteudo && a.enderecos.includes(parte));
}

// Endereço antigo no site (o idioma do site é o mesmo dos artigos: os 7 idiomas daqui têm os artigos próprios).
export const caminhoDoAssuntoAntigo = (a) => caminhoAssunto(a.idioma, a.antigo);
export const caminhoDoAssuntoNovo = (a) => caminhoAssunto(a.idioma, a.novo);
export const caminhosDoArtigoRetirado = (a) => a.enderecos.map((e) => caminhoArtigo(a.idioma, e));

// Conferência do build. indices: { <idioma>: índice publicado }; caminhos: Set dos caminhos das páginas geradas;
// slugDoModulo(modulo, idioma) de src/ajuda/enderecos.js. Devolve a lista de problemas (vazia = tudo certo).
export function conferirEnderecosAntigos({ indices, caminhos, slugDoModulo }) {
    const problemas = [];
    for (const a of ASSUNTOS_RENOMEADOS) {
        const indice = indices[a.idioma];
        if (!indice) continue;
        const modulo = indice.modulos.find((m) => m.id === a.modulo);
        if (!modulo) {
            problemas.push(`assunto renomeado ${a.idioma} ${a.antigo}: o módulo ${a.modulo} não está publicado (src/ajuda/antigos.js)`);
            continue;
        }
        const atual = slugDoModulo(modulo, a.idioma);
        if (atual !== a.novo) {
            problemas.push(`assunto renomeado ${a.idioma} ${a.antigo}: o endereço publicado é "${atual}", não "${a.novo}"; corrija src/ajuda/antigos.js e rode npm run htaccess`);
        }
        if (!caminhos.has(caminhoDoAssuntoNovo(a))) {
            problemas.push(`assunto renomeado ${a.idioma} ${a.antigo}: o endereço novo ${caminhoDoAssuntoNovo(a)} não tem página`);
        }
        if (caminhos.has(caminhoDoAssuntoAntigo(a))) {
            problemas.push(`assunto renomeado ${a.idioma} ${a.antigo}: o endereço antigo voltou a ser uma página`);
        }
    }
    for (const a of ARTIGOS_RETIRADOS) {
        const indice = indices[a.idioma];
        if (!indice) continue;
        if (indice.artigos.some((e) => e.id === a.id)) {
            problemas.push(`artigo retirado ${a.idioma} ${a.id}: voltou a ser publicado neste idioma; tire-o de src/ajuda/antigos.js e rode npm run htaccess`);
        }
        for (const caminho of caminhosDoArtigoRetirado(a)) {
            if (caminhos.has(caminho)) {
                problemas.push(`artigo retirado ${a.idioma} ${a.id}: ${caminho} é uma página que existe (o 410 a tiraria do ar)`);
            }
        }
    }
    return problemas;
}
