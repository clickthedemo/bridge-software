export type RecoverySession = {
  accessToken: string
  refreshToken: string
}

const RECOVERY_SESSION_KEY = 'bridge_password_recovery_session'

export function readRecoverySession(): RecoverySession | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const accessToken = hash.get('access_token') ?? query.get('access_token')
  const refreshToken = hash.get('refresh_token') ?? query.get('refresh_token')
  const type = hash.get('type') ?? query.get('type')

  if (!accessToken || !refreshToken || (type && type !== 'recovery')) {
    const storedSession = sessionStorage.getItem(RECOVERY_SESSION_KEY)
    if (!storedSession) return null

    try {
      return JSON.parse(storedSession) as RecoverySession
    } catch {
      sessionStorage.removeItem(RECOVERY_SESSION_KEY)
      return null
    }
  }

  const session = { accessToken, refreshToken }
  sessionStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify(session))
  window.history.replaceState({}, document.title, window.location.pathname)
  return session
}

export function clearRecoverySession() {
  sessionStorage.removeItem(RECOVERY_SESSION_KEY)
}

export function validateNewPassword(password: string): string | null {
  if (password.length < 12) return 'Use at least 12 characters.'
  if (password.length > 128) return 'Use no more than 128 characters.'
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.'
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Add at least one number.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Add at least one special character.'
  return null
}
