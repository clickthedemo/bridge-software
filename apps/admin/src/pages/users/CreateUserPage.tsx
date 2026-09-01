import { Info, UserPlus } from 'lucide-react'

export function CreateUserPage() {
  return (
    <div className="admin-page">
      <div className="page-heading"><div><p className="eyebrow">USER MANAGEMENT</p><h1>Create user account</h1><p>Add a new person and assign their initial portal access.</p></div></div>
      <div className="notice"><Info size={18} /><div><strong>Design preview</strong><span>User creation is unavailable until an administrator API endpoint is connected.</span></div></div>
      <form className="content-card admin-form" onSubmit={(event) => event.preventDefault()}>
        <div className="card-heading"><div><h2>Account details</h2><p>Basic identity and access information.</p></div><UserPlus size={22} /></div>
        <div className="form-grid">
          <div className="field-group"><label htmlFor="firstName">First name</label><input id="firstName" placeholder="Jane" /></div>
          <div className="field-group"><label htmlFor="lastName">Last name</label><input id="lastName" placeholder="Doe" /></div>
          <div className="field-group form-span"><label htmlFor="newUserEmail">Email address</label><input id="newUserEmail" type="email" placeholder="jane@company.com" /></div>
          <div className="field-group"><label htmlFor="role">Portal role</label><select id="role" defaultValue=""><option value="" disabled>Select a role</option><option>Brand</option><option>Retailer</option><option>Sales Rep</option><option>Admin</option></select></div>
          <div className="field-group"><label htmlFor="status">Account status</label><select id="status" defaultValue="active"><option value="active">Active</option><option value="invited">Invite pending</option><option value="suspended">Suspended</option></select></div>
          <div className="field-group form-span"><label htmlFor="organization">Organization (optional)</label><input id="organization" placeholder="Search organizations" /></div>
        </div>
        <div className="form-actions"><button className="secondary-button" type="reset">Clear form</button><button className="primary-button" type="submit" disabled>Create account</button></div>
      </form>
    </div>
  )
}
