"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { m4Api, type Business, type DirectoryProfile, type DirectoryProfileInput } from "@/lib/m4/api";
import { canManageDirectoryProfile, directoryProfileBusinessType } from "@/lib/m4/directory-profile-form";

const blank: DirectoryProfileInput = { businessId: "", slug: "", displayName: "", summary: null, story: null, businessType: "brand", categories: [], city: null, state: null, region: null, publicEmail: null, publicPhone: null, licenseType: null, licenseNumber: null, links: [] };
const editableStatuses = new Set(["draft", "correction_requested", "rejected"]);
const message = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";

export function DirectoryEditor() {
  const { memberships } = useAuth();
  const organizations = useMemo(() => memberships.filter(canManageDirectoryProfile), [memberships]);
  const [organizationId, setOrganizationId] = useState(organizations[0]?.organizationId ?? "");
  const selectedOrganizationId = organizationId || organizations[0]?.organizationId || "";
  const selectedMembership = organizations.find((item) => item.organizationId === selectedOrganizationId);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [profile, setProfile] = useState<DirectoryProfile | null>(null);
  const [draft, setDraft] = useState(blank);
  const [categories, setCategories] = useState("");
  const [website, setWebsite] = useState("");
  const [legalName, setLegalName] = useState("");
  const [dbaName, setDbaName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [missingSubmissionFields, setMissingSubmissionFields] = useState<string[]>([]);
  const canSubmit = selectedMembership?.role === "owner" || selectedMembership?.role === "admin";

  useEffect(() => {
    if (!selectedOrganizationId) return;
    let active = true;
    Promise.all([m4Api.listBusinesses(selectedOrganizationId), m4Api.getProfile(selectedOrganizationId), canSubmit ? m4Api.getProfileSubmissionReadiness(selectedOrganizationId).catch(() => null) : Promise.resolve(null)])
      .then(([items, value, readiness]) => {
        if (!active) return;
        setBusinesses(items); setProfile(value);
        setMissingSubmissionFields(readiness?.missingFields ?? []);
        const businessType = directoryProfileBusinessType(selectedMembership);
        if (value) {
          setDraft({ businessId: value.businessId ?? "", slug: value.slug, displayName: value.displayName, summary: value.summary, story: value.story, businessType: value.businessType ?? businessType, categories: value.categories, city: value.city, state: value.state, region: value.region, publicEmail: value.publicContact.email, publicPhone: value.publicContact.phone, licenseType: value.license?.type ?? null, licenseNumber: value.license?.number ?? null, links: value.links });
          setCategories(value.categories.join(", ")); setWebsite(value.links.find((link) => link.type === "website")?.url ?? "");
        } else {
          setDraft({ ...blank, businessType }); setCategories(""); setWebsite("");
        }
      })
      .catch((cause) => { if (active) setError(message(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedOrganizationId, selectedMembership, canSubmit, revision]);

  async function createBusiness(event: FormEvent) {
    event.preventDefault(); setBusy("business"); setError("");
    try { const created = await m4Api.createBusiness(selectedOrganizationId, { legalName: legalName.trim(), dbaName: dbaName.trim() || null }); setBusinesses((items) => [...items, created]); setDraft((value) => ({ ...value, businessId: created.id })); setNotice("Business created."); }
    catch (cause) { setError(message(cause)); } finally { setBusy(""); }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy("save"); setError(""); setNotice("");
    const categoryValues = categories.split(",").map((value) => value.trim()).filter(Boolean);
    const nonWebsite = draft.links.filter((link) => link.type !== "website");
    const links = website.trim() ? [{ type: "website" as const, label: "Website", url: website.trim(), sortOrder: 0 }, ...nonWebsite.map((link, index) => ({ ...link, sortOrder: index + 1 }))] : nonWebsite;
    try { const saved = await m4Api.saveProfile(selectedOrganizationId, { ...draft, businessType: directoryProfileBusinessType(selectedMembership), slug: draft.slug.trim().toLowerCase(), displayName: draft.displayName.trim(), summary: draft.summary?.trim() || null, story: draft.story?.trim() || null, categories: categoryValues, links }); setProfile(saved); setDraft((value) => ({ ...value, businessType: saved.businessType ?? directoryProfileBusinessType(selectedMembership), categories: categoryValues, links })); if (canSubmit) { const readiness = await m4Api.getProfileSubmissionReadiness(selectedOrganizationId); setMissingSubmissionFields(readiness?.missingFields ?? []); } setNotice("Draft saved."); }
    catch (cause) { setError(message(cause)); } finally { setBusy(""); }
  }

  async function submit() { if (!window.confirm("Submit this profile for administrator review?")) return; setBusy("submit"); setError(""); try { setProfile(await m4Api.submitProfile(selectedOrganizationId)); setNotice("Profile submitted for review."); } catch (cause) { setError(message(cause)); } finally { setBusy(""); } }
  async function upload() { if (!logo) return; if (logo.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(logo.type)) { setError("Choose a PNG, JPEG, or WebP file no larger than 2 MiB."); return; } setBusy("logo"); setError(""); try { setProfile(await m4Api.uploadLogo(selectedOrganizationId, logo)); setLogo(null); setNotice("Logo uploaded to the working profile."); } catch (cause) { setError(message(cause)); } finally { setBusy(""); } }
  async function removeLogo() { if (!window.confirm("Remove this working profile logo?")) return; setBusy("logo"); try { setProfile(await m4Api.deleteLogo(selectedOrganizationId)); setNotice("Logo removed."); } catch (cause) { setError(message(cause)); } finally { setBusy(""); } }

  if (!organizations.length) return <section className="content-card"><h2>Business profile</h2><p>You need an active owner, admin, or page-manager organization membership before managing a Directory profile.</p><Link className="button primary" href="/join/organization">Create or join an organization</Link></section>;
  const editable = !profile || editableStatuses.has(profile.status ?? "draft");
  const field = <K extends keyof DirectoryProfileInput>(key: K, value: DirectoryProfileInput[K]) => setDraft((current) => ({ ...current, [key]: value }));

  return <div className="form-stack">
    <section className="content-card">
      <h2>Business and Directory profile</h2>
      <p className="form-hint">Fields marked required must be completed. Every other field is optional while the profile is a draft.</p>
      <label htmlFor="m4-org">Organization (required)</label>
      <select id="m4-org" required value={selectedOrganizationId} onChange={(event) => { setLoading(true); setOrganizationId(event.target.value); setRevision((value) => value + 1); }}>{organizations.map((item) => <option key={item.organizationId} value={item.organizationId}>{item.organizationName}</option>)}</select>
      {loading && <p role="status">Loading profile…</p>}{error && <p className="form-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}{profile?.workflowReason && <p className="boundary-note"><strong>Administrator feedback:</strong> {profile.workflowReason}</p>}
    </section>
    {!loading && !businesses.length && <form className="content-card auth-form" onSubmit={createBusiness}><h2>Create business record</h2><label>Legal name (required)<input required maxLength={200} value={legalName} onChange={(event) => setLegalName(event.target.value)} /></label><label>DBA name (optional)<input maxLength={200} value={dbaName} onChange={(event) => setDbaName(event.target.value)} /></label><button className="button primary" disabled={!!busy}>Create business</button></form>}
    {!loading && businesses.length > 0 && <form className="content-card auth-form" onSubmit={save}>
      <div className="card-topline"><h2>Directory profile</h2>{profile?.status && <span className="status-chip pending">{profile.status.replaceAll("_", " ")}</span>}</div>
      {!editable && <p className="boundary-note">This profile cannot be edited while it is {profile?.status?.replaceAll("_", " ")}.</p>}
      <fieldset disabled={!!busy || !editable}>
        <label>Business (required)<select required value={draft.businessId} onChange={(event) => field("businessId", event.target.value)}><option value="">Choose a business</option>{businesses.map((item) => <option key={item.id} value={item.id}>{item.dbaName || item.legalName}</option>)}</select></label>
        <label>Profile URL (required)<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={draft.slug} onChange={(event) => field("slug", event.target.value.toLowerCase())} /></label>
        <label>Display name (required)<input required maxLength={200} value={draft.displayName} onChange={(event) => field("displayName", event.target.value)} /></label>
        <label>Business type (required; set by organization)<select disabled value={draft.businessType}><option value="brand">Brand</option><option value="retailer">Retailer</option><option value="dispensary">Dispensary</option></select></label>
        <label>Summary (optional)<textarea rows={3} value={draft.summary ?? ""} onChange={(event) => field("summary", event.target.value || null)} /></label>
        <label>Story (optional)<textarea rows={6} value={draft.story ?? ""} onChange={(event) => field("story", event.target.value || null)} /></label>
        <label>Categories (optional; comma separated)<input value={categories} onChange={(event) => setCategories(event.target.value)} /></label>
        <label>City (optional)<input value={draft.city ?? ""} onChange={(event) => field("city", event.target.value || null)} /></label>
        <label>State (optional)<input value={draft.state ?? ""} onChange={(event) => field("state", event.target.value || null)} /></label>
        <label>Region (optional)<input value={draft.region ?? ""} onChange={(event) => field("region", event.target.value || null)} /></label>
        <label>Public email (optional)<input type="email" value={draft.publicEmail ?? ""} onChange={(event) => field("publicEmail", event.target.value || null)} /></label>
        <label>Public phone (optional)<input type="tel" value={draft.publicPhone ?? ""} onChange={(event) => field("publicPhone", event.target.value || null)} /></label>
        <label>Website (optional)<input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
        <label>License type (optional)<input value={draft.licenseType ?? ""} onChange={(event) => field("licenseType", event.target.value || null)} /></label>
        <label>License number (optional)<input value={draft.licenseNumber ?? ""} onChange={(event) => field("licenseNumber", event.target.value || null)} /></label>
        <button className="button primary">{busy === "save" ? "Saving…" : "Save draft"}</button>
      </fieldset>
      {canSubmit && profile && editable && <><button className="button secondary" disabled={!!busy || missingSubmissionFields.length > 0} onClick={() => void submit()} type="button">{busy === "submit" ? "Submitting…" : profile.status === "correction_requested" ? "Resubmit for review" : "Submit for review"}</button>{missingSubmissionFields.length > 0 && <p className="boundary-note">Complete before submission: {missingSubmissionFields.join(", ").replaceAll("_", " ")}.</p>}</>}{profile?.status === "approved" && <Link className="text-link" href={`/profile/${profile.slug}`}>View public profile</Link>}
    </form>}
    {profile && editable && <section className="content-card auth-form"><h2>Business logo</h2><input accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => setLogo(event.target.files?.[0] ?? null)} /><div className="button-row"><button className="button primary" disabled={!logo || !!busy} onClick={() => void upload()}>{busy === "logo" ? "Working…" : "Upload logo"}</button>{profile.logoUrl && <button className="button secondary" disabled={!!busy} onClick={() => void removeLogo()}>Remove logo</button>}</div></section>}
  </div>;
}
