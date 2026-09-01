"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { authApi } from "@/lib/auth/api";
export default function VerifyEmailPage() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); try { await authApi.resendVerification(email); setSent(true); } catch { setError("Verification email is temporarily unavailable. Please try again."); } }
  return <div className="page shell auth-page"><section className="auth-card"><p className="eyebrow">Email verification</p><h1>Verify your email.</h1><p className="lede">Use the link in your welcome email, or request another one.</p>{sent ? <p className="boundary-note">If the account is eligible, a new verification email has been sent.</p> : <form className="auth-form" onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />{error && <p className="form-error">{error}</p>}<button className="button primary">Resend verification email</button></form>}<p className="auth-secondary"><Link href="/login">Continue to sign in</Link></p></section></div>;
}
