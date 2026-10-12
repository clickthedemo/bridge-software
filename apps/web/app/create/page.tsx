import Image from "next/image";
import { BoostPanel } from "@/components/BoostPanel";
import { CreateClient } from "./create-client";
import { isPhase3LiveApi } from "@/lib/phase3";
export default function CreatePage() {
  return (
    <div className="page shell">
      <div className="page-heading page-heading-with-media">
        <div>
          <p className="eyebrow">{isPhase3LiveApi() ? "News and announcements" : "Create a Cannabis Promotion"}</p>
          <h1>Reach the right audience in the cannabis WORLD</h1>
          <p className="lede small">{isPhase3LiveApi() ? "Share a useful update from your directory profile. Start with a draft, then publish from a verified public profile." : "Build a promotion for consumers, verified operators, or just the trade. PNG, JPEG, WebP, or PDF, up to 25 MB. Protected business details never show up in the public feed."}</p>
        </div>
        <div className="grain-image page-heading-media"><Image alt="Cannabis marketer preparing product photography and promotion layouts" fill priority sizes="(max-width: 900px) 100vw, 38vw" src="/bridge-editorial/create-promotion-studio.webp" /></div>
      </div>
      <CreateClient />
      {!isPhase3LiveApi() && <BoostPanel />}
    </div>
  );
}
