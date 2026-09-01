import { VerificationQueue } from "./verification-client";

export default function VerificationPage() {
  return (
    <section className="page shell">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Verification queue</h1>
          <p className="lede">Review business identity, licenses, and profile readiness.</p>
        </div>
        <span className="status-chip pending">14 awaiting review</span>
      </div>
      <div className="admin-layout">
        <aside className="filter-panel admin-nav">
          <strong>Administration</strong>
          <button className="active" type="button">Verification <span>14</span></button>
          <button disabled title="Planned for the post-decision build" type="button">Reported profiles <span>3</span></button>
          <button disabled title="Planned for the post-decision build" type="button">Content moderation <span>8</span></button>
          <button disabled title="Planned for the post-decision build" type="button">Member management</button>
          <p className="form-hint">Other admin areas are planned for the post-decision build.</p>
        </aside>
        <VerificationQueue />
      </div>
    </section>
  );
}
