import { apiRequest } from '../../shared/api/baseApi'
import type { AdminProfile } from '../../shared/types/api'

export type LoginInput = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  admin: AdminProfile
}

export type MeResponse = {
  admin: AdminProfile
}

export function login(input: LoginInput) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: input,
  })
}

export function getMe() {
  return apiRequest<MeResponse>('/auth/me')
}
