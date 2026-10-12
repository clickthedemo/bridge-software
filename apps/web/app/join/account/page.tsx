import { Suspense } from "react";
import { AccountForm } from "./account-form";

export default function JoinAccountPage() {
  return (
    <div className="page shell auth-page">
      <div className="join-auth-layout">
        <header className="join-auth-heading">
          <p className="eyebrow">Account creation</p>
          <h1>Create your account.</h1>
          <p className="lede">Create your Bridge account, then continue setting up and verifying your organization.</p>
        </header>
        <Suspense fallback={<p>Loading account form…</p>}><AccountForm /></Suspense>
      </div>
    </div>
  );
}
