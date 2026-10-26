#!/usr/bin/env node
// Ferramenta dos idiomas do site. Mesma ideia do gen_locale_arbs.py do app: um lugar para
// cadastrar o idioma, textos-base completos, variantes só com o que muda e uma lista de pendências.
//
//   npm run idiomas                        confere tudo e refaz src/i18n/textos/PENDENCIAS.md
//   npm run idiomas -- novo fr-FR          cria o arquivo de textos e o pacote para tradução
//   npm run idiomas -- exportar fr-FR      (re)gera ferramentas/idiomas/a-traduzir/fr-FR.json
//          [--de pt-BR]                    idioma de origem do pacote (padrão: inglês, ou a base da variante)
//          [--tudo]                        inclui os textos já traduzidos (para revisar)
//   npm run idiomas -- importar fr-FR      junta o pacote traduzido em src/i18n/textos/fr-FR.json
//
// Erros (param o build): chave que não existe no pt-BR, placeholder {{x}} diferente, texto vazio,
// tipo diferente (lista × texto), cadastro inválido. Pendências (não param): textos que faltam
// traduzir; enquanto faltar, o site mostra o texto do próximo idioma da cadeia.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PASTA_TEXTOS = path.join(RAIZ, 'src', 'i18n', 'textos');
const PASTA_PACOTES = path.join(RAIZ, 'ferramentas', 'idiomas', 'a-traduzir');
const ARQUIVO_PENDENCIAS = path.join(PASTA_TEXTOS, 'PENDENCIAS.md');
const PASTA_BANDEIRAS = path.join(RAIZ, 'node_modules', 'flag-icons', 'flags', '4x3');

const importar = (rel) => import(pathToFileURL(path.join(RAIZ, rel)).href);
const { IDIOMAS, REFERENCIA, INTERNACIONAL, SECOES, cadeia, idioma, palavraDeEnderecoValida } = await importar('src/i18n/idiomas.js');
const { APPLE_PRICES } = await importar('src/i18n/pricing.js');

const CATEGORIAS = ['zero', 'one', 'two', 'few', 'many', 'other'];
const SUFIXO_PLURAL = new RegExp(`^(.*)_(${CATEGORIAS.join('|')})$`);
// Palavras dos endereços (rotas do cadastro): na escrita do idioma, pela mesma regra do slug dos artigos
// (palavraDeEnderecoValida, em src/i18n/idiomas.js).
const PARECE_PREFIXO = /^[a-z]{2}(-[a-z]{2})?$/;

// ---------- Utilidades ----------

