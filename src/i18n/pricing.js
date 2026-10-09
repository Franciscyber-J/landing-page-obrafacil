/**
 * ============================================================
 *  PRICING MASTER TABLE — Apple Store Mirror (Maio/2026)
 * ============================================================
 *
 * Fonte canônica de preços. Todos os valores em centavos/unidade
 * mínima de moeda (igual ao script Stripe que gerou os Price IDs).
 *
 * COMO ADICIONAR UM NOVO IDIOMA:
 *   1. Crie o arquivo de locale em src/i18n/locales/<code>.json
 *   2. Importe-o em src/i18n/config.js e adicione ao supportedLngs
 *   3. Adicione o locale ao LOCALE_CURRENCY_MAP abaixo (ex: 'ja': 'jpy')
 *   4. Os preços já serão aplicados automaticamente — zero mudança extra.
 *
 * ============================================================
 */

// ── Todos os 43 preços (em centavos) espelhados da Apple Store ───────────────
export const APPLE_PRICES = {
    monthly: {
        aed: 5999,     aud: 2299,     brl: 9990,     cad: 1999,     chf: 1400,
        clp: 17990,    cny: 9800,     cop: 6990000,  czk: 39900,    dkk: 12900,
        egp: 79999,    eur: 1799,     gbp: 1499,     hkd: 11800,    huf: 699000,
        idr: 24900000, ils: 4990,     inr: 149900,   jpy: 2500,     krw: 22000,
        kzt: 899000,   mxn: 29900,    myr: 6990,     ngn: 2490000,  nok: 19900,
        nzd: 2999,     pen: 6990,     php: 99900,    pkr: 390000,   pln: 6999,
        qar: 4999,     ron: 7999,     rub: 129000,   sar: 5999,     sek: 19900,
        sgd: 1998,     thb: 49900,    try: 79999,    twd: 49000,    tzs: 3990000,
        usd: 1499,     vnd: 499000,   zar: 29999,
    },
    annual: {
        aed: 49999,    aud: 19999,    brl: 89900,    cad: 17999,    chf: 11000,
        clp: 149990,   cny: 99800,    cop: 59990000, czk: 349000,   dkk: 99900,
        egp: 699999,   eur: 14999,    gbp: 12999,    hkd: 98800,    huf: 5999000,
        idr: 199900000,ils: 49990,    inr: 1290000,  jpy: 22000,    krw: 179000,
        kzt: 7999000,  mxn: 299900,   myr: 59990,    ngn: 19990000, nok: 179000,
        nzd: 22999,    pen: 59990,    php: 799000,   pkr: 3490000,  pln: 59999,
        qar: 49999,    ron: 69999,    rub: 999000,   sar: 59999,    sek: 179500,
        sgd: 19998,    thb: 499000,   try: 699999,   twd: 399000,   tzs: 39990000,
        usd: 12999,    vnd: 3999000,  zar: 249999,
    },
};

// ── Símbolo de exibição para cada moeda ─────────────────────────────────────
export const CURRENCY_SYMBOLS = {
    aed: 'AED', aud: 'A$',  brl: 'R$',  cad: 'CA$', chf: 'CHF',
    clp: '$',   cny: '¥',   cop: '$',   czk: 'Kč',  dkk: 'kr',
    egp: '£',   eur: '€',   gbp: '£',   hkd: 'HK$', huf: 'Ft',
    idr: 'Rp',  ils: '₪',   inr: '₹',   jpy: '¥',   krw: '₩',
    kzt: '₸',   mxn: '$',   myr: 'RM',  ngn: '₦',   nok: 'kr',
    nzd: 'NZ$', pen: 'S/',  php: '₱',   pkr: '₨',   pln: 'zł',
    qar: 'QR',  ron: 'lei', rub: '₽',   sar: 'SAR', sek: 'kr',
    sgd: 'S$',  thb: '฿',   try: '₺',   twd: 'NT$', tzs: 'TSh',
    usd: '$',   vnd: '₫',   zar: 'R',
};

// ── Moedas sem decimais (sem casas centavos) ─────────────────────────────────
const NO_DECIMAL_CURRENCIES = new Set([
    'clp', 'cop', 'huf', 'idr', 'jpy', 'krw', 'kzt', 'ngn',
    'php', 'pkr', 'rub', 'thb', 'tzs', 'vnd',
]);

