import { store } from '../../app/store'
import { loggedOut } from '../../features/auth/authSlice'
import type { ApiErrorPayload } from '../types/api'

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export type ApiErrorStatus = number | 'FETCH_ERROR'

export class ApiRequestError extends Error {
  readonly status: ApiErrorStatus
  readonly data?: ApiErrorPayload

  constructor(status: ApiErrorStatus, message: string, data?: ApiErrorPayload) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.data = data
  }
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = store.getState().auth.token

  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }

  let body: BodyInit | undefined
  if (options.body !== undefined) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
      body,
    })
  } catch {
    throw new ApiRequestError(
      'FETCH_ERROR',
      'The API is unavailable. Check the backend and retry.',
    )
  }

  if (response.status === 401) {
    store.dispatch(loggedOut())
  }

  if (!response.ok) {
    const payload = await readErrorPayload(response)
    throw new ApiRequestError(
      response.status,
      payload?.error?.message ?? 'Something went wrong. Please try again.',
      payload,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function readErrorPayload(response: Response) {
  try {
    return (await response.json()) as ApiErrorPayload
  } catch {
    return undefined
  }
}