function achatar(obj, prefixo = '', saida = new Map()) {
    for (const [k, v] of Object.entries(obj)) {
        const chave = prefixo ? `${prefixo}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) achatar(v, chave, saida);
        else saida.set(chave, v);
    }
    return saida;
}

// Monta o objeto aninhado na ordem das chaves do pt-BR (chaves fora dele vão para o fim).
function montar(mapa, ordem) {
    const chaves = [...mapa.keys()].sort((a, b) => posicao(ordem, a) - posicao(ordem, b));
    const saida = {};
    for (const chave of chaves) {
        const partes = chave.split('.');
        let alvo = saida;
        for (const p of partes.slice(0, -1)) alvo = alvo[p] ??= {};
        alvo[partes[partes.length - 1]] = mapa.get(chave);
    }
    return saida;
}

function posicao(ordem, chave) {
    if (ordem.has(chave)) return ordem.get(chave);
    const m = chave.match(SUFIXO_PLURAL);
    if (m) {
        for (const c of CATEGORIAS) if (ordem.has(`${m[1]}_${c}`)) return ordem.get(`${m[1]}_${c}`) + CATEGORIAS.indexOf(m[2]) / 10;
    }
    return Number.MAX_SAFE_INTEGER;
}

function placeholders(valor) {
    const textos = Array.isArray(valor) ? valor : [valor];
    const nomes = new Set();
    for (const t of textos) {
        for (const m of String(t).matchAll(/\{\{\s*([^,}\s]+)[^}]*\}\}/g)) nomes.add(m[1]);
    }
    return [...nomes].sort().join(',');
}

function categoriasDe(codigo) {
    try {
        return new Intl.PluralRules(codigo).resolvedOptions().pluralCategories;
    } catch {
        return ['one', 'other'];
    }
}

function lerJson(arquivo) {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
}

function gravarJson(arquivo, dados) {
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo, `${JSON.stringify(dados, null, 4)}\n`);
}

const arquivoDe = (codigo) => path.join(PASTA_TEXTOS, `${codigo}.json`);

// ---------- Leitura ----------

function carregarTextos(erros) {
    const textos = new Map();
    for (const nome of fs.readdirSync(PASTA_TEXTOS).filter((n) => n.endsWith('.json'))) {
        const codigo = nome.replace(/\.json$/, '');
        try {
            textos.set(codigo, achatar(lerJson(path.join(PASTA_TEXTOS, nome))));
        } catch (e) {
            erros.push(`textos/${nome}: JSON inválido (${e.message})`);
            textos.set(codigo, new Map());
        }
    }
    return textos;
}

// Valor de uma chave para um idioma seguindo a cadeia (variante → base → inglês → português).
function resolver(textos, codigo, chave) {
    for (const c of cadeia(codigo)) {
        const v = textos.get(c)?.get(chave);
        if (v !== undefined) return { valor: v, de: c };
    }
    return { valor: undefined, de: null };
}

// Chaves de plural do pt-BR: base → categorias usadas no pt-BR.
function pluraisDaReferencia(ref) {
    const plurais = new Map();
    for (const chave of ref.keys()) {
        const m = chave.match(SUFIXO_PLURAL);
        if (!m) continue;
        if (!plurais.has(m[1])) plurais.set(m[1], new Set());
        plurais.get(m[1]).add(m[2]);
    }
    // Só conta como plural se tiver _other (ex.: "tipo_fluxo" não é plural).
    for (const [base, cats] of plurais) if (!cats.has('other')) plurais.delete(base);
    return plurais;
}

// Chaves que o idioma precisa ter: as do pt-BR, trocando cada plural pelas categorias do idioma.
function chavesNecessarias(ref, plurais, codigo) {
    const cats = categoriasDe(codigo);
    const lista = [];
    const feitos = new Set();
    for (const chave of ref.keys()) {
        const m = chave.match(SUFIXO_PLURAL);
        if (m && plurais.has(m[1])) {
            if (feitos.has(m[1])) continue;
            feitos.add(m[1]);
            for (const c of cats) lista.push(`${m[1]}_${c}`);
        } else {
            lista.push(chave);
        }
    }
    return lista;
}

// Valor do pt-BR equivalente (para plural, a categoria parecida ou "other").
function daReferencia(ref, plurais, chave) {
    if (ref.has(chave)) return ref.get(chave);
    const m = chave.match(SUFIXO_PLURAL);
    if (m && plurais.has(m[1])) return ref.get(`${m[1]}_other`);
    return undefined;
}

// ---------- Uso das chaves no código (só informativo) ----------

function chavesSemUso(ref) {
    const fontes = [];
    const varrer = (pasta) => {
        for (const e of fs.readdirSync(pasta, { withFileTypes: true })) {
            const p = path.join(pasta, e.name);
            if (e.isDirectory()) varrer(p);
            else if (/\.(jsx?|mjs)$/.test(e.name) && !e.name.endsWith('.test.js')) fontes.push(fs.readFileSync(p, 'utf8'));
        }
    };
    varrer(path.join(RAIZ, 'src'));
    const codigo = fontes.join('\n');
    const literais = new Set([...codigo.matchAll(/['"`]([\w.-]+)['"`]/g)].map((m) => m[1]));
    const inicios = [...codigo.matchAll(/`([\w.]+)\$\{/g)].map((m) => m[1]);
    const usadas = (chave) => {
        const semPlural = chave.replace(SUFIXO_PLURAL, '$1');
        return literais.has(chave) || literais.has(semPlural) || inicios.some((i) => chave.startsWith(i));
    };
    return [...ref.keys()].filter((k) => !usadas(k));
}

// ---------- Conferência ----------

function conferirCadastro(erros) {
    const vistos = new Set();
    const regioesPorLingua = new Map();
    const palavrasLegais = new Map();
    for (const i of IDIOMAS) {
        const onde = `registro.js (${i.codigo})`;
        if (!/^[a-z]{2}-[A-Z]{2}$/.test(i.codigo)) erros.push(`${onde}: código deve ser idioma de 2 letras + região de 2 letras (ex.: fr-FR)`);
        else if (Intl.getCanonicalLocales(i.codigo)[0] !== i.codigo) erros.push(`${onde}: código fora do padrão BCP 47`);
        if (vistos.has(i.prefixo)) erros.push(`${onde}: código repetido`);
        vistos.add(i.prefixo);
        for (const campo of ['nome', 'curto', 'pais', 'moeda']) if (!i[campo]) erros.push(`${onde}: falta o campo ${campo}`);
        if (i.pais && !/^[A-Z]{2}$/.test(i.pais)) erros.push(`${onde}: pais deve ter 2 letras maiúsculas`);
        else if (i.pais && fs.existsSync(PASTA_BANDEIRAS) && !fs.existsSync(path.join(PASTA_BANDEIRAS, `${i.pais.toLowerCase()}.svg`))) {
            erros.push(`${onde}: não há bandeira para o país ${i.pais}`);
        }
        if (i.moeda && !(i.moeda in APPLE_PRICES.monthly)) erros.push(`${onde}: moeda ${i.moeda} não está na tabela de preços (pricing.js)`);
        if (!['ltr', 'rtl'].includes(i.direcao)) erros.push(`${onde}: direcao deve ser ltr ou rtl`);
        if (i.base) {
            const base = idioma(i.base);
            if (!base) erros.push(`${onde}: base ${i.base} não está cadastrada`);
            else if (base.base) erros.push(`${onde}: a base ${i.base} também é variante; aponte para o idioma-base`);
            else if (base.codigo.split('-')[0] !== i.codigo.split('-')[0]) erros.push(`${onde}: a base ${i.base} é de outra língua`);
        }
        const lingua = i.codigo.split('-')[0];
        for (const r of i.regioes) {
            if (!/^([A-Z]{2}|\d{3})$/.test(r)) erros.push(`${onde}: região inválida "${r}"`);
            const chave = `${lingua}-${r}`;
            if (regioesPorLingua.has(chave)) erros.push(`${onde}: a região ${r} também está em ${regioesPorLingua.get(chave)}`);
            regioesPorLingua.set(chave, i.codigo);
            if (`${lingua}-${r}` === i.codigo || IDIOMAS.some((o) => o.codigo === `${lingua}-${r}`)) erros.push(`${onde}: a região ${r} já é um idioma cadastrado`);
        }
        const palavras = [['ajuda', i.rotas.ajuda], ['assunto', i.rotas.assunto], ['termos', i.rotas.termos], ['privacidade', i.rotas.privacidade], ...SECOES.map((s) => [`secoes.${s}`, i.rotas.secoes[s]])];
        for (const [campo, valor] of palavras) {
            if (!valor) erros.push(`${onde}: falta rotas.${campo}${i.base ? ' (nem na base)' : ''}`);
            else if (!palavraDeEnderecoValida(valor)) erros.push(`${onde}: rotas.${campo} "${valor}" só pode ter letras da escrita do idioma (minúsculas onde ela tem maiúscula), as marcas dela, números e hífen entre as palavras, em NFC (sem espaço, pontuação nem barra)`);
            else if (campo === 'ajuda' && PARECE_PREFIXO.test(valor)) erros.push(`${onde}: rotas.ajuda "${valor}" parece código de idioma; use uma palavra maior`);
        }
        if (i.rotas.ajuda && i.rotas.ajuda === i.rotas.assunto) erros.push(`${onde}: rotas.ajuda e rotas.assunto não podem ser iguais`);
        const doIdioma = [i.rotas.ajuda, i.rotas.termos, i.rotas.privacidade].filter(Boolean);
        if (new Set(doIdioma).size !== doIdioma.length) erros.push(`${onde}: rotas.ajuda, rotas.termos e rotas.privacidade precisam ser diferentes`);
        for (const [doc, valor] of [['termos', i.rotas.termos], ['privacidade', i.rotas.privacidade]]) {
            if (!valor) continue;
            const dono = palavrasLegais.get(valor);
            if (dono && dono !== doc) erros.push(`${onde}: rotas.${doc} "${valor}" já é a palavra de outro documento em outro idioma`);
            palavrasLegais.set(valor, doc);
            if (IDIOMAS.some((o) => o.rotas.ajuda === valor)) erros.push(`${onde}: rotas.${doc} "${valor}" é igual à palavra da Central de algum idioma`);
            if (['termos-de-uso', 'politicas-de-privacidade'].includes(valor) && doc !== (valor === 'termos-de-uso' ? 'termos' : 'privacidade')) erros.push(`${onde}: rotas.${doc} "${valor}" é endereço antigo de outro documento`);
        }
        const secoes = SECOES.map((s) => i.rotas.secoes[s]).filter(Boolean);
        if (new Set(secoes).size !== secoes.length) erros.push(`${onde}: duas seções com a mesma palavra`);
    }
    if (!idioma(REFERENCIA) || idioma(REFERENCIA).base) erros.push(`registro.js: REFERENCIA (${REFERENCIA}) tem de ser um idioma-base cadastrado`);
    if (!idioma(INTERNACIONAL) || idioma(INTERNACIONAL).base) erros.push(`registro.js: INTERNACIONAL (${INTERNACIONAL}) tem de ser um idioma-base cadastrado`);
}

function conferir() {
    const erros = [];
    const avisos = [];
    conferirCadastro(erros);
    const textos = carregarTextos(erros);
    const ref = textos.get(REFERENCIA) ?? new Map();
    const plurais = pluraisDaReferencia(ref);
    const relatorio = [];

    for (const codigo of textos.keys()) {
        if (!idioma(codigo)) erros.push(`textos/${codigo}.json: idioma não cadastrado em registro.js`);
    }

    for (const i of IDIOMAS) {
        const proprio = textos.get(i.codigo);
        const nomeArq = `textos/${i.codigo}.json`;
        if (!proprio) {
            erros.push(`${nomeArq}: arquivo não existe (rode: npm run idiomas -- novo ${i.codigo})`);
            continue;
        }
        const necessarias = chavesNecessarias(ref, plurais, i.codigo);
        const aceitas = new Set(necessarias);
        const cats = categoriasDe(i.codigo);
        for (const [chave, valor] of proprio) {
            const m = chave.match(SUFIXO_PLURAL);
            const ehPlural = m && plurais.has(m[1]);
            if (!aceitas.has(chave) && !(ehPlural && (m[2] === 'zero' || cats.includes(m[2])))) {
                if (ehPlural) avisos.push(`${nomeArq}: ${chave} não é usada em ${i.codigo} (categorias: ${cats.join(', ')})`);
                else erros.push(`${nomeArq}: ${chave} não existe no ${REFERENCIA} (crie no ${REFERENCIA} primeiro ou apague)`);
                continue;
            }
            const original = daReferencia(ref, plurais, chave);
            if (Array.isArray(original) !== Array.isArray(valor)) {
                erros.push(`${nomeArq}: ${chave} deve ser ${Array.isArray(original) ? 'uma lista' : 'um texto'}`);
                continue;
            }
            const vazios = (Array.isArray(valor) ? valor : [valor]).some((v) => typeof v !== 'string' || !v.trim());
            if (vazios) erros.push(`${nomeArq}: ${chave} está vazio`);
            if (placeholders(valor) !== placeholders(original)) {
                erros.push(`${nomeArq}: ${chave} tem {{...}} diferente do ${REFERENCIA} (esperado: ${placeholders(original) || 'nenhum'}; veio: ${placeholders(valor) || 'nenhum'})`);
            }
        }

        const faltam = [];
        const repetidos = [];
        if (i.base) {
            const base = textos.get(i.base) ?? new Map();
            for (const [chave, valor] of proprio) {
                if (JSON.stringify(base.get(chave)) === JSON.stringify(valor)) repetidos.push(chave);
            }
        } else {
            for (const chave of necessarias) if (!proprio.has(chave)) faltam.push(chave);
        }
        relatorio.push({ i, faltam, repetidos, cadeia: cadeia(i.codigo) });
    }

    return { erros, avisos, relatorio, textos, ref, plurais, semUso: chavesSemUso(ref) };
}

function escreverPendencias({ relatorio, textos, avisos, semUso }) {
    const linhas = [
        '# Pendências dos idiomas do site',
        '',
        'Gerado por `npm run idiomas`. Não edite: é refeito a cada execução.',
        '',
        'Para traduzir o que falta: `npm run idiomas -- exportar <idioma>`, traduza o arquivo em',
        '`ferramentas/idiomas/a-traduzir/` e rode `npm run idiomas -- importar <idioma>`.',
        'Enquanto um texto faltar, o site mostra o do próximo idioma da cadeia.',
        '',
    ];
    for (const { i, faltam, repetidos, cadeia: c } of relatorio) {
        const tipo = i.codigo === REFERENCIA ? 'referência' : i.base ? `variante de ${i.base}` : 'base';
        linhas.push(`## ${i.codigo} — ${i.nome} (${tipo}) — ${faltam.length} a traduzir`, '');
        linhas.push(`Cadeia: ${c.join(' → ')}`, '');
        if (faltam.length) {
            linhas.push('| Chave | Texto que aparece hoje (idioma) |', '| --- | --- |');
            for (const chave of faltam) {
                const r = resolver(textos, i.codigo, chave);
                const texto = Array.isArray(r.valor) ? r.valor.join(' / ') : String(r.valor ?? '');
                linhas.push(`| \`${chave}\` | ${texto.replace(/\|/g, '\\|').replace(/\n/g, ' ')} (${r.de ?? '—'}) |`);
            }
            linhas.push('');
        }
        if (repetidos.length) {
            linhas.push(`Iguais à base ${i.base} (podem ser apagados de textos/${i.codigo}.json): ${repetidos.map((k) => `\`${k}\``).join(', ')}`, '');
        }
    }
    if (avisos.length) linhas.push('## Avisos', '', ...avisos.map((a) => `- ${a}`), '');
    if (semUso.length) {
        linhas.push('## Textos que o código não usa', '', 'Conferência automática (pode errar em chave montada no código). Se não forem usados, apague do pt-BR e dos outros idiomas.', '');
        linhas.push(...semUso.map((k) => `- \`${k}\``), '');
    }
    fs.writeFileSync(ARQUIVO_PENDENCIAS, linhas.join('\n'));
}