// ── Mapa locale → moeda ───────────────────────────────────────────────────────
// Adicione aqui cada novo idioma que criar. Os preços serão aplicados
// automaticamente no Pricing.jsx e ExitIntentPopup via usePricing().
export const LOCALE_CURRENCY_MAP = {
    // ── Ativos ──────────────────────────────────────────────
    'pt':    'brl',
    'pt-PT': 'eur',
    'en':    'usd',
    'en-GB': 'gbp',
    'en-AU': 'aud',
    'en-CA': 'cad',
    'es-MX': 'mxn',
    'es':    'eur',

    // ── Em espera (crie o locale JSON e vai funcionar na hora) ──
    'ja':    'jpy',   // Japonês
    'ko':    'krw',   // Coreano
    'zh':    'cny',   // Chinês Simplificado
    'zh-TW': 'twd',   // Chinês Tradicional (Taiwan)
    'ar':    'aed',   // Árabe (Emirados)
    'ar-SA': 'sar',   // Árabe (Arábia Saudita)
    'ar-QA': 'qar',   // Árabe (Catar)
    'ar-EG': 'egp',   // Árabe (Egito)
    'hi':    'inr',   // Hindi (Índia)
    'tr':    'try',   // Turco
    'pl':    'pln',   // Polonês
    'ru':    'rub',   // Russo
    'th':    'thb',   // Tailandês
    'id':    'idr',   // Indonésio
    'ms':    'myr',   // Malaio
    'vi':    'vnd',   // Vietnamita
    'de':    'eur',   // Alemão
    'fr':    'eur',   // Francês
    'it':    'eur',   // Italiano
    'nl':    'eur',   // Holandês
    'sv':    'sek',   // Sueco
    'no':    'nok',   // Norueguês
    'da':    'dkk',   // Dinamarquês
    'fi':    'eur',   // Finlandês
    'cs':    'czk',   // Tcheco
    'ro':    'ron',   // Romeno
    'hu':    'huf',   // Húngaro
    'he':    'ils',   // Hebraico
    'en-NZ': 'nzd',   // Inglês (Nova Zelândia)
    'en-SG': 'sgd',   // Inglês (Singapura)
    'en-HK': 'hkd',   // Inglês (Hong Kong)
    'en-PH': 'php',   // Inglês (Filipinas)
    'en-PK': 'pkr',   // Inglês (Paquistão)
    'en-NG': 'ngn',   // Inglês (Nigéria)
    'en-TZ': 'tzs',   // Inglês (Tanzânia)
    'en-ZA': 'zar',   // Inglês (África do Sul)
    'es-CL': 'clp',   // Espanhol (Chile)
    'es-CO': 'cop',   // Espanhol (Colômbia)
    'es-PE': 'pen',   // Espanhol (Peru)
};

// ── Links de checkout Stripe ─────────────────────────────────────────────────
export const STRIPE_LINKS = {
    monthly:  'https://buy.stripe.com/4gM28s7IT8Jcgxa65G0VO06',
    annual:   'https://buy.stripe.com/9B6dRabZ92kOgxa2Tu0VO07',
    // Popup exit-intent com cupom FUNDADOR50 (≈50% off no 1º ano)
    popup:    'https://buy.stripe.com/7sY3cw0grcZsft6gKk0VO08?prefilled_promo_code=FUNDADOR50',
};

// ── Hook: usePricing() ────────────────────────────────────────────────────────
// Retorna todos os valores de preço formatados para o locale atual.
// Usado em Pricing.jsx e ExitIntentPopup.jsx.

/**
 * Converte centavos para string de exibição.
 * Moedas sem decimal (jpy, krw…) ficam como inteiro.
 * Moedas decimais usam separador correto do locale.
 */
function formatAmount(cents, currency, locale) {
    if (NO_DECIMAL_CURRENCIES.has(currency)) {
        return cents.toLocaleString(locale);
    }
    return (cents / 100).toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * @param {string} locale  — ex: 'pt', 'en-GB', 'es-MX'
 * @returns pricing object com todos os valores prontos para exibir
 */
export function getPricing(locale) {
    const currency = LOCALE_CURRENCY_MAP[locale]
        ?? LOCALE_CURRENCY_MAP[locale?.split('-')[0]]
        ?? 'brl';

    const symbol = CURRENCY_SYMBOLS[currency] ?? 'R$';
    const rawMonthly = APPLE_PRICES.monthly[currency];
    const rawAnnual  = APPLE_PRICES.annual[currency];

    const monthly  = formatAmount(rawMonthly, currency, locale);
    const annual   = formatAmount(rawAnnual,  currency, locale);

    // Preço "De" riscado = 3× mensal (simula valor sem desconto)
    const fromMonthly = formatAmount(rawMonthly * 3, currency, locale);
    // Preço "De" anual  = 12× mensal (sem desconto anual)
    const fromAnnual  = formatAmount(rawMonthly * 12, currency, locale);

    // Economia anual vs pagar mensal por 12 meses
    const annualSavings = formatAmount((rawMonthly * 12) - rawAnnual, currency, locale);

    // Equivalente mensal do plano anual
    const monthlyEquiv = NO_DECIMAL_CURRENCIES.has(currency)
        ? Math.round(rawAnnual / 12).toLocaleString(locale)
        : formatAmount(Math.round(rawAnnual / 12), currency, locale);

    // Preço popup (≈50% do mensal)
    const popupPrice = NO_DECIMAL_CURRENCIES.has(currency)
        ? Math.round(rawMonthly / 2).toLocaleString(locale)
        : formatAmount(Math.round(rawMonthly / 2), currency, locale);

    return {
        currency,      // 'brl'
        symbol,        // 'R$'
        monthly,       // '99,90'
        annual,        // '899,00'
        fromMonthly,   // '299,70'
        fromAnnual,    // '1.198,80'
        annualSavings, // '299,80'
        monthlyEquiv,  // '74,92'
        popupPrice,    // '49,95'
    };
}
