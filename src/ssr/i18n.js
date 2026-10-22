// i18next do build das páginas prontas: todos os textos já carregados (sem baixar nada e sem esperar), com as
// mesmas regras do site no navegador (src/i18n/config.js), para o texto sair igual nos dois.
import i18next from 'i18next';
import { CODIGOS, REFERENCIA, cadeia } from '../i18n/idiomas.js';

const ARQUIVOS = import.meta.glob('../i18n/textos/*.json', { eager: true, import: 'default' });

const resources = {};
for (const [arquivo, textos] of Object.entries(ARQUIVOS)) {
    const codigo = arquivo.split('/').pop().replace(/\.json$/, '');
    resources[codigo] = { translation: textos };
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
