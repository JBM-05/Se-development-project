export type ApiErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string[]>
    conflicts?: string[]
  }
}

export type AdminProfile = {
  id: string
  email: string
  role: string
}

export type RequestState = {
  id: string
  name: string
  slug: string
  color: string
  sort_order: number
  is_system: boolean
  created_at: string
  updated_at: string
}

export type RegistrationRequest = {
  id: string
  request_number: string
  full_name: string
  age: number
  major: string
  phone: string
  normalized_phone?: string
  email: string
  normalized_email?: string
  city: string
  state_id: string
  state_name: string
  state_slug: string
  state_color: string
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type RequestNote = {
  id: string
  body: string
  created_at: string
  admin: AdminProfile
}

export type RequestActionLog = {
  id: string
  actor_type: string
  action: string
  metadata: Record<string, unknown>
  created_at: string
  admin: AdminProfile | null
}

export type RequestDetail = RegistrationRequest & {
  notes: RequestNote[]
  action_logs: RequestActionLog[]
}

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: Pagination
}

export type StatsResponse = {
  totalRequests: number
  approved: number
  underReview: number
  noReply: number
  byState: Array<{ state: string; count: number }>
  byMajor: Array<{ major: string; count: number }>
  byCity: Array<{ city: string; count: number }>
}
