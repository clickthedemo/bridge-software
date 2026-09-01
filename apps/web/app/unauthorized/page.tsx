import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="page shell auth-page">
      <section className="auth-card">
        <p className="eyebrow">Access restricted</p>
        <h1>Administrator access required.</h1>
        <p className="lede">Your account does not have the platform administrator role.</p>
        <Link className="button primary" href="/my-profile">Go to my profile</Link>
      </section>
    </div>
  );
}
