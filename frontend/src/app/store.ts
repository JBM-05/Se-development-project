import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import layoutReducer from '../features/layout/layoutSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    layout: layoutReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
