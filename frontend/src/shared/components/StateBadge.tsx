import type { RegistrationRequest, RequestState } from '../types/api'

type StateBadgeProps = {
  state:
    | Pick<RequestState, 'name' | 'slug' | 'color'>
    | Pick<RegistrationRequest, 'state_name' | 'state_slug' | 'state_color'>
}

export function StateBadge({ state }: StateBadgeProps) {
  const name = 'name' in state ? state.name : state.state_name
  const slug = 'slug' in state ? state.slug : state.state_slug
  const color = 'color' in state ? state.color : state.state_color

  return (
    <span
      className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold text-slate-800"
      style={{ borderColor: color, backgroundColor: `${color}18` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span>{name || slug}</span>
    </span>
  )
}
