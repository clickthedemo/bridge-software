import { CommunityClient } from "./community-client";
export default function CommunityPage() {
  return (
    <div className="page shell">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">Cannabis Community News</p>
          <h1>See what the cannabis world is up to</h1>
          <p className="lede small">Dispensary promos, alerts to new drops, strains coming down the pipeline, events to get invited to, job findings, and more. Check all 50 states or just yours.</p>
        </div>
      </div>
      <CommunityClient />
    </div>
  );
}
