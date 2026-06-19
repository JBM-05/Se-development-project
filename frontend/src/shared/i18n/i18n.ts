import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/common.json'
import ar from './locales/ar/common.json'

const savedLanguage = localStorage.getItem('event-registration-language')
const initialLanguage = savedLanguage === 'ar' ? 'ar' : 'en'

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    ar: { common: ar },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
