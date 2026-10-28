import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru/translation.json';
import en from './locales/en/translation.json';

const key = 'i18nextLng';
const requestedLang = new URLSearchParams(window.location.search).get('lang');
const savedLang = localStorage.getItem(key);
const initialLang =
  requestedLang === 'ru' || requestedLang === 'en'
    ? requestedLang
    : savedLang ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(key, lng);
});

export default i18n;
