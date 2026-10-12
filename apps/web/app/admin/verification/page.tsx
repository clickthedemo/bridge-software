import { VerificationQueue } from "./verification-client";

export default function VerificationPage() {
  return (
    <section>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Verification queue</h1>
          <p className="lede">Review business identity, licenses, and profile readiness.</p>
        </div>
        <span className="status-chip pending">Live queue</span>
      </div>
      <VerificationQueue />
    </section>
  );
}
