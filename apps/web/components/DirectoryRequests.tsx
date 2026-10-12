"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBridgeApiBase } from "@/lib/phase3/client";
import { DirectoryRequestsClient, requestKinds, validateRequestInput, type RequestInput, type RequestPage, type DirectoryRequest } from "@/lib/phase3/directory-requests";

const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : "The request could not be completed.";

export function DirectoryRequestForm({ profileId, profileName }: { profileId: string; profileName: string }) {
  const auth = useAuth();
  if (!getBridgeApiBase()) return <p>Contact and listing requests are available when the live directory is connected.</p>;
  if (auth.status === "loading") return <p role="status">Checking your account…</p>;
  if (auth.status === "unavailable") return <p role="alert">Your session could not be checked. <button className="button secondary" onClick={() => void auth.refresh()}>Retry</button></p>;
  if (!auth.user) return <p><Link className="text-link" href={`/login?next=${encodeURIComponent(`/profile/${profileId}#contact-request`)}`}>Sign in to contact this member or request a listing correction.</Link></p>;
  return <RequestForm key={`${auth.user.id}:${profileId}`} profileId={profileId} profileName={profileName} />;
}

function RequestForm({ profileId, profileName }: { profileId: string; profileName: string }) {
  const [kind, setKind] = useState<DirectoryRequest["kind"]>("contact");
  const [message, setMessage] = useState("");
  const [shareEmail, setShareEmail] = useState(false);
  const [pending, setPending] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<DirectoryRequest | null>(null);
  const attempt = useRef<RequestInput | null>(null);
  const busy = useRef(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || receipt) return;
    try { attempt.current ??= validateRequestInput({ profileId, kind, message, shareEmail, idempotencyKey: crypto.randomUUID() }); }
    catch (cause) { setError(errorMessage(cause)); return; }
    busy.current = true; setLocked(true); setPending(true); setError("");
    try { setReceipt((await new DirectoryRequestsClient(getBridgeApiBase()!).create(attempt.current)).request); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { busy.current = false; setPending(false); }
  }
  if (receipt) return <div role="status"><h2>Request saved</h2><p>Your {requestKinds[receipt.kind].toLowerCase()} is in the review inbox. Email delivery is not connected, so no email was sent.</p><p className="form-hint">Reference: {receipt.id}</p><Link className="button secondary" href="/requests">View your requests</Link></div>;
  return <form onSubmit={submit} className="form-stack"><p className="eyebrow">Connect and keep listings accurate</p><h2>Contact {profileName}</h2>
    <label htmlFor="directory-request-kind">Request type</label><select id="directory-request-kind" value={kind} disabled={locked} onChange={e => setKind(e.target.value as DirectoryRequest["kind"])}>{Object.entries(requestKinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    <p className="form-hint">Contact requests go to the listing managers. Claims and corrections go to Bridge administrators. Submitting a claim does not transfer ownership.</p>
    <label htmlFor="directory-request-message">Your message</label><textarea id="directory-request-message" value={message} disabled={locked} required maxLength={5000} rows={5} onChange={e => setMessage(e.target.value)} />
    <label className="check-row"><input type="checkbox" checked={shareEmail} disabled={locked} onChange={e => setShareEmail(e.target.checked)} />Share my account email with the recipient so they can reply.</label>
    {error && <p role="alert" className="form-error">{error} Your message is preserved. Retry submits the same request reference to prevent duplicates.</p>}
    <button className="button primary" disabled={pending} type="submit">{pending ? "Saving request…" : locked ? "Retry same request" : "Submit request"}</button>
  </form>;
}

export function DirectoryRequestInbox() {
  const auth = useAuth();
  if (!getBridgeApiBase()) return <section className="content-card"><h2>Request inbox preview</h2><p>Connect the live directory to see your contact requests, claims and corrections. No requests are stored in this preview.</p></section>;
  if (auth.status === "loading") return <p role="status">Checking your account…</p>;
  if (auth.status === "unavailable") return <p role="alert">Your session could not be checked. <button className="button secondary" onClick={() => void auth.refresh()}>Retry</button></p>;
  if (!auth.user) return <Link className="button primary" href="/login?next=%2Frequests">Sign in to your inbox</Link>;
  return <RequestInbox key={auth.user.id} />;
}
function RequestInbox() {
  const [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [result, setResult] = useState<RequestPage | null>(null), [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const reviewLock = useRef(false);
  useEffect(() => {
    let active = true;
    new DirectoryRequestsClient(getBridgeApiBase()!).list(page).then(value => { if (active) setResult(value); }).catch(cause => { if (active) setError(errorMessage(cause)); });
    return () => { active = false; };
  }, [page, revision]);
  function refresh() { setResult(null); setError(""); setRevision(n => n + 1); }
  async function review(id: string, status: "resolved" | "rejected") {
    if (reviewLock.current) return;
    reviewLock.current = true; setBusy(id); setError("");
    try { await new DirectoryRequestsClient(getBridgeApiBase()!).review(id, status); refresh(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { reviewLock.current = false; setBusy(null); }
  }
  return <div className="form-stack"><p>Only requests you sent or are authorized to review appear here. Email delivery is not connected.</p>
    <button className="button secondary" onClick={refresh} disabled={busy !== null}>Refresh inbox</button>
    {error && <p role="alert" className="form-error">{error}</p>}{!result && !error && <p role="status">Loading requests…</p>}
    {result && <>{!result.requests.length && <div className="empty-state"><h2>You’re all caught up</h2><p>No requests to display.</p></div>}{result.requests.map(r => <article className="content-card" key={r.id}>
      <p className="eyebrow">{requestKinds[r.kind]} · {r.status}</p><p style={{ whiteSpace: "pre-wrap" }}>{r.message}</p>
      {r.replyEmail && <p>Reply email: {r.replyEmail}</p>}<p className="form-hint">Received {new Date(r.createdAt).toLocaleDateString()} · Reference {r.id}</p>
      <Link className="text-link" href={`/profile/${r.profileId}`}>View listing</Link>
      {r.canReview && r.status === "pending" && <div className="button-row"><button className="button primary" disabled={busy !== null} onClick={() => void review(r.id, "resolved")}>{busy === r.id ? "Updating…" : "Mark resolved"}</button><button className="button secondary" disabled={busy !== null} onClick={() => void review(r.id, "rejected")}>Reject request</button></div>}
    </article>)}{result.pagination.totalPages > 1 && <nav className="button-row" aria-label="Request pages"><button className="button secondary" disabled={page <= 1 || busy !== null} onClick={() => { setResult(null); setError(""); setPage(p => p - 1); }}>Previous</button><span>Page {page} of {result.pagination.totalPages}</span><button className="button secondary" disabled={page >= result.pagination.totalPages || busy !== null} onClick={() => { setResult(null); setError(""); setPage(p => p + 1); }}>Next</button></nav>}</>}
  </div>;
}
