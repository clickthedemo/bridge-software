import { FormEvent, useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertMessage } from '../../components/feedback/AlertMessage'
import { useAuth } from '../../features/auth/AuthContext'
import { getLoginErrorMessage, type LoginErrorMessage } from '../../features/auth/getLoginErrorMessage'

type LoginLocationState = { from?: string }

export function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<LoginErrorMessage | null>(null)

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
      const state = location.state as LoginLocationState | null
      navigate(state?.from ?? '/dashboard', { replace: true })
    } catch (requestError) {
      setError(getLoginErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <header className="brand" aria-label="BRIDGE">
          <img src="/bridge-mark.svg" alt="" className="brand-mark" />
          <span>BRIDGE</span>
        </header>

        <div className="login-layout">
          <section className="login-intro" aria-labelledby="login-title">
            <p className="section-label">ROLE-BASED PORTAL</p>
            <h1 id="login-title">Welcome back.</h1>
            <p className="intro-copy">Sign in to access the tools available to your brand, retailer, sales rep, or admin role.</p>
          </section>

          <section className="login-panel" aria-label="BRIDGE sign in">
            <div className="panel-heading">
              <p className="section-label">SECURE ACCESS</p>
              <h2>Sign in</h2>
              <p>Enter your BRIDGE credentials.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" autoComplete="username"
                  placeholder="admin@bridge.com" value={email}
                  onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} required />
              </div>

              <div className="field-group">
                <div className="field-label-row">
                  <label htmlFor="password">Password</label>
                  <Link to="/auth/forgot-password">Forgot password?</Link>
                </div>
                <div className="password-field">
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" placeholder="Enter your password" value={password}
                    onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting}
                    maxLength={128} required />
                  <button className="visibility-button" type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && <AlertMessage title={error.title} message={error.message} />}

              <button className="submit-button" type="submit" disabled={isSubmitting || status === 'loading'}>
                <span>{isSubmitting ? 'Signing in...' : 'Sign in to BRIDGE'}</span>
                <ArrowRight size={20} aria-hidden="true" />
              </button>
            </form>

            <p className="security-note">Access is determined by your assigned roles</p>
          </section>
        </div>

        <footer><span>BRIDGE Role-Based Portal</span><span>Private and secure</span></footer>
      </div>
    </main>
  )
}
