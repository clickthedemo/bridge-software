import Image from "next/image";
import Link from "next/link";
import { MyProfileClient } from "./my-profile-client";
import { RequireAuth } from "@/components/auth/RequireAuth";
export default function MyProfilePage() {
  return (
    <RequireAuth><div className="page shell">
      <div className="page-heading page-heading-with-media">
        <div>
          <p className="eyebrow">My Profile</p>
          <h1>Give cannabis partners the right way to reach you</h1>
          <p><Link className="button secondary" href="/join/organization">Manage your organization</Link></p>
          <p className="lede small">Let the public know about you. Share the special work you have put into the industry, instead of relying on marketers, budtenders, managers and everyone else to tell your story. Let those people get it from the source. New team? List them via B2B so businesses know who to contact even when you have team changes.</p>
        </div>
        <div className="grain-image page-heading-media"><Image alt="Business team reviewing public and protected profile details" fill priority sizes="(max-width: 900px) 100vw, 38vw" src="/bridge-editorial/profile-protected-details.webp" /></div>
      </div>
      <MyProfileClient />
    </div></RequireAuth>
  );
}
