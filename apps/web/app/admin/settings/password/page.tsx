import Link from "next/link";

export default function AdminPasswordPage() {
  return <><div className="dashboard-heading"><div><p className="eyebrow">Security</p><h1>Password</h1><p className="lede">Keep your administrative account secure.</p></div></div><section className="content-card"><p>The API supports password changes through the secure recovery flow.</p><Link className="button primary" href="/auth/forgot-password">Send password reset email</Link></section></>;
}
