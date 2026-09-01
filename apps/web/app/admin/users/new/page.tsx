"use client";

export default function CreateAdminUserPage() {
  return <><div className="dashboard-heading"><div><p className="eyebrow">User management</p><h1>Create user</h1><p className="lede">Prepare a new Bridge account and initial access.</p></div></div><form className="content-card admin-form" onSubmit={(e) => e.preventDefault()}><label htmlFor="first">First name</label><input id="first" /><label htmlFor="last">Last name</label><input id="last" /><label htmlFor="new-email">Email address</label><input id="new-email" type="email" /><label htmlFor="role">Portal role</label><select id="role" defaultValue=""><option value="" disabled>Select a role</option><option>Brand</option><option>Retailer</option><option>Sales Rep</option><option>Admin</option></select><p className="boundary-note">Account creation will activate when the administrator user endpoint is available.</p><button className="button primary" disabled>Create account</button></form></>;
}
