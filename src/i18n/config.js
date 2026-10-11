import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { CODIGOS, cadeia } from './idiomas.js';
import { idiomaInicial } from './preferencia.js';

// Cada idioma vira um arquivo separado no build e só é baixado quando usado
// (o idioma da página e os da cadeia dele: variante → base → inglês → português).
const ARQUIVOS = import.meta.glob('./textos/*.json', { import: 'default' });

const textosSobDemanda = {
    type: 'backend',
    init() {},
    read(codigo, _ns, pronto) {
        const carregar = ARQUIVOS[`./textos/${codigo}.json`];
        if (!carregar) return pronto(null, {});
        carregar().then((textos) => pronto(null, textos), (erro) => pronto(erro, null));
    },
};

i18n
    .use(textosSobDemanda)
    .use(initReactI18next)
    .init({
        lng: idiomaInicial(),
        supportedLngs: CODIGOS,
        fallbackLng: (codigo) => cadeia(codigo).slice(1),
        load: 'currentOnly',
        returnEmptyString: false,
        interpolation: { escapeValue: false },
        react: { useSuspense: true },
    });

export default i18n;
