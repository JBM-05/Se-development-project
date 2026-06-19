import { Navigate, useLocation } from 'react-router-dom'
import { useCallback, useEffect, type ReactNode } from 'react'
import { getMe } from './authApi'
import { adminReceived } from './authSlice'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { useAsyncData } from '../../shared/api/hooks'
import { LoadingState } from '../../shared/components/LoadingState'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.token)
  const admin = useAppSelector((state) => state.auth.admin)
  const shouldLoadAdmin = Boolean(token && !admin)
  const loadAdmin = useCallback(() => getMe(), [])
  const { data, error, isLoading, isFetching } = useAsyncData(loadAdmin, shouldLoadAdmin)

  useEffect(() => {
    if (data?.admin) {
      dispatch(adminReceived(data.admin))
    }
  }, [data, dispatch])

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!admin && error) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!admin && (isLoading || isFetching)) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <LoadingState />
      </main>
    )
  }

  return children
}
