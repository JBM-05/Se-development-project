import { useCallback, useState, type FormEvent } from 'react'
import { Lock, Plus, Save, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  createState,
  deleteState,
  listStates,
  updateState,
} from '../../features/states/statesApi'
import { useAsyncData, useAsyncMutation } from '../../shared/api/hooks'
import { LoadingState } from '../../shared/components/LoadingState'
import { StateBadge } from '../../shared/components/StateBadge'
import type { RequestState } from '../../shared/types/api'

type DraftState = {
  name: string
  slug: string
  color: string
  sortOrder: string
}

const initialDraft: DraftState = {
  name: '',
  slug: '',
  color: '#2563eb',
  sortOrder: '50',
}

function slugIsValid(value: string) {
  return /^[a-z][a-z0-9_]*$/.test(value)
}

export function StatesPage() {
  const { t } = useTranslation()
  const loadStates = useCallback(() => listStates(), [])
  const { data, isLoading, refetch } = useAsyncData(loadStates)
  const [draft, setDraft] = useState(initialDraft)
  const [editing, setEditing] = useState<Record<string, DraftState>>({})
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>({})
  const [runCreateState, createMutation] = useAsyncMutation(createState)
  const [runUpdateState, updateMutation] = useAsyncMutation(updateState)
  const [runDeleteState, deleteMutation] = useAsyncMutation(deleteState)

  if (isLoading || !data) {
    return <LoadingState />
  }

  function editDraft(state: RequestState) {
    return (
      editing[state.id] ?? {
        name: state.name,
        slug: state.slug,
        color: state.color,
        sortOrder: String(state.sort_order),
      }
    )
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.name.trim() || !slugIsValid(draft.slug)) {
      return
    }
    await runCreateState({
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      color: draft.color,
      sortOrder: Number(draft.sortOrder),
    })
    setDraft(initialDraft)
    await refetch()
  }

  async function onUpdate(state: RequestState) {
    const current = editDraft(state)
    await runUpdateState({
      id: state.id,
      name: current.name.trim(),
      color: current.color,
      sortOrder: Number(current.sortOrder),
    })
    setEditing((values) => {
      const next = { ...values }
      delete next[state.id]
      return next
    })
    await refetch()
  }

  async function onDelete(state: RequestState) {
    await runDeleteState({ id: state.id, transferToStateId: transferTargets[state.id] })
    await refetch()
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-950">{t('states.title')}</h1>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_0.7fr_0.6fr_auto]" onSubmit={(event) => void onCreate(event)}>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder={t('states.name')}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={draft.slug}
            onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
            placeholder={t('states.slug')}
            pattern="[a-z][a-z0-9_]*"
            required
          />
          <input
            className="h-10 rounded-lg border border-slate-300 px-2 py-1"
            type="color"
            value={draft.color}
            onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
            aria-label={t('states.color')}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="number"
            value={draft.sortOrder}
            onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))}
            placeholder={t('states.sortOrder')}
            required
          />
          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('actions.create')}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {data.data.map((state) => {
          const current = editDraft(state)
          return (
            <article key={state.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr_0.5fr_0.5fr_auto] lg:items-center">
                <div className="space-y-2">
                  <StateBadge state={state} />
                  {state.is_system ? (
                    <span className="ms-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('states.locked')}
                    </span>
                  ) : null}
                </div>
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={current.name}
                  disabled={state.is_system}
                  onChange={(event) =>
                    setEditing((values) => ({
                      ...values,
                      [state.id]: { ...current, name: event.target.value },
                    }))
                  }
                  aria-label={t('states.name')}
                />
                <input
                  className="h-10 rounded-lg border border-slate-300 px-2 py-1"
                  type="color"
                  value={current.color}
                  disabled={state.is_system}
                  onChange={(event) =>
                    setEditing((values) => ({
                      ...values,
                      [state.id]: { ...current, color: event.target.value },
                    }))
                  }
                  aria-label={t('states.color')}
                />
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  type="number"
                  value={current.sortOrder}
                  disabled={state.is_system}
                  onChange={(event) =>
                    setEditing((values) => ({
                      ...values,
                      [state.id]: { ...current, sortOrder: event.target.value },
                    }))
                  }
                  aria-label={t('states.sortOrder')}
                />
                <button
                  type="button"
                  disabled={state.is_system || updateMutation.isLoading}
                  onClick={() => void onUpdate(state)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {t('actions.save')}
                </button>
              </div>
              {!state.is_system ? (
                <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 lg:grid-cols-[1fr_auto]">
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={transferTargets[state.id] ?? ''}
                    onChange={(event) =>
                      setTransferTargets((values) => ({ ...values, [state.id]: event.target.value }))
                    }
                    aria-label={t('states.transferTo')}
                  >
                    <option value="">{t('states.transferTo')}</option>
                    {data.data
                      .filter((item) => item.id !== state.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={deleteMutation.isLoading}
                    onClick={() => void onDelete(state)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t('actions.delete')}
                  </button>
                </div>
              ) : null}
            </article>
          )
        })}
      </section>
    </div>
  )
}
