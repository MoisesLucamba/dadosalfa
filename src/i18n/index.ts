import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptTranslations from './locales/pt.json';
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';

const resources = {
  pt: { translation: ptTranslations },
  en: { translation: enTranslations },
  fr: { translation: frTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en', 'fr'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'alphadata-language',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
