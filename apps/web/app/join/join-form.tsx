"use client";

import { useState } from "react";
import Link from "next/link";
import type { MemberRole } from "@/lib/types";

// Role requirements are provisional pending the verification policy (decision D-03).
const roles: { name: MemberRole; description: string; nextTitle: string; requirements: string }[] = [
  {
    name: "Brand",
    description: "Show products, markets, and retail partnership needs.",
    nextTitle: "Organization details",
    requirements: "Legal name, public name, EIN, license, location, and contact owner.",
  },
  {
    name: "Dispensary",
    description: "Find brands and representatives aligned with your customers.",
    nextTitle: "Organization details",
    requirements: "Legal name, dispensary license, locations, and contact owner.",
  },
  {
    name: "Retailer",
    description: "Build a verified organization profile for partner discovery.",
    nextTitle: "Organization details",
    requirements: "Legal name, retail license or permit, locations, and contact owner.",
  },
  {
    name: "Sales rep",
    description: "Represent territories, specialties, and available relationships.",
    nextTitle: "Representative details",
    requirements: "Name, territories, current lines, references, and license where a state requires one.",
  },
  {
    name: "Cultivator",
    description: "Share cultivation capabilities, genetics, availability, and licensed markets.",
    nextTitle: "Cultivation details",
    requirements: "Legal name, EIN, cultivation license, facilities, markets, and contact owner.",
  },
  {
    name: "Manufacturer",
    description: "Connect products, production capacity, brands, and retail partners.",
    nextTitle: "Manufacturing details",
    requirements: "Legal name, EIN, manufacturing license, facilities, capabilities, and contact owner.",
  },
  {
    name: "Lab",
    description: "Keep current testing contacts, services, and intake information visible.",
    nextTitle: "Laboratory details",
    requirements: "Legal name, EIN, laboratory credentials, service markets, references, and contact owner.",
  },
  {
    name: "Transport",
    description: "Publish licensed routes, capacity, and operational availability.",
    nextTitle: "Transport details",
    requirements: "Legal name, EIN, transport credentials, service area, references, and contact owner.",
  },
  {
    name: "Bank",
    description: "Support verified cannabis operators with appropriate financial services.",
    nextTitle: "Financial service details",
    requirements: "Legal name, regulated entity information, service markets, references, and contact owner.",
  },
  {
    name: "Service",
    description: "Offer HVAC, electrical, construction, legal, accounting, and facility expertise.",
    nextTitle: "Service details",
    requirements: "Legal name, EIN, credentials, cannabis references, service area, and contact owner.",
  },
  {
    name: "Media",
    description: "Publish credible cannabis reporting, education, and market explainers.",
    nextTitle: "Publisher details",
    requirements: "Publication name, editorial contact, coverage focus, references, and disclosure policy.",
  },
  {
    name: "Hydroponics",
    description: "Connect cultivation teams with equipment, systems, and facility support.",
    nextTitle: "Supplier details",
    requirements: "Legal name, EIN, product categories, service markets, references, and contact owner.",
  },
];

export function JoinForm() {
  const [selectedRole, setSelectedRole] = useState<MemberRole>("Brand");
  const [showBoundaryNote, setShowBoundaryNote] = useState(false);
  const selected = roles.find((role) => role.name === selectedRole) ?? roles[0];

  return (
    <form className="join-form" onSubmit={(event) => event.preventDefault()}>
      <fieldset>
        <legend className="sr-only">Choose your member role</legend>
        <div className="role-grid">
          {roles.map((role, index) => (
            <label className="role-card" key={role.name}>
              <input
                checked={selectedRole === role.name}
                name="role"
                onChange={() => setSelectedRole(role.name)}
                type="radio"
                value={role.name}
              />
              <span className="role-icon" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <strong>{role.name}</strong>
              <small>{role.description}</small>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-preview">
        <div>
          <span className="step-label">Next up</span>
          <strong>{selected.nextTitle}</strong>
          <small>{selected.requirements}</small>
        </div>
        <button className="button primary" onClick={() => setShowBoundaryNote(true)} type="button">
          Continue
        </button>
      </div>
      <p className="form-hint">Requirements shown are provisional pending the verification policy (decision D-03).</p>
      <div className="join-pricing-note">
        <div><p className="eyebrow">Founding member concept</p><strong>First six months proposed free, then $349 per month for a verified business membership.</strong></div>
        <Link className="text-link" href="/pricing">Review pricing assumptions</Link>
      </div>
      <div aria-live="polite" role="status">
        {showBoundaryNote && (
          <p className="boundary-note">
            Steps 2–4 — {selected.nextTitle.toLowerCase()}, verification evidence, and review — require an
            authenticated member account, a saved organization draft, protected evidence uploads, and the
            verification review API. This preview stays at Step 1 until Miraj&rsquo;s backend contract is connected.
          </p>
        )}
      </div>
    </form>
  );
}
