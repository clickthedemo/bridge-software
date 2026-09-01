import { Building2, KeyRound, LayoutDashboard, LogOut, Menu, Settings, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ROLE_LABELS } from '../../features/auth/accessControl'
import { useAuth } from '../../features/auth/AuthContext'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users/new', label: 'User accounts', icon: UserPlus, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/settings/password', label: 'Password', icon: KeyRound },
]

export function AdminLayout() {
  const { hasRole, logout, roles, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <button className="sidebar-toggle" type="button" onClick={() => setIsOpen(true)} aria-label="Open navigation">
        <Menu size={22} />
      </button>
      {isOpen && <button className="sidebar-backdrop" type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation" />}
      <aside className={`admin-sidebar${isOpen ? ' admin-sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/bridge-mark.svg" alt="" className="brand-mark" />
          <div><strong>BRIDGE</strong><span>Admin Portal</span></div>
          <button className="sidebar-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          <p>WORKSPACE</p>
          {navigation.filter((item) => !item.adminOnly || hasRole('admin')).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-account">
          <div className="account-avatar">{(user?.profile?.displayName ?? user?.email ?? 'U').charAt(0).toUpperCase()}</div>
          <div className="account-copy">
            <strong>{user?.profile?.displayName ?? 'BRIDGE User'}</strong>
            <span>{roles.map((role) => ROLE_LABELS[role]).join(' · ')}</span>
          </div>
          <button type="button" onClick={handleLogout} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
        </div>
        <div className="sidebar-org"><Building2 size={15} /><span>{user?.email}</span></div>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  )
}
