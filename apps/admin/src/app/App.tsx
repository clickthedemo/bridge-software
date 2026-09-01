import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ALL_APP_ROLES } from '../features/auth/accessControl'
import { RequireRole } from '../features/auth/RequireRole'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { ForgotPasswordPage } from '../pages/forgot-password/ForgotPasswordPage'
import { LoginPage } from '../pages/login/LoginPage'
import { ResetPasswordPage } from '../pages/reset-password/ResetPasswordPage'
import { PasswordPage } from '../pages/settings/PasswordPage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { UnauthorizedPage } from '../pages/unauthorized/UnauthorizedPage'
import { CreateUserPage } from '../pages/users/CreateUserPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route element={<RequireRole allowedRoles={ALL_APP_ROLES} />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/password" element={<PasswordPage />} />
          <Route element={<RequireRole allowedRoles={['admin']} />}>
            <Route path="/users/new" element={<CreateUserPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
