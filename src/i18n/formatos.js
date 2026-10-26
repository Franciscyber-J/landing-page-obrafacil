// Números e datas do site no jeito do idioma, num ponto só (o mesmo papel do idioma_do_intl.dart e do
// formatos.dart do app). Todo Intl.NumberFormat, Intl.DateTimeFormat e toLocaleString do site passa por aqui.
//
// Decisões do Francis (26/10/2026), iguais no app e no site:
// - Algarismos sempre 0-9 (-u-nu-latn). Sem isso o árabe da Arábia Saudita (ar-SA) sai com ٠-٩: "٥٩٫٩٩".
// - Tailandês com o ano budista (-u-ca-buddhist): 2027 → 2570, como os tailandeses usam. O th-TH já usa o
//   calendário budista por padrão; aqui fica explícito.
// - Os outros idiomas no calendário gregoriano (-u-ca-gregory), como o app (o intl do Dart só tem esse): sem
//   isso, um navegador poderia escrever o ar-SA no calendário islâmico ou o persa no calendário persa.
// Nos 8 idiomas de hoje nada muda: já eram 0-9 e gregoriano (src/i18n/formatos.test.js confere).

// Calendário de cada língua que não usa o gregoriano no dia a dia (só as decididas).
const CALENDARIO_DA_LINGUA = { th: 'buddhist' };

/**
 * Idioma do site pronto para o Intl, com os algarismos e o calendário decididos:
 * 'ar-SA' → 'ar-SA-u-ca-gregory-nu-latn' | 'th-TH' → 'th-TH-u-ca-buddhist-nu-latn'.
 * Código que o Intl não entende volta como veio (o Intl decide, como antes).
 */
export function localeDoIntl(codigo) {
    try {
        const locale = new Intl.Locale(codigo);
        return new Intl.Locale(locale.baseName, {
            calendar: CALENDARIO_DA_LINGUA[locale.language] ?? 'gregory',
            numberingSystem: 'latn',
        }).toString();
    } catch {
        return codigo;
    }
}

/** Número no idioma (opções do Intl.NumberFormat): ('pt-BR', 1499.9, {minimumFractionDigits: 2}) → "1.499,90". */
export function formatarNumero(codigo, valor, opcoes) {
    return new Intl.NumberFormat(localeDoIntl(codigo), opcoes).format(valor);
}

/** As partes do número formatado (formatToParts), para saber onde fica o símbolo da moeda. */
export function partesDoNumero(codigo, valor, opcoes) {
    return new Intl.NumberFormat(localeDoIntl(codigo), opcoes).formatToParts(valor);
}

/** Data no idioma (opções do Intl.DateTimeFormat): ('th-TH', d, {year: 'numeric', ...}) → "9 มิถุนายน 2570". */
export function formatarData(codigo, data, opcoes) {
    return new Intl.DateTimeFormat(localeDoIntl(codigo), opcoes).format(data);
}

/** Só o número do ano no calendário do idioma, sem era: "2027" | th-TH "2570". */
export function anoNoIdioma(codigo, data) {
    const partes = new Intl.DateTimeFormat(localeDoIntl(codigo), { year: 'numeric' }).formatToParts(data);
    return partes.find((p) => p.type === 'year')?.value ?? String(new Date(data).getFullYear());
}
