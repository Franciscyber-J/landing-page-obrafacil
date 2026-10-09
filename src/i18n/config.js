import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import pt from './locales/pt.json';
import ptPT from './locales/pt-PT.json';
import en from './locales/en.json';
import enGB from './locales/en-GB.json';
import enAU from './locales/en-AU.json';
import enCA from './locales/en-CA.json';
import es from './locales/es.json';
import esMX from './locales/es-MX.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            'pt':    { translation: pt },
            'pt-PT': { translation: ptPT },
            'en':    { translation: en },
            'en-GB': { translation: enGB },
            'en-AU': { translation: enAU },
            'en-CA': { translation: enCA },
            'es':    { translation: es },
            'es-MX': { translation: esMX },
        },
        fallbackLng: 'pt',
        supportedLngs: ['pt', 'pt-PT', 'en', 'en-GB', 'en-AU', 'en-CA', 'es', 'es-MX'],
        load: 'currentOnly', // use exact language codes as-is (supports subtags like pt-PT)
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
