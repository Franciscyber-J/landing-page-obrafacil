// Testes do destino do "Começar grátis" e da tabela de preços nas moedas sem centavos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aparelho, linkComecar } from './comecar.js';
import { CADASTRO, appStore, googlePlay } from './links.js';
import { getPricing } from './i18n/pricing.js';

const ANDROID = { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/129 Mobile Safari/537.36', maxTouchPoints: 5 };
const IPHONE = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', maxTouchPoints: 5 };
const IPAD = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', maxTouchPoints: 5 };
const MAC = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', maxTouchPoints: 0 };
const WINDOWS = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129 Safari/537.36', maxTouchPoints: 0 };

test('aparelho: Android, iPhone, iPad (que se apresenta como Mac) e computador', () => {
    assert.equal(aparelho(ANDROID), 'android');
    assert.equal(aparelho(IPHONE), 'ios');
    assert.equal(aparelho(IPAD), 'ios');
    assert.equal(aparelho(MAC), 'outro');
    assert.equal(aparelho(WINDOWS), 'outro');
    assert.equal(aparelho(null), 'outro');
});

test('Começar grátis: loja do celular, cadastro no computador, com o nome da conversão', () => {
    assert.deepEqual(linkComecar('pt-BR', ANDROID), { href: googlePlay('pt-BR'), 'data-conversao': 'loja_android' });
    assert.deepEqual(linkComecar('en-US', IPHONE), { href: appStore(), 'data-conversao': 'loja_ios' });
    assert.deepEqual(linkComecar('es-ES', WINDOWS), { href: CADASTRO, 'data-conversao': 'cadastro' });
});

test('preços: moeda com centavos no Stripe não sai 100 vezes maior', () => {
    // COP 6990000 no Stripe = 69.900,00 (a Apple cobra 69.900)
    assert.equal(getPricing('es-CO').monthly.replace(/\D/g, ''), '6990000');
    assert.ok(!getPricing('es-CO').monthly.startsWith('6.990.000'));
    // JPY não tem centavos: 2500 = ¥2.500
    assert.equal(getPricing('ja').monthly.replace(/\D/g, ''), '2500');
    // Os 8 idiomas do site continuam iguais
    assert.equal(getPricing('pt-BR').monthly, '99,90');
    assert.equal(getPricing('en-US').monthly, '14.99');
});
