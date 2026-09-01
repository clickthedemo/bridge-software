import Image from "next/image";
import { MyProfileClient } from "./my-profile-client";
export default function MyProfilePage() {
  return (
    <div className="page shell">
      <div className="page-heading page-heading-with-media">
        <div>
          <p className="eyebrow">My Profile · Verified Cannabis Business</p>
          <h1>Give cannabis partners the right way to reach you</h1>
          <p className="lede small">Manage what the public sees and what verified businesses can access. Keep sales and accounting contacts current through a required monthly check, and protect EIN documents from public view.</p>
        </div>
        <div className="grain-image page-heading-media"><Image alt="Business team reviewing public and protected profile details" fill priority sizes="(max-width: 900px) 100vw, 38vw" src="/bridge-editorial/profile-protected-details.webp" /></div>
      </div>
      <MyProfileClient />
    </div>
  );
}
