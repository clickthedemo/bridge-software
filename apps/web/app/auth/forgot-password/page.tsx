"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { authApi } from "@/lib/auth/api";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent) { e.preventDefault(); setError(""); try { await authApi.forgotPassword(email); setSent(true); } catch { setError("Recovery is temporarily unavailable. Please try again."); } }
  return <div className="page shell auth-page"><section className="auth-card"><p className="eyebrow">Account recovery</p><h1>Reset your password.</h1><p className="lede">Enter the email connected to your Bridge account.</p>{sent ? <p className="boundary-note">If an eligible account exists, a secure recovery link has been sent.</p> : <form className="auth-form" onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary">Send recovery link</button></form>}<p className="auth-secondary"><Link href="/login">Back to sign in</Link></p></section></div>;
}

