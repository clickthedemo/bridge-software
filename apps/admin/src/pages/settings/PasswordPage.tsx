import { Eye, Info, KeyRound } from 'lucide-react'

export function PasswordPage() {
  return (
    <div className="admin-page">
      <div className="page-heading"><div><p className="eyebrow">SECURITY</p><h1>Password</h1><p>Choose a strong password to protect your account.</p></div></div>
      <div className="notice"><Info size={18} /><div><strong>Design preview</strong><span>Authenticated password changes are unavailable until the API endpoint is added.</span></div></div>
      <form className="content-card admin-form narrow-form" onSubmit={(event) => event.preventDefault()}>
        <div className="card-heading"><div><h2>Change password</h2><p>You’ll remain signed in on this device.</p></div><KeyRound size={22} /></div>
        <div className="field-group"><label htmlFor="currentPassword">Current password</label><div className="password-field"><input id="currentPassword" type="password" placeholder="Enter current password" /><Eye size={18} /></div></div>
        <div className="field-group"><label htmlFor="newPassword">New password</label><div className="password-field"><input id="newPassword" type="password" placeholder="Enter new password" /><Eye size={18} /></div></div>
        <div className="field-group"><label htmlFor="confirmPassword">Confirm new password</label><div className="password-field"><input id="confirmPassword" type="password" placeholder="Repeat new password" /><Eye size={18} /></div></div>
        <div className="password-rules"><strong>Password requirements</strong><span>At least 12 characters</span><span>One uppercase and one lowercase letter</span><span>One number and one special character</span></div>
        <div className="form-actions"><button className="primary-button" type="submit" disabled>Update password</button></div>
      </form>
    </div>
  )
}
