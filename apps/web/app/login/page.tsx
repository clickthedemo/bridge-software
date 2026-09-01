"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const identity = await login(email, password);
      const next = search.get("next");
      const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;
      router.replace(safeNext ?? (identity.isAdmin ? "/admin/dashboard" : "/my-profile"));
    } catch { setError("We could not sign you in. Check your email and password, then try again."); setBusy(false); }
  }
  return <section className="auth-card">
    <p className="eyebrow">Secure access</p><h1>Welcome back.</h1>
    <p className="lede">Sign in to your Bridge account.</p>
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="email">Email address</label>
      <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div className="auth-label-row"><label htmlFor="password">Password</label><Link href="/auth/forgot-password">Forgot password?</Link></div>
      <input id="password" type="password" autoComplete="current-password" maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
    <p className="auth-secondary">New to Bridge? <Link href="/join">Join the network</Link></p>
  </section>;
}

export default function LoginPage() {
  return <div className="page shell auth-page"><Suspense fallback={<p>Loading…</p>}><LoginForm /></Suspense></div>;
}
