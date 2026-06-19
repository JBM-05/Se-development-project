import { useState, type FormEvent } from 'react'
import { Loader2, LockKeyhole } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { credentialsReceived } from '../../features/auth/authSlice'
import { login } from '../../features/auth/authApi'
import { LanguageSwitch } from '../../features/layout/LanguageSwitch'
import { toUiError } from '../../shared/api/errorHandling'

export function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAppSelector((state) => state.auth.token)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<unknown>()
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/admin'

  if (token) {
    return <Navigate to="/admin" replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(undefined)
    try {
      const result = await login({ email, password })
      dispatch(credentialsReceived(result))
      navigate(from, { replace: true })
    } catch (loginError) {
      setError(loginError)
    } finally {
      setIsLoading(false)
    }
  }

  const uiError = error ? toUiError(error) : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <LockKeyhole className="mb-3 h-6 w-6 text-slate-500" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-slate-950">{t('auth.title')}</h1>
            <p className="mt-2 text-sm text-slate-600">{t('auth.subtitle')}</p>
          </div>
          <LanguageSwitch />
        </div>
        <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)}>
          {uiError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
              {uiError.code === 'UNAUTHORIZED' ? t('auth.invalid') : uiError.message}
            </div>
          ) : null}
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">{t('auth.email')}</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">{t('auth.password')}</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {t('actions.login')}
          </button>
        </form>
      </section>
    </main>
  )
}
