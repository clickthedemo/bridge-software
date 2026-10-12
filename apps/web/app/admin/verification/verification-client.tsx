"use client";

import { useEffect, useMemo, useState } from "react";
import { getPhase3Client, isPhase3LiveApi } from "@/lib/phase3";

import { normalizeVerificationQueue, type VerificationQueueRow } from "@/lib/phase3/verification-queue";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function VerificationQueue() {
  const client = useMemo(() => getPhase3Client(), []);
  const [rows, setRows] = useState<VerificationQueueRow[]>([]);
  const [status, setStatus] = useState("");
  const [itemType, setItemType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setError("");
      client.getVerificationQueue({ status: status || undefined, itemType: itemType || undefined, limit: 50 })
        .then((response) => { const parsed = normalizeVerificationQueue(response); if (active) setRows(parsed); })
        .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "The verification queue could not be loaded."); })
        .finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; };
  }, [client, status, itemType, reload]);

  return <>
    <section className="admin-content-card admin-user-filters" aria-label="Verification queue filters">
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Default active queue</option><option value="pending">Pending</option><option value="in_review">In review</option><option value="verification_requested">Verification requested</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="correction_required">Correction required</option><option value="not_applicable">Not applicable</option></select></label>
      <label><span>Item type</span><select value={itemType} onChange={(event) => setItemType(event.target.value)}><option value="">All item types</option><option value="ein">EIN</option><option value="cannabis_license">Cannabis license</option><option value="business_registration">Business registration</option><option value="document">Document</option></select></label>
    </section>
    <div className="content-card table-card">
      <div className="result-bar"><strong>{rows.length} queue items</strong><span className="status-chip pending">{isPhase3LiveApi() ? "Live API" : "Preview"}</span></div>
      {loading && <p className="admin-users-empty" role="status">Loading verification queue…</p>}
      {!loading && error && <div className="admin-users-error" role="alert"><p>{error}</p><button className="button" onClick={() => setReload((value) => value + 1)} type="button">Try again</button></div>}
      {!loading && !error && <div className="table-scroll"><table><thead><tr><th>Organization</th><th>Type</th><th>Status</th><th>Submitted</th><th>Case ID</th></tr></thead><tbody>
        {rows.map((item) => <tr key={item.id}><td><strong>{item.organization}</strong></td><td>{label(item.itemType)}</td><td><span className={`status-chip ${item.status === "verified" ? "verified" : item.status === "rejected" || item.status === "correction_required" ? "warning" : "pending"}`}>{label(item.status)}</span></td><td>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}</td><td><code>{item.caseId}</code></td></tr>)}
        {!rows.length && <tr><td className="admin-users-empty" colSpan={5}>No verification cases match these filters.</td></tr>}
      </tbody></table></div>}
    </div>
  </>;
}
