// i18next do build das páginas prontas: todos os textos já carregados (sem baixar nada e sem esperar), com as
// mesmas regras do site no navegador (src/i18n/config.js), para o texto sair igual nos dois.
import i18next from 'i18next';
import { CODIGOS, REFERENCIA, cadeia, idioma } from '../i18n/idiomas.js';
import { comPluraisDaBase } from '../i18n/plurais.js';

const ARQUIVOS = import.meta.glob('../i18n/textos/*.json', { eager: true, import: 'default' });

const textosDe = new Map(Object.entries(ARQUIVOS).map(([arquivo, textos]) => [arquivo.split('/').pop().replace(/\.json$/, ''), textos]));
const resources = {};
for (const [codigo, textos] of textosDe) {
    // Variante: plurais herdados da base com a regra de plural da variante (igual ao navegador, src/i18n/plurais.js).
    const base = idioma(codigo)?.base;
    resources[codigo] = { translation: base && textosDe.has(base) ? comPluraisDaBase(textos, textosDe.get(base)) : textos };
}

const i18n = i18next.createInstance();
i18n.init({
    resources,
    lng: REFERENCIA,
    supportedLngs: CODIGOS,
    fallbackLng: (codigo) => cadeia(codigo).slice(1),
    load: 'currentOnly',
    returnEmptyString: false,
    interpolation: { escapeValue: false },
    showSupportNotice: false,
    react: { useSuspense: false },
    initAsync: false,
});

export default i18n;
