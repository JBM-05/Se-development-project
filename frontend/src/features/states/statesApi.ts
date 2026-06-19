import { apiRequest } from '../../shared/api/baseApi'
import type { RequestState } from '../../shared/types/api'

export type StatesResponse = {
  data: RequestState[]
}

export type CreateStateInput = {
  name: string
  slug: string
  color: string
  sortOrder: number
}

export type UpdateStateInput = {
  id: string
  name: string
  color: string
  sortOrder: number
}

export function listStates() {
  return apiRequest<StatesResponse>('/admin/states')
}

export function createState(input: CreateStateInput) {
  return apiRequest<RequestState>('/admin/states', {
    method: 'POST',
    body: input,
  })
}

export function updateState({ id, ...body }: UpdateStateInput) {
  return apiRequest<RequestState>(`/admin/states/${id}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteState(input: { id: string; transferToStateId?: string }) {
  return apiRequest<void>(`/admin/states/${input.id}`, {
    method: 'DELETE',
    body: input.transferToStateId ? { transferToStateId: input.transferToStateId } : {},
  })
}
