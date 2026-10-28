// Números, datas e preços no jeito do idioma (decisões do Francis de 26/10/2026, iguais às do app):
// algarismos 0-9 em todo idioma, ano budista no tailandês, rupia, florim e dólar de Taiwan sem centavos e o leu
// como "lei". Nenhum idioma árabe nem o tailandês está ativo: as funções são chamadas com o código direto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDIOMAS } from './idiomas.js';
import { anoNoIdioma, formatarData, formatarNumero, localeDoIntl, partesDoNumero } from './formatos.js';
import { APPLE_PRICES, CURRENCY_SYMBOLS, casasNaTela, getPricing, precosDoIdioma } from './pricing.js';

const ORIENTAIS = /[٠-٩۰-۹]/;
const DATA = Date.UTC(2027, 5, 9, 15, 0); // 9/6/2027, 12h em São Paulo
const POR_EXTENSO = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' };

test('localeDoIntl põe os algarismos 0-9 e o calendário do idioma', () => {
    assert.equal(localeDoIntl('ar-SA'), 'ar-SA-u-ca-gregory-nu-latn');
    assert.equal(localeDoIntl('th-TH'), 'th-TH-u-ca-buddhist-nu-latn');
    assert.equal(localeDoIntl('pt-BR'), 'pt-BR-u-ca-gregory-nu-latn');
    assert.equal(new Intl.NumberFormat(localeDoIntl('ar-SA')).resolvedOptions().numberingSystem, 'latn');
    assert.equal(new Intl.DateTimeFormat(localeDoIntl('th-TH')).resolvedOptions().calendar, 'buddhist');
    // Código que o Intl não entende volta como veio.
    assert.equal(localeDoIntl('não é código'), 'não é código');
});

