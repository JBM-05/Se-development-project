import type { SerializedError } from '@reduxjs/toolkit'
import { ApiRequestError } from './baseApi'

export type UiError = {
  code: string
  message: string
  fields: Record<string, string[]>
  conflicts: string[]
}

export function toUiError(error: unknown): UiError {
  const fallback: UiError = {
    code: 'UNKNOWN_ERROR',
    message: 'Something went wrong. Please try again.',
    fields: {},
    conflicts: [],
  }

  if (!error || typeof error !== 'object') {
    return fallback
  }

  if (error instanceof ApiRequestError) {
    if (error.status === 'FETCH_ERROR') {
      return {
        ...fallback,
        code: 'NETWORK_ERROR',
        message: 'The API is unavailable. Check the backend and retry.',
      }
    }

    const payload = error.data
    return {
      code: payload?.error?.code ?? String(error.status),
      message: payload?.error?.message ?? fallback.message,
      fields: payload?.error?.fields ?? {},
      conflicts: payload?.error?.conflicts ?? [],
    }
  }

  const serializedError = error as SerializedError
  if ('message' in serializedError && typeof serializedError.message === 'string') {
    return { ...fallback, message: serializedError.message }
  }

  return fallback
}

export function firstFieldError(
  fields: Record<string, string[]>,
  key: string,
): string | undefined {
  return fields[key]?.[0]
}
