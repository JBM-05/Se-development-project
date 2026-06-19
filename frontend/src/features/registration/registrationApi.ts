import { apiRequest } from '../../shared/api/baseApi'

export type RegistrationInput = {
  fullName: string
  age: number
  major: string
  phone: string
  email: string
  city: string
}

export type RegistrationResponse = {
  requestNumber: string
  state: string
  message: string
}

export function submitRegistration(input: RegistrationInput) {
  return apiRequest<RegistrationResponse>('/registrations', {
    method: 'POST',
    body: input,
  })
}