// ---------- Pacote para tradução ----------

function exportar(codigo, opcoes) {
    const alvo = idioma(codigo);
    if (!alvo) throw new Error(`${codigo} não está em src/i18n/registro.js`);
    const { textos, ref, plurais } = conferir();
    const origem = opcoes.de ?? alvo.base ?? INTERNACIONAL;
    if (!idioma(origem)) throw new Error(`--de ${origem}: idioma não cadastrado`);
    const proprio = textos.get(alvo.codigo) ?? new Map();
    const chaves = chavesNecessarias(ref, plurais, alvo.codigo);
    const pacote = {};
    for (const chave of chaves) {
        if (proprio.has(chave) && !opcoes.tudo && !alvo.base) continue;
        if (alvo.base && proprio.has(chave)) {
            pacote[chave] = proprio.get(chave);
            continue;
        }
        let r = resolver(textos, origem, chave);
        if (r.valor === undefined) {
            const m = chave.match(SUFIXO_PLURAL);
            if (m) r = resolver(textos, origem, `${m[1]}_other`);
        }
        pacote[chave] = r.valor;
    }
    const instrucoes = alvo.base
        ? `Variante ${alvo.codigo} de ${alvo.base}. Mude só os textos que são diferentes em ${alvo.nome}; os iguais são descartados ao importar.`
        : `Traduza cada valor para ${alvo.nome} (${alvo.codigo}). Não mude as chaves nem o que está entre {{ }}. **texto** é negrito. Chaves terminadas em _one, _few, _many, _other são as formas de plural de ${alvo.codigo}.`;
    const arquivo = path.join(PASTA_PACOTES, `${alvo.codigo}.json`);
    gravarJson(arquivo, { _instrucoes: instrucoes, _origem: origem, textos: pacote });
    console.log(`Pacote para tradução: ${path.relative(RAIZ, arquivo)} (${Object.keys(pacote).length} textos, origem ${origem}).`);
}

