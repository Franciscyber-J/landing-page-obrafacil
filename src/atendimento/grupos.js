// Grupos de atendimento por país (decisão do Francis, 18/11/2026): só o WhatsApp, os dois (a pessoa escolhe) ou só a
// conversa com o Max no site. Funções puras, testadas em grupos.test.js. Contrato com o servidor:
// gestao_obras/docs/agencia_ia/ATENDIMENTO_CHAT.md (documento configuracoes/atendimento_paises).
//
// Os valores iniciais são os mesmos do servidor (functions/src/ia/maxAtendimentoRegras.ts) e do app
// (lib/ajuda/atendimento_do_pais.dart): valem enquanto o documento não foi lido, quando ele não existe ou quando a
// leitura falha. O país do visitante vem do fuso horário do navegador, sem localizar pela internet.

export const GRUPOS = ['so_whatsapp', 'os_dois', 'so_chat'];
export const GRUPO_PADRAO = 'os_dois';

// Só a conversa: Rússia, Japão, Coreia do Sul, Taiwan, Tailândia, Vietnã e Coreia do Norte.
export const PAISES_SO_CHAT = ['RU', 'JP', 'KR', 'TW', 'TH', 'VN', 'KP'];
// Os dois: EUA, Canadá, Austrália, França, Alemanha, Filipinas, Polônia, Tchéquia, Hungria, Grécia, Ucrânia e Belarus.
export const PAISES_OS_DOIS = ['US', 'CA', 'AU', 'FR', 'DE', 'PH', 'PL', 'CZ', 'HU', 'GR', 'UA', 'BY'];
// Só o WhatsApp: Brasil e América Latina, Portugal, Espanha, Itália, Reino Unido, Irlanda, Holanda, Bélgica, Suíça,
// países árabes, Israel, Turquia, Índia, Indonésia, Cazaquistão e a África.
export const PAISES_SO_WHATSAPP = [
    'BR', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE',
    'PT', 'ES', 'IT', 'GB', 'IE', 'NL', 'BE', 'CH',
    'SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'YE', 'JO', 'LB', 'SY', 'IQ', 'PS', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'MR',
    'DJ', 'SO', 'KM',
    'IL', 'TR', 'IN', 'ID', 'KZ',
    'AO', 'MZ', 'CV', 'GW', 'ST', 'NG', 'GH', 'KE', 'ZA', 'ET', 'TZ', 'UG', 'RW', 'BI', 'CM', 'CI', 'SN', 'ML', 'BF',
    'NE', 'TD', 'CF', 'CG', 'CD', 'GA', 'GQ', 'BJ', 'TG', 'LR', 'SL', 'GN', 'GM', 'ZM', 'ZW', 'MW', 'BW', 'NA', 'LS',
    'SZ', 'MG', 'MU', 'SC', 'ER', 'SS', 'EH',
];

export const CONFIG_INICIAL = Object.freeze({
    so_whatsapp: PAISES_SO_WHATSAPP, os_dois: PAISES_OS_DOIS, so_chat: PAISES_SO_CHAT, padrao: GRUPO_PADRAO,
});

// Mesmo teto do servidor (LIMITES_DO_CHAT.paisesPorGrupoMaximo).
const PAISES_POR_GRUPO = 300;
const PAIS = /^[A-Z]{2}$/;

// Código de país ISO 3166-1 alfa-2 (maiúsculo) ou null. "XX", "ZZ" e "AA" (sem país) não valem, como no servidor.
export function paisValido(valor) {
    if (typeof valor !== 'string') return null;
    const p = valor.trim().toUpperCase();
    if (!PAIS.test(p) || p === 'XX' || p === 'ZZ' || p === 'AA') return null;
    return p;
}

function listaDePaises(valor, padrao) {
    if (!Array.isArray(valor)) return [...padrao];
    const saida = [];
    for (const x of valor) {
        const p = paisValido(x);
        if (p && !saida.includes(p)) saida.push(p);
        if (saida.length >= PAISES_POR_GRUPO) break;
    }
    return saida;
}

// O documento configuracoes/atendimento_paises (já convertido do formato do Firestore), com o que faltar ou for
// inválido trocado pelo valor inicial: a mesma regra de lerConfigDoAtendimento no servidor.
export function lerConfiguracao(dados) {
    const d = dados && typeof dados === 'object' ? dados : {};
    return {
        so_whatsapp: listaDePaises(d.so_whatsapp, PAISES_SO_WHATSAPP),
        os_dois: listaDePaises(d.os_dois, PAISES_OS_DOIS),
        so_chat: listaDePaises(d.so_chat, PAISES_SO_CHAT),
        padrao: GRUPOS.includes(d.padrao) ? d.padrao : GRUPO_PADRAO,
    };
}

// O grupo do país: a primeira lista que o tem, na ordem só a conversa, os dois, só WhatsApp; fora delas (ou sem país),
// o padrão do documento.
export function grupoDoPais(pais, config = CONFIG_INICIAL) {
    const p = paisValido(pais);
    if (p) {
        if (config.so_chat.includes(p)) return 'so_chat';
        if (config.os_dois.includes(p)) return 'os_dois';
        if (config.so_whatsapp.includes(p)) return 'so_whatsapp';
    }
    return config.padrao;
}

// A região de um código de idioma do navegador ("ru-RU" → "RU", "zh-Hant-TW" → "TW"). "es-419" e afins (região
// que não é país) e o idioma sem região dão null.
export function regiaoDoIdioma(codigo) {
    if (typeof codigo !== 'string') return null;
    const partes = codigo.replace(/_/g, '-').split('-').slice(1);
    for (const parte of partes) {
        if (/^[A-Za-z]{2}$/.test(parte)) return paisValido(parte);
    }
    return null;
}

// O visitante: o país pelo fuso horário do navegador (diz onde a pessoa está) e, só quando o fuso não diz o país
// (Etc/UTC, fuso desconhecido), pela região do primeiro idioma do navegador que tiver região (o idioma diz a língua,
// não o lugar: muita gente no Cazaquistão usa o navegador em ru-RU). Sem nenhum dos dois, o padrão do documento
// ("os dois"). paisDoFuso: função fuso → país (src/atendimento/fusos.js). Devolve { pais, grupo }; pais é o que vai
// para o servidor (ou null).
export function visitante({ fuso, idiomas = [] }, paisDoFuso, config = CONFIG_INICIAL) {
    const pais = paisValido(paisDoFuso(fuso) ?? '') ?? idiomas.map(regiaoDoIdioma).find(Boolean) ?? null;
    return { pais, grupo: pais ? grupoDoPais(pais, config) : config.padrao };
}

// O que aparece antes de o navegador dizer o país (página pronta do build e o primeiro desenho no navegador, que têm
// de sair iguais): o grupo do país do idioma da página (bandeira do cadastro), pelos valores iniciais. Assim quem
// abre /ja-jp/ já recebe a conversa e quem abre /pt-br/ o WhatsApp, sem troca na tela na maioria das visitas.
export function grupoDaPagina(paisDaBandeira) {
    return grupoDoPais(paisDaBandeira, CONFIG_INICIAL);
}

// Número do WhatsApp do documento configuracoes/suporte: só algarismos, com o código do país (8 a 15, como no
// padrão E.164). Inválido: null (o site segue com o número de src/links.js).
export function whatsappValido(valor) {
    if (typeof valor !== 'string' && typeof valor !== 'number') return null;
    const numero = String(valor).trim();
    return /^[1-9][0-9]{7,14}$/.test(numero) ? numero : null;
}
