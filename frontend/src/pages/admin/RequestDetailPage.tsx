import { useCallback, useState, type FormEvent } from 'react'
import { Archive, ArrowLeft, Loader2, RotateCcw, Save } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  addRequestNote,
  archiveRequest,
  changeRequestState,
  getRequest,
} from '../../features/requests/requestsApi'
import { listStates } from '../../features/states/statesApi'
import { LoadingState } from '../../shared/components/LoadingState'
import { StateBadge } from '../../shared/components/StateBadge'
import { formatDateTime } from '../../shared/lib/format'
import { toUiError } from '../../shared/api/errorHandling'
import { useAsyncData, useAsyncMutation } from '../../shared/api/hooks'

export function RequestDetailPage() {
  const { id } = useParams()
  const requestId = id ?? ''
  const { t, i18n } = useTranslation()
  const [note, setNote] = useState('')
  const loadRequest = useCallback(() => getRequest(requestId), [requestId])
  const loadStates = useCallback(() => listStates(), [])
  const { data: request, isLoading, error, refetch } = useAsyncData(loadRequest, Boolean(requestId))
  const { data: states } = useAsyncData(loadStates)
  const [changeState, stateMutation] = useAsyncMutation(changeRequestState)
  const [addNote, noteMutation] = useAsyncMutation(addRequestNote)
  const [setArchived, archiveMutation] = useAsyncMutation(archiveRequest)

  if (!id) {
    return <Navigate to="/admin/requests" replace />
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error || !request) {
    const uiError = error ? toUiError(error) : null
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
        {uiError?.message ?? t('app.unknownError')}
      </div>
    )
  }

  async function onStateChange(stateId: string) {
    await changeState({ id: requestId, stateId })
    await refetch()
  }

  async function onAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = note.trim()
    if (!body || body.length > 4000) {
      return
    }
    await addNote({ id: requestId, body })
    setNote('')
    await refetch()
  }

  async function onArchive(archived: boolean) {
    if (archived && !window.confirm(t('requests.confirmArchive'))) {
      return
    }
    await setArchived({ id: requestId, archived })
    await refetch()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/requests"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('actions.back')}
          </Link>
          <h1 className="text-2xl font-bold text-slate-950">{request.request_number}</h1>
        </div>
        <button
          type="button"
          onClick={() => void onArchive(!request.archived_at)}
          disabled={archiveMutation.isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {request.archived_at ? (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Archive className="h-4 w-4" aria-hidden="true" />
          )}
          {request.archived_at ? t('actions.unarchive') : t('actions.archive')}
        </button>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-950">{t('requests.applicant')}</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              [t('requests.fullName'), request.full_name],
              [t('requests.age'), String(request.age)],
              [t('requests.major'), request.major],
              [t('requests.city'), request.city],
              [t('requests.createdAt'), formatDateTime(request.created_at, i18n.language)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-950">{t('requests.contact')}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p>
              <span className="font-semibold text-slate-500">{t('requests.phone')}: </span>
              <a className="font-medium text-slate-950" href={`tel:${request.phone}`}>
                {request.phone}
              </a>
            </p>
            <p>
              <span className="font-semibold text-slate-500">{t('requests.email')}: </span>
              <a className="font-medium text-slate-950" href={`mailto:${request.email}`}>
                {request.email}
              </a>
            </p>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-slate-700">{t('requests.state')}</p>
            <StateBadge state={request} />
          </div>
          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-700">{t('requests.changeState')}</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={request.state_id}
              onChange={(event) => void onStateChange(event.target.value)}
              disabled={stateMutation.isLoading}
            >
              {states?.data.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-950">{t('requests.notes')}</h2>
          <form className="mt-4" onSubmit={(event) => void onAddNote(event)}>
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              value={note}
              maxLength={4000}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t('requests.notePlaceholder')}
            />
            <button
              type="submit"
              disabled={noteMutation.isLoading || !note.trim()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
            >
              {noteMutation.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {t('requests.addNote')}
            </button>
          </form>
          <div className="mt-5 space-y-3">
            {request.notes.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-800">{item.body}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {item.admin.email} · {formatDateTime(item.created_at, i18n.language)}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-950">{t('requests.auditLog')}</h2>
          <div className="mt-4 space-y-3">
            {request.action_logs.map((item) => (
              <article key={item.id} className="border-s border-slate-200 ps-4">
                <p className="text-sm font-semibold text-slate-950">
                  {t(`status.${item.action}`, item.action)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.admin?.email ?? item.actor_type} · {formatDateTime(item.created_at, i18n.language)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
