import { ExploreClient } from "./explore-client";
export default function ExplorePage() {
  return (
    <div className="page shell">
      <div className="page-heading">
        <p className="eyebrow">Explore the Cannabis Industry</p>
        <h1>Find verified cannabis businesses nationwide</h1>
        <p className="lede small">Search brands, dispensaries, cultivators, sales teams, service partners, products, and specialties across all 50 states and D.C. Sample records remain limited, and favorites stay on this device in the prototype.</p>
      </div>
      <ExploreClient />
    </div>
  );
}