function importarPacote(codigo) {
    const alvo = idioma(codigo);
    if (!alvo) throw new Error(`${codigo} não está em src/i18n/registro.js`);
    const arquivo = path.join(PASTA_PACOTES, `${alvo.codigo}.json`);
    if (!fs.existsSync(arquivo)) throw new Error(`não achei ${path.relative(RAIZ, arquivo)} (rode exportar antes)`);
    const pacote = lerJson(arquivo).textos ?? {};
    const { textos, ref, plurais } = conferir();
    const aceitas = new Set(chavesNecessarias(ref, plurais, alvo.codigo));
    const atual = textos.get(alvo.codigo) ?? new Map();
    const base = alvo.base ? textos.get(alvo.base) ?? new Map() : null;
    const problemas = [];
    let novos = 0;
    let descartados = 0;
    for (const [chave, valor] of Object.entries(pacote)) {
        if (!aceitas.has(chave)) { problemas.push(`${chave}: chave desconhecida`); continue; }
        if (valor === null || valor === undefined || (typeof valor === 'string' && !valor.trim())) continue;
        const original = daReferencia(ref, plurais, chave);
        if (placeholders(valor) !== placeholders(original)) { problemas.push(`${chave}: {{...}} diferente do ${REFERENCIA}`); continue; }
        if (base && JSON.stringify(base.get(chave)) === JSON.stringify(valor)) {
            if (atual.delete(chave)) descartados += 1;
            continue;
        }
        if (JSON.stringify(atual.get(chave)) !== JSON.stringify(valor)) novos += 1;
        atual.set(chave, valor);
    }
    if (problemas.length) {
        console.error(`Nada foi gravado. Corrija o pacote:\n  ${problemas.join('\n  ')}`);
        process.exit(1);
    }
    const ordem = new Map([...ref.keys()].map((k, n) => [k, n]));
    gravarJson(arquivoDe(alvo.codigo), montar(atual, ordem));
    fs.rmSync(arquivo);
    console.log(`textos/${alvo.codigo}.json: ${novos} texto(s) novo(s) ou alterado(s)${descartados ? `, ${descartados} igual(is) à base descartado(s)` : ''}. Pacote apagado.`);
}

