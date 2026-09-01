import { FormEvent, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AlertMessage } from '../../components/feedback/AlertMessage'
import { authApi } from '../../features/auth/authApi'
import { getPasswordRecoveryError } from '../../features/auth/getPasswordRecoveryError'
import type { LoginErrorMessage } from '../../features/auth/getLoginErrorMessage'
import {
  clearRecoverySession,
  readRecoverySession,
  validateNewPassword,
} from '../../features/auth/passwordRecovery'

export function ResetPasswordPage() {
  const [recoverySession] = useState(readRecoverySession)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<LoginErrorMessage | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!recoverySession) {
      setError({ title: 'Recovery link unavailable', message: 'Request a new recovery email to continue.' })
      return
    }

    const passwordError = validateNewPassword(password)
    if (passwordError) {
      setError({ title: 'Password requirements not met', message: passwordError })
      return
    }

    if (password !== confirmation) {
      setError({ title: 'Passwords do not match', message: 'Enter the same new password in both fields.' })
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.resetPassword(
        { newPassword: password, refreshToken: recoverySession.refreshToken },
        recoverySession.accessToken,
      )
      clearRecoverySession()
      setIsComplete(true)
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
          <section className="login-intro" aria-labelledby="reset-title">
            <p className="section-label">SECURE RECOVERY</p>
            <h1 id="reset-title">New password.</h1>
            <p className="intro-copy">Choose a strong password to restore access to BRIDGE administration.</p>
          </section>

          <section className="login-panel" aria-label="Set new password">
            <div className="panel-heading">
              <p className="section-label">PASSWORD RESET</p>
              <h2>Set new password</h2>
              <p>Use a password you have not used before.</p>
            </div>

            {isComplete ? (
              <div className="recovery-result">
                <AlertMessage variant="success" title="Password updated"
                  message="Your password has been changed. You can now sign in with the new password." />
                <Link className="submit-button recovery-action" to="/login">Continue to sign in</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {!recoverySession && (
                  <AlertMessage title="Recovery link unavailable"
                    message="This link is invalid or has expired. Request a new recovery email." />
                )}

                <div className="field-group">
                  <label htmlFor="new-password">New password</label>
                  <div className="password-field">
                    <input id="new-password" name="newPassword" type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password" placeholder="Enter a new password" value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isSubmitting || !recoverySession} minLength={12} maxLength={128} required />
                    <button className="visibility-button" type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input id="confirm-password" name="confirmation" type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password" placeholder="Repeat the new password" value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    disabled={isSubmitting || !recoverySession} minLength={12} maxLength={128} required />
                </div>

                <p className="password-requirements">12-128 characters with uppercase, lowercase, number, and special character.</p>
                {error && <AlertMessage title={error.title} message={error.message} />}

                <button className="submit-button" type="submit" disabled={isSubmitting || !recoverySession}>
                  <span>{isSubmitting ? 'Updating password...' : 'Update password'}</span>
                  <KeyRound size={20} aria-hidden="true" />
                </button>
              </form>
            )}

            {!isComplete && <Link className="back-link" to="/login"><ArrowLeft size={17} />Back to sign in</Link>}
          </section>
        </div>

        <footer><span>BRIDGE Platform Administration</span><span>Private and secure</span></footer>
      </div>
    </main>
  )
}
