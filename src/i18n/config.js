import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { CODIGOS, cadeia, idioma } from './idiomas.js';
import { comPluraisDaBase } from './plurais.js';
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
        // Variante: os plurais herdados da base usam a regra de plural da variante (ver plurais.js). A base já é
        // baixada de qualquer jeito (vem logo depois na cadeia).
        const base = idioma(codigo)?.base;
        const carregarBase = base ? ARQUIVOS[`./textos/${base}.json`] : null;
        Promise.all([carregar(), carregarBase ? carregarBase() : null])
            .then(([textos, daBase]) => pronto(null, daBase ? comPluraisDaBase(textos, daBase) : textos), (erro) => pronto(erro, null));
    },
};

// textosProntos: os textos do idioma da página (e da cadeia dele) já chegaram. A página pronta do build só é
// "hidratada" depois disso (src/main.jsx), para o primeiro desenho sair igual ao que já está na tela.
export const textosProntos = i18n
    .use(textosSobDemanda)
    .use(initReactI18next)
    .init({
        lng: idiomaInicial(),
        supportedLngs: CODIGOS,
        fallbackLng: (codigo) => cadeia(codigo).slice(1),
        load: 'currentOnly',
        returnEmptyString: false,
        interpolation: { escapeValue: false },
        showSupportNotice: false,
        react: { useSuspense: true },
    });

export default i18n;
