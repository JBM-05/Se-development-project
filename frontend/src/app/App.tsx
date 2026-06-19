import { Navigate, Route, Routes } from 'react-router-dom'
import { useDocumentLanguage } from '../shared/i18n/useDocumentLanguage'
import { AdminLayout } from '../features/layout/AdminLayout'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { LoginPage } from '../pages/admin/LoginPage'
import { DashboardPage } from '../pages/admin/DashboardPage'
import { RequestDetailPage } from '../pages/admin/RequestDetailPage'
import { RequestsPage } from '../pages/admin/RequestsPage'
import { StatesPage } from '../pages/admin/StatesPage'
import { RegistrationPage } from '../pages/public/RegistrationPage'
import { RegistrationSuccessPage } from '../pages/public/RegistrationSuccessPage'
import { NotFoundPage } from '../pages/public/NotFoundPage'

export default function App() {
  useDocumentLanguage()

  return (
    <Routes>
      <Route path="/" element={<RegistrationPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/register/success" element={<RegistrationSuccessPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="states" element={<StatesPage />} />
        <Route path="settings" element={<Navigate to="/admin/states" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
