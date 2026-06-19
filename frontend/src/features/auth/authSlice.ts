import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AdminProfile } from '../../shared/types/api'

const tokenStorageKey = 'event-registration-token'

type AuthState = {
  token: string | null
  admin: AdminProfile | null
}

const initialState: AuthState = {
  token: localStorage.getItem(tokenStorageKey),
  admin: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsReceived(
      state,
      action: PayloadAction<{ accessToken: string; admin: AdminProfile }>,
    ) {
      state.token = action.payload.accessToken
      state.admin = action.payload.admin
      localStorage.setItem(tokenStorageKey, action.payload.accessToken)
    },
    adminReceived(state, action: PayloadAction<AdminProfile>) {
      state.admin = action.payload
    },
    loggedOut(state) {
      state.token = null
      state.admin = null
      localStorage.removeItem(tokenStorageKey)
    },
  },
})

export const { adminReceived, credentialsReceived, loggedOut } = authSlice.actions
export default authSlice.reducer
