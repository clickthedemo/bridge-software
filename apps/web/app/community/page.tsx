import { CommunityClient } from "./community-client";
export default function CommunityPage() {
  return (
    <div className="page shell">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">Cannabis Community News</p>
          <h1>Follow what the cannabis industry is doing now</h1>
          <p className="lede small">Scan launches, promotions, events, and member updates across all 50 states and D.C. The review feed uses clearly labeled sample activity while the nationwide filter, Visual News, and Classic Feed behaviors stay fully testable. The default view remains pending Tori’s decision.</p>
        </div>
      </div>
      <CommunityClient />
    </div>
  );
}