test('os 8 idiomas de antes: números, datas e preços iguais aos do Intl sem nada', () => {
    const OITO = ['pt-BR', 'pt-PT', 'en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES', 'es-MX'];
    for (const { codigo } of IDIOMAS.filter((i) => OITO.includes(i.codigo))) {
        assert.equal(formatarNumero(codigo, 1234567.891), (1234567.891).toLocaleString(codigo), codigo);
        assert.equal(
            formatarNumero(codigo, 1499.9, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            (1499.9).toLocaleString(codigo, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            codigo,
        );
        assert.equal(formatarData(codigo, DATA, POR_EXTENSO), new Intl.DateTimeFormat(codigo, POR_EXTENSO).format(DATA), codigo);
        assert.equal(anoNoIdioma(codigo, new Date(2027, 5, 9)), '2027', codigo);
    }
    assert.equal(getPricing('pt-BR').monthly, '99,90');
    assert.equal(getPricing('pt-BR').monthlyEquiv, '74,92');
    assert.equal(getPricing('en-US').annual, '129.99');
    assert.equal(getPricing('es-ES').monthly, '17,99');
    assert.deepEqual(precosDoIdioma('pt-BR'), { moeda: 'BRL', mensal: '99.90', anual: '899.00' });
});

test('árabe sempre com 0-9: ar-SA não sai com ٠-٩', () => {
    // Sem o ponto único, o Intl escreveria "٥٩٫٩٩" no ar-SA.
    for (const codigo of ['ar-SA', 'ar-EG', 'ar', 'ar-AE']) {
        const textos = [
            formatarNumero(codigo, 1234567.89),
            formatarNumero(codigo, 59.99, { style: 'currency', currency: 'SAR' }),
            formatarData(codigo, DATA, POR_EXTENSO),
            anoNoIdioma(codigo, new Date(2027, 5, 9)),
            ...Object.values(getPricing(codigo)),
            ...partesDoNumero(codigo, 1, { style: 'currency', currency: 'SAR' }).map((p) => p.value),
        ];
        for (const texto of textos) assert.ok(!ORIENTAIS.test(String(texto)), `${codigo}: ${texto}`);
    }
    assert.equal(getPricing('ar-SA').monthly, '59.99');
    assert.equal(getPricing('ar-SA').annual, '599.99');
    // Calendário gregoriano, como no app ("يونيو" é junho).
    assert.match(formatarData('ar-SA', DATA, POR_EXTENSO), /^9 يونيو 2027$/);
});

test('tailandês no ano budista: 2027 → 2570', () => {
    assert.equal(formatarData('th-TH', DATA, POR_EXTENSO), '9 มิถุนายน 2570');
    assert.equal(formatarData('th-TH', DATA, { timeZone: 'America/Sao_Paulo' }), '9/6/2570');
    assert.equal(anoNoIdioma('th-TH', new Date(2027, 5, 9)), '2570');
    assert.equal(anoNoIdioma('th', new Date(2026, 0, 1)), '2569');
    // Só a data: os números continuam 0-9 e o preço em baht com centavos.
    assert.equal(getPricing('th-TH').monthly, '499.00');
});

test('rupia, florim e dólar de Taiwan sem centavos na tela', () => {
    assert.equal(casasNaTela('idr'), 0);
    assert.equal(casasNaTela('HUF'), 0);
    assert.equal(casasNaTela('twd'), 0);
    assert.equal(casasNaTela('jpy'), 0);
    assert.equal(casasNaTela('brl'), 2);
    assert.equal(casasNaTela('ron'), 2);

    assert.equal(getPricing('id-ID').monthly, '249.000');
    assert.equal(getPricing('id-ID').annual, '1.999.000');
    assert.equal(getPricing('id-ID').monthlyEquiv, '166.583');
    assert.equal(getPricing('hu-HU').monthly, '6990');
    assert.equal(getPricing('hu-HU').annual, '59 990');
    assert.equal(getPricing('zh-TW').monthly, '490');
    assert.equal(getPricing('zh-TW').annual, '3,990');
    assert.deepEqual(precosDoIdioma('id-ID'), { moeda: 'IDR', mensal: '249000', anual: '1999000' });

    // A tabela está em centésimos (como no Stripe) e os preços dessas moedas são inteiros: tirar os centavos
    // da tela nunca arredonda um preço.
    for (const moeda of ['idr', 'huf', 'twd']) {
        for (const plano of ['monthly', 'annual']) {
            assert.equal(APPLE_PRICES[plano][moeda] % 100, 0, `${moeda} ${plano}`);
        }
    }
});

test('nenhum número nem data formatado fora do ponto único (src/i18n/formatos.js)', () => {
    const raiz = fileURLToPath(new URL('../', import.meta.url));
    const proibido = /new Intl\.(NumberFormat|DateTimeFormat)\(|\.toLocale(String|DateString|TimeString)\(/;
    const achados = [];
    const varrer = (pasta) => {
        for (const nome of readdirSync(pasta)) {
            const caminho = join(pasta, nome);
            if (statSync(caminho).isDirectory()) varrer(caminho);
            else if (/\.(js|jsx)$/.test(nome) && !/\.test\.js$/.test(nome) && !caminho.endsWith(join('i18n', 'formatos.js'))) {
                readFileSync(caminho, 'utf8').split('\n').forEach((linha, i) => {
                    if (proibido.test(linha)) achados.push(`${relative(raiz, caminho)}:${i + 1}`);
                });
            }
        }
    };
    varrer(raiz);
    assert.deepEqual(achados, [], 'use formatarNumero, partesDoNumero, formatarData ou anoNoIdioma');
});

test('leu romeno como "lei", depois do número', () => {
    assert.equal(CURRENCY_SYMBOLS.ron, 'lei');
    const p = getPricing('ro-RO');
    assert.equal(p.symbol, 'lei');
    assert.equal(p.monthly, '79,99');
    const partes = partesDoNumero('ro-RO', 1, { style: 'currency', currency: 'RON' });
    assert.ok(partes.findIndex((x) => x.type === 'currency') > partes.findIndex((x) => x.type === 'integer'));
});
