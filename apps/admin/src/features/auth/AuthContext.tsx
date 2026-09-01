import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from './authApi'
import { authStorage } from './authStorage'
import { getAppRoles, hasAnyRole } from './accessControl'
import type {
  AdminUser,
  AppRole,
  AuthSession,
  LoginCredentials,
  OrganizationMembership,
} from './types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  user: AdminUser | null
  memberships: OrganizationMembership[]
  roles: AppRole[]
  hasRole: (...allowedRoles: AppRole[]) => boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AdminUser | null>(null)
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([])

  useEffect(() => {
    const session = authStorage.get()
    if (!session) {
      setStatus('unauthenticated')
      return
    }

    let isActive = true
    authApi.getCurrentUser(session.accessToken)
      .then(({ user: currentUser, memberships: currentMemberships }) => {
        if (isActive) {
          setUser(currentUser)
          setMemberships(currentMemberships)
          setStatus('authenticated')
        }
      })
      .catch(() => {
        authStorage.clear()
        if (isActive) {
          setUser(null)
          setMemberships([])
          setStatus('unauthenticated')
        }
      })

    return () => { isActive = false }
  }, [])

  async function login(credentials: LoginCredentials) {
    const loginResult = await authApi.login(credentials)
    const { user: currentUser, memberships: currentMemberships } =
      await authApi.getCurrentUser(loginResult.accessToken)

    const session: AuthSession = {
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
      expiresAt: loginResult.expiresAt,
      expiresIn: loginResult.expiresIn,
      tokenType: loginResult.tokenType,
    }

    authStorage.set(session)
    setUser(currentUser)
    setMemberships(currentMemberships)
    setStatus('authenticated')
  }

  function logout() {
    authStorage.clear()
    setUser(null)
    setMemberships([])
    setStatus('unauthenticated')
  }

  const roles = useMemo(
    () => user ? getAppRoles(user, memberships) : [],
    [user, memberships],
  )
  const value = useMemo(() => ({
    status,
    user,
    memberships,
    roles,
    hasRole: (...allowedRoles: AppRole[]) => hasAnyRole(roles, allowedRoles),
    login,
    logout,
  }), [status, user, memberships, roles])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
