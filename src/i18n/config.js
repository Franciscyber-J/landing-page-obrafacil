import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            pt: { translation: pt },
            en: { translation: en },
            es: { translation: es },
        },
        fallbackLng: 'pt',
        supportedLngs: ['pt', 'en', 'es'],
        load: 'languageOnly', // this ensures 'en-US' becomes 'en'
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

export default i18n;
