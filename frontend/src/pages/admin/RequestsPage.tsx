import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Download, Eye, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  exportRequestsUrl,
  listRequests,
  type ArchivedFilter,
  type RequestListParams,
  type SortBy,
} from '../../features/requests/requestsApi'
import { listStates } from '../../features/states/statesApi'
import { StateBadge } from '../../shared/components/StateBadge'
import { EmptyState } from '../../shared/components/EmptyState'
import { LoadingState } from '../../shared/components/LoadingState'
import { formatDateTime, toIsoDateTimeLocal } from '../../shared/lib/format'
import { useAppSelector } from '../../app/hooks'
import { useAsyncData } from '../../shared/api/hooks'

const sortOptions: Array<{ value: SortBy; labelKey: string }> = [
  { value: 'createdAt', labelKey: 'requests.createdAt' },
  { value: 'requestNumber', labelKey: 'requests.requestNumber' },
  { value: 'fullName', labelKey: 'requests.fullName' },
  { value: 'age', labelKey: 'requests.age' },
  { value: 'major', labelKey: 'requests.major' },
  { value: 'city', labelKey: 'requests.city' },
  { value: 'state', labelKey: 'requests.state' },
]
const archivedOptions: ArchivedFilter[] = ['false', 'true', 'all']
const sortValues = sortOptions.map((option) => option.value)

function readPositiveInteger(value: string | null, fallback: number, allowed?: number[]) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }
  if (allowed && !allowed.includes(parsed)) {
    return fallback
  }
  return parsed
}

function readArchived(value: string | null): ArchivedFilter {
  return archivedOptions.includes(value as ArchivedFilter) ? (value as ArchivedFilter) : 'false'
}

function readSortBy(value: string | null): SortBy {
  return sortValues.includes(value as SortBy) ? (value as SortBy) : 'createdAt'
}

function readParams(searchParams: URLSearchParams): RequestListParams {
  return {
    page: readPositiveInteger(searchParams.get('page'), 1),
    pageSize: readPositiveInteger(searchParams.get('pageSize'), 20, [10, 20, 50, 100]),
    search: searchParams.get('search') ?? undefined,
    state: searchParams.get('state') ?? undefined,
    major: searchParams.get('major') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    archived: readArchived(searchParams.get('archived')),
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    sortBy: readSortBy(searchParams.get('sortBy')),
    sortDir: searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc',
  }
}

export function RequestsPage() {
  const { t, i18n } = useTranslation()
  const token = useAppSelector((state) => state.auth.token)
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => readParams(searchParams), [searchParams])
  const [searchDraft, setSearchDraft] = useState(params.search ?? '')
  const loadRequests = useCallback(() => listRequests(params), [params])
  const loadStates = useCallback(() => listStates(), [])
  const { data, isLoading, isFetching } = useAsyncData(loadRequests)
  const { data: states } = useAsyncData(loadStates)

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (searchDraft.trim()) {
        next.set('search', searchDraft.trim())
      } else {
        next.delete('search')
      }
      next.set('page', '1')
      setSearchParams(next, { replace: true })
    }, 300)
    return () => window.clearTimeout(id)
  }, [searchDraft, searchParams, setSearchParams])

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    if (key !== 'page') {
      next.set('page', '1')
    }
    setSearchParams(next)
  }

  function onExport() {
    const url = exportRequestsUrl(params)
    void fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((response) => response.blob())
      .then((blob) => {
        const href = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = href
        link.download = 'registration-requests.csv'
        link.click()
        URL.revokeObjectURL(href)
      })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-950">{t('requests.title')}</h1>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('actions.export')}
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="relative">
            <span className="sr-only">{t('actions.search')}</span>
            <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-slate-400" />
            <input
              className="w-full rounded-lg border border-slate-300 py-2 ps-9 pe-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t('requests.searchPlaceholder')}
            />
          </label>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={params.state ?? ''}
            onChange={(event) => setParam('state', event.target.value || undefined)}
            aria-label={t('requests.state')}
          >
            <option value="">{t('requests.state')}</option>
            {states?.data.map((state) => (
              <option key={state.id} value={state.slug}>
                {state.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={params.major ?? ''}
            onChange={(event) => setParam('major', event.target.value || undefined)}
            placeholder={t('requests.major')}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={params.city ?? ''}
            onChange={(event) => setParam('city', event.target.value || undefined)}
            placeholder={t('requests.city')}
          />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-5">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={params.archived}
            onChange={(event) => setParam('archived', event.target.value)}
            aria-label={t('requests.archived')}
          >
            <option value="false">{t('requests.active')}</option>
            <option value="true">{t('requests.archived')}</option>
            <option value="all">{t('requests.all')}</option>
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={params.sortBy}
            onChange={(event) => setParam('sortBy', event.target.value)}
            aria-label="Sort by"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={params.sortDir}
            onChange={(event) => setParam('sortDir', event.target.value)}
            aria-label="Sort direction"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="datetime-local"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setParam('from', toIsoDateTimeLocal(event.target.value))
            }
            aria-label="From"
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="datetime-local"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setParam('to', toIsoDateTimeLocal(event.target.value))
            }
            aria-label="To"
          />
        </div>
      </section>

      {isLoading ? (
        <LoadingState />
      ) : data?.data.length ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-start text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  {[
                    'requests.requestNumber',
                    'requests.fullName',
                    'requests.major',
                    'requests.city',
                    'requests.state',
                    'requests.createdAt',
                    '',
                  ].map((label) => (
                    <th key={label || 'actions'} className="px-4 py-3 text-start">
                      {label ? t(label) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950">
                      {request.request_number}
                    </td>
                    <td className="min-w-52 px-4 py-3">
                      <div className="font-medium text-slate-950">{request.full_name}</div>
                      <div className="text-xs text-slate-500">{request.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{request.major}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{request.city}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StateBadge state={request} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTime(request.created_at, i18n.language)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-end">
                      <Link
                        to={`/admin/requests/${request.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('actions.view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {data.pagination.total.toLocaleString()} total {isFetching ? '...' : ''}
            </p>
            <div className="flex items-center gap-2">
              <select
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                value={params.pageSize}
                onChange={(event) => setParam('pageSize', event.target.value)}
                aria-label="Page size"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                disabled={params.page <= 1}
                onClick={() => setParam('page', String(params.page - 1))}
              >
                Prev
              </button>
              <span className="text-sm text-slate-600">
                {params.page} / {Math.max(data.pagination.totalPages, 1)}
              </span>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                disabled={params.page >= data.pagination.totalPages}
                onClick={() => setParam('page', String(params.page + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      ) : (
        <EmptyState title={t('requests.noRows')} body={t('requests.noRowsBody')} />
      )}
    </div>
  )
}
