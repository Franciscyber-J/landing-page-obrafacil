// Textos do site da ExpertBR no build (React só no build: o navegador recebe o HTML pronto).
// Dois grupos de textos, com a mesma cadeia de idiomas do site do ObraFácil (variante → base → inglês → português):
//   expertbr  → src/textos/<idioma>.json (os textos daqui)
//   obrafacil → src/i18n/textos/<idioma>.json do site do ObraFácil (descrição, recursos e plataformas do app:
//               os mesmos textos do site dele, nos 29 idiomas, sem cópia)
// Chave com "obrafacil:" na frente vem do ObraFácil; sem prefixo, daqui.
import i18next from 'i18next';
import { CODIGOS } from '../../../src/i18n/idiomas.js';
import { cadeia, REFERENCIA } from './idiomas.js';

const DAQUI = import.meta.glob('./textos/*.json', { eager: true, import: 'default' });
const DO_OBRAFACIL = import.meta.glob('../../../src/i18n/textos/*.json', { eager: true, import: 'default' });

const nome = (arquivo) => arquivo.split('/').pop().replace(/\.json$/, '');
const resources = {};
for (const [arquivo, textos] of Object.entries(DAQUI)) (resources[nome(arquivo)] ??= {}).expertbr = textos;
for (const [arquivo, textos] of Object.entries(DO_OBRAFACIL)) (resources[nome(arquivo)] ??= {}).obrafacil = textos;

const i18n = i18next.createInstance();
i18n.init({
    resources,
    lng: REFERENCIA,
    supportedLngs: CODIGOS,
    fallbackLng: (codigo) => cadeia(codigo).slice(1),
    ns: ['expertbr', 'obrafacil'],
    defaultNS: 'expertbr',
    load: 'currentOnly',
    returnEmptyString: false,
    returnObjects: false,
    interpolation: { escapeValue: false },
    showSupportNotice: false,
    initAsync: false,
});

// t fixo num idioma. Texto que falta em todos os idiomas da cadeia para o build (nunca sai a chave na página).
export function tradutor(codigo) {
    const t = i18n.getFixedT(codigo);
    return (chave, opcoes) => {
        if (!i18n.exists(chave, { lng: codigo, ...opcoes })) throw new Error(`Texto não encontrado: ${chave} (${codigo})`);
        return t(chave, opcoes);
    };
}

// Lista de textos (ex.: os destaques do Orbit): uma chave que é lista, ou uma lista de chaves.
export function lista(t, valor) {
    if (Array.isArray(valor)) return valor.map((chave) => t(chave));
    const itens = t(valor, { returnObjects: true });
    if (!Array.isArray(itens)) throw new Error(`Texto não é lista: ${valor}`);
    return itens;
}
