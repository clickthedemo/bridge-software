import { FormEvent, useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AlertMessage } from '../../components/feedback/AlertMessage'
import { authApi } from '../../features/auth/authApi'
import { getPasswordRecoveryError } from '../../features/auth/getPasswordRecoveryError'
import type { LoginErrorMessage } from '../../features/auth/getLoginErrorMessage'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<LoginErrorMessage | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await authApi.forgotPassword(email)
      setIsSent(true)
    } catch (requestError) {
      setError(getPasswordRecoveryError(requestError))
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
          <section className="login-intro" aria-labelledby="forgot-title">
            <p className="section-label">ACCOUNT RECOVERY</p>
            <h1 id="forgot-title">Reset access.</h1>
            <p className="intro-copy">Request a secure recovery link for your BRIDGE administrator account.</p>
          </section>

          <section className="login-panel" aria-label="Request password reset">
            <div className="panel-heading">
              <p className="section-label">PASSWORD RECOVERY</p>
              <h2>Forgot password?</h2>
              <p>Enter the email connected to your admin account.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="recovery-email">Email address</label>
                <input id="recovery-email" name="email" type="email" autoComplete="email"
                  placeholder="admin@bridge.com" value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting || isSent} maxLength={254} required />
              </div>

              {error && <AlertMessage title={error.title} message={error.message} />}
              {isSent && (
                <AlertMessage variant="success" title="Check your email"
                  message="If an eligible account exists, a secure recovery link has been sent." />
              )}

              {!isSent && (
                <button className="submit-button" type="submit" disabled={isSubmitting}>
                  <span>{isSubmitting ? 'Sending link...' : 'Send recovery link'}</span>
                  <Mail size={20} aria-hidden="true" />
                </button>
              )}
            </form>

            <Link className="back-link" to="/login"><ArrowLeft size={17} />Back to sign in</Link>
          </section>
        </div>

        <footer><span>BRIDGE Platform Administration</span><span>Private and secure</span></footer>
      </div>
    </main>
  )
}
