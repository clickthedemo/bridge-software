import Image from "next/image";
import { CreateClient } from "./create-client";
export default function CreatePage() {
  return (
    <div className="page shell">
      <div className="page-heading page-heading-with-media">
        <div>
          <p className="eyebrow">Create · Cannabis Promotion</p>
          <h1>Reach the right cannabis industry audience</h1>
          <p className="lede small">Build a promotion for consumers, verified operators, or selected business roles. Upload PNG, JPEG, WebP, or PDF up to 25 MB. Protected business details automatically remove public targeting.</p>
        </div>
        <div className="grain-image page-heading-media"><Image alt="Cannabis marketer preparing product photography and promotion layouts" fill priority sizes="(max-width: 900px) 100vw, 38vw" src="/bridge-editorial/create-promotion-studio.webp" /></div>
      </div>
      <CreateClient />
    </div>
  );
}
