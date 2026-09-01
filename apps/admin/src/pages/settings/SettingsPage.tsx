import { Info, Save } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

export function SettingsPage() {
  const { user } = useAuth()
  return (
    <div className="admin-page">
      <div className="page-heading"><div><p className="eyebrow">ACCOUNT</p><h1>Settings</h1><p>Manage your personal information and preferences.</p></div></div>
      <div className="notice"><Info size={18} /><div><strong>Design preview</strong><span>Profile updates require a settings API endpoint before they can be saved.</span></div></div>
      <form className="content-card admin-form" onSubmit={(event) => event.preventDefault()}>
        <div className="card-heading"><div><h2>Profile information</h2><p>This information identifies you across BRIDGE.</p></div></div>
        <div className="profile-row"><div className="profile-avatar">{(user?.profile?.displayName ?? user?.email ?? 'U').charAt(0).toUpperCase()}</div><div><strong>Profile photo</strong><span>JPG or PNG. Maximum size 2 MB.</span><button type="button" className="text-button">Upload new photo</button></div></div>
        <div className="form-grid">
          <div className="field-group form-span"><label htmlFor="displayName">Display name</label><input id="displayName" defaultValue={user?.profile?.displayName ?? ''} placeholder="Your full name" /></div>
          <div className="field-group"><label htmlFor="settingsEmail">Email address</label><input id="settingsEmail" value={user?.email ?? ''} readOnly /></div>
          <div className="field-group"><label htmlFor="phone">Phone number</label><input id="phone" defaultValue={user?.profile?.phone ?? ''} placeholder="+1 555 000 0000" /></div>
          <div className="field-group form-span"><label htmlFor="timezone">Timezone</label><select id="timezone" defaultValue="Asia/Calcutta"><option>Asia/Calcutta</option><option>America/New_York</option><option>America/Los_Angeles</option><option>Europe/London</option></select></div>
        </div>
        <div className="form-actions"><button className="primary-button" type="submit" disabled><Save size={17} />Save changes</button></div>
      </form>
    </div>
  )
}
