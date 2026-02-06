import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locale/en.json';
import id from '../locale/id.json';
import zh from '../locale/zh.json';
import ar from '../locale/ar.json';

const resources = {
  en: { translation: en },
  id: { translation: id },
  zh: { translation: zh },
  ar: { translation: ar }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // Default language untuk user baru
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage'], // Hanya cek localStorage, tidak detect dari browser
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

export default i18n;

