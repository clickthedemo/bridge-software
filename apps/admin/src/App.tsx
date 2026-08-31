import { FormEvent, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1'

type LoginResponse = {
  accessToken?: string
  access_token?: string
  token?: string
  message?: string
  data?: { accessToken?: string; access_token?: string; token?: string }
}

function getAccessToken(response: LoginResponse) {
  return response.accessToken ?? response.access_token ?? response.token ??
    response.data?.accessToken ?? response.data?.access_token ?? response.data?.token
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'superadmin' }),
      })
      const result = (await response.json().catch(() => ({}))) as LoginResponse

      if (!response.ok) throw new Error(result.message ?? 'Email or password is incorrect.')

      const accessToken = getAccessToken(result)
      if (!accessToken) throw new Error('The login response did not include an access token.')

      sessionStorage.setItem('bridge_admin_access_token', accessToken)
      window.location.assign('/')
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError('Unable to reach the BRIDGE API. Please try again shortly.')
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <header className="brand" aria-label="BRIDGE admin">
          <img src="/bridge-mark.svg" alt="" className="brand-mark" />
          <span>BRIDGE</span>
        </header>

        <div className="login-layout">
          <section className="login-intro" aria-labelledby="login-title">
            <p className="section-label">ADMINISTRATION</p>
            <h1 id="login-title">Welcome back.</h1>
            <p className="intro-copy">Sign in to review verification cases and manage the BRIDGE platform.</p>
           
          </section>

          <section className="login-panel" aria-label="Super admin sign in">
            <div className="panel-heading">
              <p className="section-label">SECURE ACCESS</p>
              <h2>Sign in</h2>
              <p>Enter your administrator credentials.</p>
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
                  <a href="/forgot-password">Forgot password?</a>
                </div>
                <div className="password-field">
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" placeholder="Enter your password" value={password}
                    onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting}
                    minLength={8} required />
                  <button className="visibility-button" type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && <p className="form-error" role="alert">{error}</p>}

              <button className="submit-button" type="submit" disabled={isSubmitting}>
                <span>{isSubmitting ? 'Signing in...' : 'Sign in to BRIDGE'}</span>
                <ArrowRight size={20} aria-hidden="true" />
              </button>
            </form>

            <p className="security-note">Protected administrative access</p>
          </section>
        </div>

        <footer><span>BRIDGE Platform Administration</span><span>Private and secure</span></footer>
      </div>
    </main>
  )
}

export default App
