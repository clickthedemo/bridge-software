import { LogOut, ShieldX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

export function UnauthorizedPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="access-denied-page">
      <section className="access-denied-card">
        <ShieldX size={42} aria-hidden="true" />
        <p className="section-label">ACCESS DENIED</p>
        <h1>You don’t have access to this area.</h1>
        <p>Your account is signed in, but it has no role authorized for this page.</p>
        <button className="logout-button" type="button" onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          Sign in with another account
        </button>
      </section>
    </main>
  )
}
