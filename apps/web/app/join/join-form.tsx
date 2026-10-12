"use client";

import Link from "next/link";
import { useState } from "react";
import { accountPathForRole, joinRoles } from "@/lib/onboarding/roles";
import type { MemberRole } from "@/lib/types";

export function JoinForm() {
  const [selectedRole, setSelectedRole] = useState<MemberRole>("Brand");
  const selected = joinRoles.find((role) => role.name === selectedRole) ?? joinRoles[0];

  return (
    <form className="join-form" onSubmit={(event) => event.preventDefault()}>
      <fieldset>
        <legend className="sr-only">Choose your member role</legend>
        <div className="role-grid">
          {joinRoles.map((role, index) => (
            <label className="role-card" key={role.name}>
              <input checked={selectedRole === role.name} name="role" onChange={() => setSelectedRole(role.name)} type="radio" value={role.name} />
              <span className="role-icon" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <strong>{role.name}</strong><small>{role.description}</small>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-preview">
        <div><span className="step-label">Next up</span><strong>{selected.nextTitle}</strong><small>{selected.requirements}</small></div>
        <Link className="button primary" href={accountPathForRole(selectedRole)}>Continue</Link>
      </div>
      <div className="join-pricing-note">
        <div><p className="eyebrow">Founding member concept</p><strong>First six months proposed free, then $349 per month for a verified business membership.</strong></div>
        <Link className="text-link" href="/pricing">Review pricing assumptions</Link>
      </div>
    </form>
  );
}
