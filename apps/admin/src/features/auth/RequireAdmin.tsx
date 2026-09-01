import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAdmin() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <div className="route-loader" role="status">Loading BRIDGE...</div>
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
