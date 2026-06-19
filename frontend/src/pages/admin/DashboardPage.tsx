import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getStats } from '../../features/stats/statsApi'
import { listStates } from '../../features/states/statesApi'
import { useAsyncData } from '../../shared/api/hooks'
import { LoadingState } from '../../shared/components/LoadingState'

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-normal text-slate-950">{value.toLocaleString()}</p>
    </div>
  )
}

function BarList({
  title,
  rows,
  colorFor,
}: {
  title: string
  rows: Array<{ label: string; count: number }>
  colorFor?: (label: string) => string | undefined
}) {
  const max = Math.max(...rows.map((row) => row.count), 1)

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No data</p>
        ) : (
          rows.slice(0, 8).map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                <span className="truncate font-medium text-slate-700">{row.label}</span>
                <span className="font-semibold text-slate-950">{row.count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-800"
                  style={{
                    width: `${Math.max((row.count / max) * 100, 4)}%`,
                    backgroundColor: colorFor?.(row.label),
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const loadStats = useCallback(() => getStats(), [])
  const loadStates = useCallback(() => listStates(), [])
  const { data, isLoading } = useAsyncData(loadStats)
  const { data: states } = useAsyncData(loadStates)
  const stateColor = new Map(states?.data.map((state) => [state.slug, state.color]))

  if (isLoading || !data) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-950">{t('stats.title')}</h1>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('stats.totalRequests')} value={data.totalRequests} />
        <MetricCard label={t('stats.approved')} value={data.approved} />
        <MetricCard label={t('stats.underReview')} value={data.underReview} />
        <MetricCard label={t('stats.noReply')} value={data.noReply} />
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <BarList
          title={t('stats.byState')}
          rows={data.byState.map((row) => ({ label: row.state, count: row.count }))}
          colorFor={(label) => stateColor.get(label)}
        />
        <BarList
          title={t('stats.byMajor')}
          rows={data.byMajor.map((row) => ({ label: row.major, count: row.count }))}
        />
        <BarList
          title={t('stats.byCity')}
          rows={data.byCity.map((row) => ({ label: row.city, count: row.count }))}
        />
      </section>
    </div>
  )
}
