import { directionNames, lockedTheme, type ThemeId } from "@/lib/direction-lock";

// Swatches must match the theme tokens in globals.css so the comparison is honest.
const directions: {
  name: string;
  id: ThemeId;
  promise: string;
  rationale: string;
  colors: string[];
  recommendation?: boolean;
}[] = [
  {
    name: "01 · Trusted Current",
    id: "current",
    promise: "Credible, useful, and distinctly B2B.",
    rationale: "Navy and teal establish trust without copying category clichés. Amber creates a human signal for introductions and pending actions.",
    colors: ["#12324A", "#0A766E", "#D9820F", "#F5F8F7"],
  },
  {
    name: "02 · Modern Network",
    id: "network",
    promise: "Bold, connected, and startup-forward.",
    rationale: "Ink, electric violet, and coral make Bridge feel like a modern software network rather than a directory listing site.",
    colors: ["#17152D", "#6556E8", "#D95848", "#F7F6FB"],
    recommendation: true,
  },
  {
    name: "03 · Botanical Ledger",
    id: "botanical",
    promise: "Grounded, premium, and industry-aware.",
    rationale: "Forest and sage acknowledge the category while restrained copper keeps the identity professional rather than dispensary-themed.",
    colors: ["#173C2C", "#4F6F57", "#B45F2A", "#F6F5EF"],
  },
];

export default function DirectionsPage() {
  return (
    <section className="page shell">
      <div className="page-heading split-heading">
        <div><p className="eyebrow">Archived brand exploration</p><h1>Connected purple remains the active Bridge direction.</h1><p className="lede">The earlier visual options remain here as a decision record. They no longer change the active review build.</p>{lockedTheme && <p className="form-hint">This archival staging build is pinned to {directionNames[lockedTheme]}.</p>}</div>
      </div>
      <div className="direction-grid">
        {directions.map((direction) => (
          <article className="direction-card" key={direction.id}>
            <div className="direction-top"><span>{direction.name}</span>{direction.recommendation && <span className="status-chip verified">Recommended</span>}</div>
            <div className={`direction-preview preview-${direction.id}`}>
              <span className="preview-mark">B</span><div><strong>Build better business connections.</strong><small>Verified cannabis industry network</small></div>
            </div>
            <h2>{direction.promise}</h2>
            <p>{direction.rationale}</p>
            <div className="swatches" aria-label={`${direction.name} colors`}>{direction.colors.map((color) => <span key={color} style={{ background: color }} title={color} />)}</div>
            <span className={`status-chip ${direction.id === "network" ? "verified" : ""}`}>
              {direction.id === "network" ? "Active Bridge direction" : "Archived reference"}
            </span>
          </article>
        ))}
      </div>
      <div className="content-card meeting-note"><p className="eyebrow">Production confirmation</p><h2>Ask Tori to confirm the active direction, not reopen the visual system.</h2><p>The remaining brand question is whether Connected purple and the current Bridge mark are formally approved for production.</p></div>
    </section>
  );
}
