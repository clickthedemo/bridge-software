"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phase3Error,
  audienceLabel,
  applySimulatedFailure,
  canConfirmContacts,
  canViewProtectedProfile,
  getPhase3Client,
  isPhase3LiveApi,
  visiblePostsForView,
  type ProfileProjection,
  type PostRecord,
  type ResponsibleContact,
  type SessionClaims,
} from "@/lib/phase3";

type LoadStatus = "loading" | "ready" | "error";
type MutationStatus = "idle" | "pending" | "error";

function formatStamp(value: string | null): string {
  if (!value) return "Not confirmed";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function cloneContacts(contacts: ResponsibleContact[]): ResponsibleContact[] {
  return contacts.map((contact) => ({ ...contact }));
}

export function MyProfileClient() {
  const client = useMemo(() => getPhase3Client(), []);
  const [mode, setMode] = useState<"public" | "protected">("protected");
  const [claims, setClaims] = useState<SessionClaims | null>(null);
  const [profile, setProfile] = useState<ProfileProjection | null>(null);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [draftContacts, setDraftContacts] = useState<ResponsibleContact[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<MutationStatus>("idle");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<MutationStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([client.getSession(), client.getProfileProjection(mode), client.listPosts()])
      .then(([session, projection, listed]) => {
        if (cancelled) return;
        setClaims(session);
        setProfile(projection);
        setPosts(listed);
        setDraftContacts(cloneContacts(projection.contacts));
        setLoadStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadStatus("error");
        setLoadError(error instanceof Phase3Error ? error.userMessage : "The profile could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [client, mode]);

  const showProtected = mode === "protected" && !!claims && canViewProtectedProfile(claims);
  const canConfirm = !!claims && canConfirmContacts(claims);
  const dirty = JSON.stringify(draftContacts) !== JSON.stringify(profile?.contacts ?? []);
  const firstLogin = profile?.confirmation.confirmedAt === null;
  const visiblePosts = visiblePostsForView(posts, mode);

  function updateDraft(kind: ResponsibleContact["kind"], field: "name" | "email" | "phone", value: string) {
    setDraftContacts((current) => current.map((contact) => (
      contact.kind === kind ? { ...contact, [field]: value } : contact
    )));
  }

  async function saveContacts() {
    if (!profile || saveStatus === "pending") return;
    setSaveStatus("pending");
    setSaveError(null);
    try {
      applySimulatedFailure(client, simulateFailure);
      if (simulateFailure) setSimulateFailure(false);
      const next = await client.updateContacts({
        organizationId: profile.organizationId,
        contacts: draftContacts,
      });
      setProfile(next);
      setDraftContacts(cloneContacts(next.contacts));
      setSaveStatus("idle");
    } catch (error: unknown) {
      setSaveStatus("error");
      setSaveError(error instanceof Phase3Error ? error.userMessage : "Contacts could not be updated.");
    }
  }

  async function confirm() {
    if (!profile || confirmStatus === "pending" || dirty) return;
    setConfirmStatus("pending");
    setConfirmError(null);
    try {
      applySimulatedFailure(client, simulateFailure);
      if (simulateFailure) setSimulateFailure(false);
      const confirmation = await client.confirmContacts({ organizationId: profile.organizationId });
      setProfile((current) => current ? {
        ...current,
        confirmation: {
          status: "confirmed",
          confirmedAt: confirmation.confirmedAt,
          nextDue: confirmation.nextDue,
          actorUserId: confirmation.actorUserId,
        },
      } : current);
      setConfirmStatus("idle");
    } catch (error: unknown) {
      setConfirmStatus("error");
      setConfirmError(error instanceof Phase3Error ? error.userMessage : "Contacts could not be confirmed.");
    }
  }

  return (
    <div>
      <div className="feed-toolbar" role="group" aria-label="Profile visibility mode">
        <button type="button" className={mode === "public" ? "button primary" : "button secondary"} aria-pressed={mode === "public"} onClick={() => { if (mode === "public") return; setLoadStatus("loading"); setLoadError(null); setMode("public"); }}>Public view</button>
        <button type="button" className={mode === "protected" ? "button primary" : "button secondary"} aria-pressed={mode === "protected"} onClick={() => { if (mode === "protected") return; setLoadStatus("loading"); setLoadError(null); setMode("protected"); }}>B2B / verified view</button>
        <p className="form-hint toolbar-status">Showing: <strong>{mode === "public" ? "Public" : "B2B verified"}</strong></p>
      </div>
      {loadStatus === "loading" && <p className="form-hint" aria-busy="true">Loading profile projection…</p>}
      {loadStatus === "error" && <p className="form-error" role="alert">{loadError}</p>}
      {loadStatus === "ready" && profile && (
        <>
        {showProtected && profile.confirmation.status !== "confirmed" && (
          <div className="mandatory-review-backdrop">
            <section aria-labelledby="mandatory-review-title" aria-modal="true" className="mandatory-review" role="dialog">
              <p className="eyebrow">Required monthly check</p>
              <h2 id="mandatory-review-title">Confirm who Bridge members should contact</h2>
              <p>Before continuing, verify the current sales and accounting contacts or update them here. This appears on first login and again each month.</p>
              <div className="mandatory-contact-grid">
                {draftContacts.map((contact) => (
                  <div className="contact-edit" key={`gate-${contact.kind}`}>
                    <h3>{contact.kind === "sales" ? "Sales contact" : "Accounting contact"}</h3>
                    <label htmlFor={`gate-${contact.kind}-name`}>Name</label>
                    <input id={`gate-${contact.kind}-name`} value={contact.name} onChange={(event) => updateDraft(contact.kind, "name", event.target.value)} />
                    <label htmlFor={`gate-${contact.kind}-email`}>Email</label>
                    <input id={`gate-${contact.kind}-email`} type="email" value={contact.email} onChange={(event) => updateDraft(contact.kind, "email", event.target.value)} />
                    <label htmlFor={`gate-${contact.kind}-phone`}>Phone</label>
                    <input id={`gate-${contact.kind}-phone`} value={contact.phone} onChange={(event) => updateDraft(contact.kind, "phone", event.target.value)} />
                  </div>
                ))}
              </div>
              <div className="button-row">
                <button className="button secondary" disabled={!canConfirm || saveStatus === "pending" || !dirty} onClick={() => void saveContacts()} type="button">{saveStatus === "pending" ? "Saving…" : "Save updates"}</button>
                <button className="button primary" disabled={!canConfirm || confirmStatus === "pending" || dirty} onClick={() => void confirm()} type="button">{confirmStatus === "pending" ? "Confirming…" : "Confirm and enter Bridge"}</button>
              </div>
              {dirty && <p className="form-hint">Save the updated details before confirming.</p>}
              {saveError && <p className="form-error" role="alert">{saveError}</p>}
              {confirmError && <p className="form-error" role="alert">{confirmError}</p>}
              <p className="form-hint">Production will pair this required login check with a monthly email reminder.</p>
            </section>
          </div>
        )}
        <div className="profile-shell content-card">
          <div className="card-topline">
            <div>
              <h2 className="profile-title">{profile.displayName}</h2>
              <p className="muted profile-meta">{profile.roleLabel} · {profile.location} · illustrative record</p>
            </div>
            <span className={`status-chip ${profile.verificationState === "verified" ? "verified" : "pending"}`}>
              {profile.verificationState === "verified" ? "Verified" : profile.verificationState}
            </span>
          </div>
          <p>{profile.publicDescription}</p>
          <div className="tag-row">{profile.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          {showProtected ? (
            <div className="contact-blocks">
              {draftContacts.map((contact) => (
                <section className="profile-detail" key={contact.kind}>
                  <h3>{contact.kind === "sales" ? "Sales contact" : "Accounting contact"}</h3>
                  <p className="form-hint">Protected field · not shown in Public view</p>
                  <div className="contact-edit">
                    <label htmlFor={`${contact.kind}-name`}>Name</label>
                    <input id={`${contact.kind}-name`} value={contact.name} onChange={(event) => updateDraft(contact.kind, "name", event.target.value)} />
                    <label htmlFor={`${contact.kind}-email`}>Email</label>
                    <input id={`${contact.kind}-email`} type="email" value={contact.email} onChange={(event) => updateDraft(contact.kind, "email", event.target.value)} />
                    <label htmlFor={`${contact.kind}-phone`}>Phone</label>
                    <input id={`${contact.kind}-phone`} value={contact.phone} onChange={(event) => updateDraft(contact.kind, "phone", event.target.value)} />
                  </div>
                </section>
              ))}
              <section className="profile-detail confirm-panel">
                <h3>Contact confirmation</h3>
                <p className="muted">
                  {firstLogin
                    ? "First-login contact review. Confirm sales and accounting contacts or update the details."
                    : "Recurring monthly contact review. Confirm the stored details or update them first."}
                  {" "}Next due: {formatStamp(profile.confirmation.nextDue)}.
                </p>
                {profile.confirmation.status === "confirmed"
                  ? <p className="status-chip verified">Confirmed {formatStamp(profile.confirmation.confirmedAt)}</p>
                  : <p className="status-chip pending">{firstLogin ? "First-login confirmation needed" : "Monthly confirmation needed"}</p>}
                <div className="button-row">
                  <button type="button" className="button secondary" disabled={!canConfirm || saveStatus === "pending" || !dirty} onClick={() => void saveContacts()}>
                    {saveStatus === "pending" ? "Saving…" : "Save contact updates"}
                  </button>
                  <button type="button" className="button primary" disabled={!canConfirm || confirmStatus === "pending" || dirty} onClick={() => void confirm()}>
                    {confirmStatus === "pending" ? "Confirming…" : "Confirm contacts"}
                  </button>
                </div>
                {dirty && <p className="form-hint">Save the edited details before confirming this cycle.</p>}
                {saveError && <p className="form-error" role="alert">{saveError}</p>}
                {confirmError && <p className="form-error" role="alert">{confirmError}</p>}
                {!canConfirm && <p className="form-hint">This account cannot confirm responsible contacts.</p>}
                <p className="form-hint">
                  {isPhase3LiveApi()
                    ? "Confirmation writes through the live /api/v1 contract."
                    : "Email reminder integration is pending production. The Phase 3 adapter records actor, time, and next-due locally until staging is connected."}
                </p>
                {!isPhase3LiveApi() && (
                  <details className="demo-controls">
                    <summary>Phase 3 adapter controls</summary>
                    <label className="check-row">
                      <input checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} type="checkbox" />
                      Simulate a network failure
                    </label>
                  </details>
                )}
              </section>
            </div>
          ) : (
            <div className="profile-visibility-note">
              <p className="muted">Protected sales and accounting contacts are hidden in Public view. EIN and verification documents never appear here.</p>
            </div>
          )}
          <section className="published-feed" aria-live="polite">
            <p className="eyebrow">{mode === "public" ? "Public promotions" : "Organization promotions"}</p>
            <h3>{mode === "public" ? "Public-safe promotions only" : "Including protected wholesale detail"}</h3>
            {visiblePosts.length === 0 ? (
              <p className="muted">
                {mode === "public"
                  ? "No public-safe promotions are visible in this projection."
                  : "No promotions recorded yet. Publish one from Create to see it persist here."}
              </p>
            ) : (
              visiblePosts.map((post) => (
                <article className="published-item" key={post.postId}>
                  <h4>{post.contentType} · {post.postId}</h4>
                  <p>{post.message}</p>
                  <p className="muted">{post.protectedDetail ? "Verified audiences only" : "As selected"}</p>
                  <div className="tag-row">
                    {post.audienceIds.map((id) => <span className="tag" key={id}>{audienceLabel(id)}</span>)}
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
        </>
      )}
    </div>
  );
}
