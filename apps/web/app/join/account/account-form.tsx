"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { getPhase3Client, isPhase3LiveApi } from "@/lib/phase3";
import { parseMemberRole } from "@/lib/onboarding/roles";

export function AccountForm() {
  const client = useMemo(() => getPhase3Client(), []);
  const live = isPhase3LiveApi();
  const requestedRole = useSearchParams().get("role");
  const selectedRole = parseMemberRole(requestedRole);
  const signInPath = `/login?next=${encodeURIComponent(`/join/organization${selectedRole ? `?role=${encodeURIComponent(selectedRole)}` : ""}`)}`;
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!displayName.trim()) return setError("Enter your display name.");
    if (password !== confirmPassword) return setError("Enter the same password in both fields.");
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return setError("Use at least 12 characters with uppercase, lowercase, a number, and a special character.");
    setBusy(true);
    try { await client.register(email.trim(), password, displayName.trim()); setComplete(true); }
    catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your account could not be created. Please try again.");
    } finally { setBusy(false); }
  }

  if (complete) return (
    <section className="auth-card">
      <p className="eyebrow">{live ? "Check your inbox" : "Preview complete"}</p><h2>{live ? "Confirm your email." : "Explore organization setup."}</h2>
      {live ? <><p className="lede">Check <strong>{email}</strong> for a confirmation link. Open it before signing in.</p><p className="boundary-note">After confirmation, sign in and continue setting up your Bridge profile.</p></> : <p className="boundary-note">This was a preview. No account was created and no confirmation email was sent.</p>}
      <Link className="button primary" href={signInPath}>Continue to sign in</Link>
    </section>
  );

  return (
    <section className="auth-card">
      {!live && <p className="boundary-note"><strong>Preview mode.</strong> Use example details to explore this form. No account or confirmation email will be created.</p>}
      {selectedRole ? <p className="boundary-note">Selected role: <strong>{selectedRole}</strong>. <Link className="text-link" href="/join">Change role</Link></p> : <p className="boundary-note">Choose a member role before creating an account. <Link className="text-link" href="/join">Choose role</Link></p>}
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="display-name">Display name</label><input id="display-name" autoComplete="name" maxLength={100} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
        <label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
        <p className="form-hint">At least 12 characters, including uppercase, lowercase, a number, and a special character.</p>
        <label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy || !selectedRole} type="submit">{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="auth-secondary">Already have an account? <Link href={signInPath}>Sign in</Link></p>
    </section>
  );
}
