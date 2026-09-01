import type { AuthSession } from './types'

const SESSION_KEY = 'bridge_admin_session'

export const authStorage = {
  get(): AuthSession | null {
    const storedSession = sessionStorage.getItem(SESSION_KEY)
    if (!storedSession) return null

    try {
      return JSON.parse(storedSession) as AuthSession
    } catch {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
  },

  set(session: AuthSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  },

  clear() {
    sessionStorage.removeItem(SESSION_KEY)
  },
}
