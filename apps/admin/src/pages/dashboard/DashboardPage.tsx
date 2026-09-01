import { Building2, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { ROLE_LABELS } from '../../features/auth/accessControl'
import { useAuth } from '../../features/auth/AuthContext'

export function DashboardPage() {
  const { memberships, roles, user } = useAuth()
  const activeMemberships = memberships.filter(({ status }) => status === 'active')

  return (
    <div className="admin-page">
      <div className="page-heading">
        <div><p className="eyebrow">OVERVIEW</p><h1>Dashboard</h1><p>Welcome back, {user?.profile?.displayName ?? user?.email}.</p></div>
      </div>
      <section className="stat-grid" aria-label="Account summary">
        <article className="stat-card"><div><span>Active roles</span><strong>{roles.length}</strong></div><ShieldCheck /></article>
        <article className="stat-card"><div><span>Organizations</span><strong>{activeMemberships.length}</strong></div><Building2 /></article>
        <article className="stat-card"><div><span>Account status</span><strong className="status-text">Active</strong></div><UserRound /></article>
        <article className="stat-card"><div><span>Portal access</span><strong>{roles.length ? 'Granted' : 'None'}</strong></div><UsersRound /></article>
      </section>
      <div className="dashboard-grid">
        <section className="content-card">
          <div className="card-heading"><div><h2>Your access</h2><p>Roles currently assigned to this account.</p></div></div>
          <div className="role-list">{roles.map((role) => <span className="role-badge" key={role}>{ROLE_LABELS[role]}</span>)}</div>
        </section>
        <section className="content-card">
          <div className="card-heading"><div><h2>Organizations</h2><p>Your active organization memberships.</p></div></div>
          <div className="membership-list">
            {activeMemberships.length === 0 && <p className="empty-state">No active organization memberships.</p>}
            {activeMemberships.map((item) => <div key={item.organizationId}><span className="list-icon"><Building2 size={18} /></span><div><strong>{item.organizationName}</strong><span>{item.organizationType ?? 'Unclassified'} · {item.role}</span></div></div>)}
          </div>
        </section>
      </div>
    </div>
  )
}