// ---------- Comandos ----------

function executarConferencia(silencioso) {
    const resultado = conferir();
    escreverPendencias(resultado);
    const { erros, avisos, relatorio } = resultado;
    if (!silencioso || erros.length) {
        for (const { i, faltam, repetidos } of relatorio) {
            const extra = repetidos.length ? `, ${repetidos.length} igual(is) à base` : '';
            console.log(`  ${i.codigo.padEnd(6)} ${faltam.length ? `${faltam.length} a traduzir` : 'completo'}${extra}`);
        }
        for (const a of avisos) console.log(`  aviso: ${a}`);
    }
    if (erros.length) {
        console.error(`\nIdiomas: ${erros.length} erro(s):\n  ${erros.join('\n  ')}`);
        process.exit(1);
    }
    const pendentes = relatorio.reduce((n, r) => n + r.faltam.length, 0);
    console.log(`Idiomas: ${IDIOMAS.length} idioma(s), sem erros${pendentes ? `; ${pendentes} texto(s) a traduzir (src/i18n/textos/PENDENCIAS.md)` : ''}.`);
}

const [comando, codigo, ...resto] = process.argv.slice(2);
const opcoes = { de: resto.includes('--de') ? resto[resto.indexOf('--de') + 1] : undefined, tudo: resto.includes('--tudo') };

try {
    if (!comando || comando === 'conferir') executarConferencia(false);
    else if (comando === '--build') executarConferencia(true);
    else if (comando === 'novo') {
        const alvo = idioma(codigo);
        if (!alvo) {
            console.error(`Primeiro cadastre ${codigo} em src/i18n/registro.js. Exemplo:\n` +
                `    { codigo: '${codigo}', nome: '…', curto: '${codigo.toUpperCase()}', pais: '${codigo.split('-')[1]}', moeda: 'eur',\n` +
                `      rotas: { ajuda: '…', assunto: '…', secoes: { sobre: '…', recursos: '…', equipe: '…', precos: '…', faq: '…' } } },`);
            process.exit(1);
        }
        if (!fs.existsSync(arquivoDe(alvo.codigo))) gravarJson(arquivoDe(alvo.codigo), {});
        exportar(alvo.codigo, opcoes);
        executarConferencia(true);
    } else if (comando === 'exportar') exportar(codigo, opcoes);
    else if (comando === 'importar') {
        importarPacote(codigo);
        executarConferencia(true);
    } else {
        console.error(`Comando desconhecido: ${comando}. Use: conferir | novo <idioma> | exportar <idioma> | importar <idioma>`);
        process.exit(1);
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
