import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function useDocumentLanguage() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const language = i18n.language === 'ar' ? 'ar' : 'en'
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('event-registration-language', language)
  }, [i18n.language])
}
