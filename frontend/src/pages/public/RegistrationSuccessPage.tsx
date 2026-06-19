import { Link, Navigate, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RegistrationResponse } from '../../features/registration/registrationApi'
import { LanguageSwitch } from '../../features/layout/LanguageSwitch'

export function RegistrationSuccessPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const state = location.state as RegistrationResponse | null

  if (!state?.requestNumber) {
    return <Navigate to="/register" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mb-4 flex justify-end">
          <LanguageSwitch />
        </div>
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">{t('registration.successTitle')}</h1>
        <p className="mt-2 text-slate-600">{t('registration.successBody')}</p>
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">{t('registration.requestNumber')}</p>
          <p className="mt-1 text-2xl font-bold tracking-normal text-slate-950">{state.requestNumber}</p>
        </div>
        <Link
          to="/register"
          className="mt-6 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t('actions.back')}
        </Link>
      </section>
    </main>
  )
}
