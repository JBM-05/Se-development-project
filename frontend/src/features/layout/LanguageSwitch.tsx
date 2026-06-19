import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { languageChanged } from './layoutSlice'

export function LanguageSwitch() {
  const dispatch = useAppDispatch()
  const language = useAppSelector((state) => state.layout.language)
  const { i18n } = useTranslation()

  async function setLanguage(nextLanguage: 'en' | 'ar') {
    dispatch(languageChanged(nextLanguage))
    await i18n.changeLanguage(nextLanguage)
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
      <Languages className="ms-1 h-4 w-4 text-slate-500" aria-hidden="true" />
      {(['en', 'ar'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => void setLanguage(item)}
          className={`rounded-md px-2.5 py-1 text-sm font-semibold ${
            language === item ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
          aria-pressed={language === item}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
