import { apiBaseUrl, apiRequest } from '../../shared/api/baseApi'
import type { PaginatedResponse, RegistrationRequest, RequestDetail } from '../../shared/types/api'

export type ArchivedFilter = 'false' | 'true' | 'all'
export type SortBy = 'createdAt' | 'fullName' | 'age' | 'major' | 'city' | 'state' | 'requestNumber'
export type SortDir = 'asc' | 'desc'

export type RequestListParams = {
  page: number
  pageSize: number
  search?: string
  state?: string
  major?: string
  city?: string
  archived: ArchivedFilter
  from?: string
  to?: string
  sortBy: SortBy
  sortDir: SortDir
}

function buildSearchParams(params: Partial<RequestListParams>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

export function listRequests(params: RequestListParams) {
  return apiRequest<PaginatedResponse<RegistrationRequest>>(
    `/admin/requests?${buildSearchParams(params)}`,
  )
}

export function getRequest(id: string) {
  return apiRequest<RequestDetail>(`/admin/requests/${id}`)
}

export function changeRequestState(input: { id: string; stateId: string }) {
  return apiRequest<{ requestNumber: string; state: string; message: string }>(
    `/admin/requests/${input.id}/state`,
    {
      method: 'PATCH',
      body: { stateId: input.stateId },
    },
  )
}

export function addRequestNote(input: { id: string; body: string }) {
  return apiRequest<{ message: string }>(`/admin/requests/${input.id}/notes`, {
    method: 'POST',
    body: { body: input.body },
  })
}

export function archiveRequest(input: { id: string; archived: boolean }) {
  return apiRequest<{ requestNumber: string; archived: boolean; message: string }>(
    `/admin/requests/${input.id}/archive`,
    {
      method: 'PATCH',
      body: { archived: input.archived },
    },
  )
}

export function exportRequestsUrl(params: Partial<RequestListParams>) {
  const query = buildSearchParams(params)
  return `${apiBaseUrl}/admin/requests/export.csv${query ? `?${query}` : ''}`
}
