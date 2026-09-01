import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { AppRole } from './types'

type RequireRoleProps = {
  allowedRoles: readonly AppRole[]
}

export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { status, hasRole } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <div className="route-loader" role="status">Loading BRIDGE...</div>
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!hasRole(...allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
