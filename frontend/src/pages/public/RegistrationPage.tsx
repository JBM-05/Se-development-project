import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FieldError } from '../../shared/components/FieldError'
import { toUiError, firstFieldError } from '../../shared/api/errorHandling'
import { useGsapFadeIn } from '../../shared/hooks/useGsapFadeIn'
import { submitRegistration } from '../../features/registration/registrationApi'
import { LanguageSwitch } from '../../features/layout/LanguageSwitch'

type FormState = {
  fullName: string
  age: string
  major: string
  phone: string
  email: string
  city: string
}

const initialForm: FormState = {
  fullName: '',
  age: '',
  major: '',
  phone: '',
  email: '',
  city: '',
}

function validate(form: FormState, t: (key: string) => string) {
  const fields: Record<string, string[]> = {}
  if (form.fullName.trim().split(/\s+/).filter(Boolean).length < 3) {
    fields.fullName = [t('validation.fullName')]
  }
  const age = Number(form.age)
  if (!Number.isInteger(age) || age < 18 || age > 100) {
    fields.age = [t('validation.age')]
  }
  ;(['major', 'city'] as const).forEach((key) => {
    if (!form[key].trim()) {
      fields[key] = [t('validation.required')]
    }
  })
  if (!/^\+?[0-9\s-]{7,20}$/.test(form.phone.trim())) {
    fields.phone = [t('validation.phone')]
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    fields.email = [t('validation.email')]
  }
  return fields
}

export function RegistrationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pageRef = useGsapFadeIn<HTMLDivElement>()
  const [form, setForm] = useState(initialForm)
  const [clientFields, setClientFields] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<unknown>()
  const apiError = error ? toUiError(error) : null
  const fields = { ...clientFields, ...(apiError?.fields ?? {}) }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextFields = validate(form, t)
    setClientFields(nextFields)
    if (Object.keys(nextFields).length > 0) {
      return
    }

    setIsLoading(true)
    setError(undefined)
    try {
      const result = await submitRegistration({
        fullName: form.fullName.trim(),
        age: Number(form.age),
        major: form.major.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
      })

      navigate('/register/success', { state: result })
    } catch (registrationError) {
      setError(registrationError)
    } finally {
      setIsLoading(false)
    }
  }

  const duplicateMessage =
    apiError?.code === 'DUPLICATE_REGISTRATION'
      ? t('registration.duplicate', {
          conflicts: apiError.conflicts
            .map((item) =>
              item === 'phone' ? t('registration.phoneConflict') : t('registration.emailConflict'),
            )
            .join(', '),
        })
      : undefined

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <section className="flex flex-col justify-between gap-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {t('app.name')}
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
                {t('registration.title')}
              </h1>
            </div>
            <LanguageSwitch />
          </div>
          <p className="max-w-xl text-lg leading-8 text-slate-600">{t('registration.subtitle')}</p>

        </section>

        <section ref={pageRef} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)} noValidate>
            {apiError && apiError.code !== 'VALIDATION_ERROR' ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
                {duplicateMessage ?? apiError.message}
              </div>
            ) : null}
            {[
              ['fullName', t('registration.fullName'), 'text'],
              ['age', t('registration.age'), 'number'],
              ['major', t('registration.major'), 'text'],
              ['phone', t('registration.phone'), 'tel'],
              ['email', t('registration.email'), 'email'],
              ['city', t('registration.city'), 'text'],
            ].map(([key, label, type]) => {
              const errorId = `${key}-error`
              return (
                <label key={key} className="block">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                    type={type}
                    value={form[key as keyof FormState]}
                    min={key === 'age' ? 18 : undefined}
                    max={key === 'age' ? 100 : undefined}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, [key]: event.target.value }))
                    }
                    aria-invalid={Boolean(firstFieldError(fields, key))}
                    aria-describedby={firstFieldError(fields, key) ? errorId : undefined}
                  />
                  <FieldError id={errorId} message={firstFieldError(fields, key)} />
                </label>
              )
            })}
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {t('actions.register')}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
