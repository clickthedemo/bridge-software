import Link from "next/link";
import "./get-listed-band.css";

/**
 * The seller side of Explore. Every other surface on that page is buyer-side
 * search; this one addresses the business being searched for, so it sits on
 * the brand ground rather than glass and reads as an address rather than
 * another result card.
 *
 * No state and no handlers, so it stays a server component.
 */
export function GetListedBand() {
  return (
    <section aria-labelledby="get-listed-title" className="get-listed-band">
      <div className="get-listed-copy">
        <p className="eyebrow">For cannabis operators</p>
        <h2 id="get-listed-title">Tell the industry you exist.</h2>
        <p className="get-listed-lede">
          The big ad platforms will not run cannabis ads. Bridge is the opposite: your brand,
          your markets and how to reach you, in the same place buyers come to search.
        </p>
        <p className="handwrite right">nobody else will run your ads. we will.</p>
      </div>
      <Link className="button get-listed-cta" href="/join">Get listed</Link>
      <p className="review-notice">
        Review build. This opens Step 1 of the join flow, not a live listing. Role selection
        works now. Verification and publishing come later.
      </p>
    </section>
  );
}
