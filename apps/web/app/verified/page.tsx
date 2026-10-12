import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { StatusChip } from "@/components/StatusChip";

export const metadata: Metadata = {
  title: "What verified means on Bridge",
  description:
    "How Bridge checks who a business is, what a verified badge unlocks, and what it deliberately does not claim.",
};

/*
 * Every other surface uses the word "verified" - the Explore heading, the
 * badge on a card, the audience names, the join CTA - and nothing explained
 * it. This page is the answer, and it is written from what the product
 * actually enforces rather than from an aspiration.
 */

const CHECKS = [
  {
    image: "/bridge-editorial/verified-licence-check.webp",
    imageAlt: "An operator checking licence paperwork against a business record",
    title: "Who the business legally is",
    body: "Legal name, EIN where the role has one, and the name people actually know it by. The two are not always the same, so buyers need both.",
  },
  {
    image: "/bridge-editorial/community-michigan-testing.webp",
    imageAlt: "A compliance lab technician logging a licensed sample",
    title: "The license the role requires",
    body: "A dispensary shows a dispensary license, a cultivator a cultivation license, a lab its credentials. Roles without a state license, like media, show references instead.",
  },
  {
    image: "/bridge-editorial/community-illinois-route-planning.webp",
    imageAlt: "A logistics team mapping the markets a business serves",
    title: "Where they actually operate",
    body: "Locations and the markets a business serves, so a search in one state does not surface someone who cannot trade there.",
  },
  {
    image: "/bridge-editorial/profile-protected-details.webp",
    imageAlt: "A named account owner reviewing their business record",
    title: "A named contact who owns the record",
    body: "One person accountable for the profile being current. A verified badge on a stale record is worse than no badge.",
  },
];

const UNLOCKS = [
  {
    image: "/bridge-editorial/profile-harbor-dispensary.webp",
    imageAlt: "Protected pricing and terms shown only to verified partners",
    title: "Protected business detail",
    body: "Pricing, terms and B2B contacts sit behind verification. Turning protected detail on removes public targeting automatically, so a trade-only post cannot reach consumers by accident.",
  },
  {
    image: "/bridge-editorial/community-oregon-sample-kit.webp",
    imageAlt: "A wholesale sample kit prepared for verified buyers",
    title: "B2B-only reach",
    body: "Post a drop to purchasers without it appearing in the public feed. Verification is what makes that boundary mean something.",
  },
  {
    image: "/bridge-editorial/community-new-york-interview.webp",
    imageAlt: "Two operators meeting after an introduction request",
    title: "Introductions",
    body: "Requests route to verified staff for review. Contact details are never disclosed by the request itself.",
  },
];

export default function VerifiedPage() {
  return (
    <div className="page shell">
      <div className="page-heading page-heading-with-media">
        <div>
          <p className="eyebrow">Trust on Bridge</p>
          <h1>What verified actually means.</h1>
          <p className="lede">
            Anyone can claim to be a licensed operator. The badge exists so buyers do not have to
            take that on faith, and so trade-only information stays on the trade side.
          </p>
          <p className="handwrite">a badge nobody can buy</p>
        </div>
        <div className="grain-image page-heading-media">
          <Image
            alt="Hands checking a licence document against records on a laptop"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 38vw"
            src="/bridge-editorial/verified-licence-check.webp"
          />
        </div>
      </div>

      <section className="verified-states" aria-labelledby="verified-states-title">
        <h2 id="verified-states-title">Two states, said plainly</h2>
        <div className="verified-state-grid">
          <article className="content-card verified-state">
            <StatusChip verified />
            <p>
              Identity, license and location have been checked against the requirements for that
              role. The record has a named owner who keeps it current.
            </p>
          </article>
          <article className="content-card verified-state">
            <StatusChip verified={false} />
            <p>
              Submitted and waiting. A pending business is still listed and still searchable. It
              simply cannot reach verified-only audiences or see protected detail yet.
            </p>
          </article>
        </div>
      </section>

      <section aria-labelledby="verified-checks-title">
        <h2 id="verified-checks-title">What gets checked</h2>
        <div className="card-grid verified-checks">
          {CHECKS.map((check) => (
            <article className="content-card blurb-card" key={check.title}>
              <div className="grain-image blurb-media">
                <Image alt={check.imageAlt} fill sizes="(max-width: 720px) 100vw, 30vw" src={check.image} />
              </div>
              <h3>{check.title}</h3>
              <p>{check.body}</p>
            </article>
          ))}
        </div>
        <p className="form-hint">
          Exact requirements vary by role. The twelve role types and what each one submits are
          listed on the join page.
        </p>
      </section>

      <section aria-labelledby="verified-unlocks-title">
        <h2 id="verified-unlocks-title">What the badge unlocks</h2>
        <div className="card-grid verified-checks">
          {UNLOCKS.map((unlock) => (
            <article className="content-card blurb-card" key={unlock.title}>
              <div className="grain-image blurb-media">
                <Image alt={unlock.imageAlt} fill sizes="(max-width: 720px) 100vw, 30vw" src={unlock.image} />
              </div>
              <h3>{unlock.title}</h3>
              <p>{unlock.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="verified-limits-title">
        <h2 id="verified-limits-title">What it does not mean</h2>
        <article className="content-card verified-limits">
          <p>
            Verified is a check on identity and license. It is not a rating, not an endorsement,
            and not a judgment about whether a business is good to work with. Bridge does not
            score members and does not sell a higher badge.
          </p>
          <p className="muted">
            A verified badge is also a point-in-time check. Licenses lapse, so the named contact on
            each record is asked to confirm details on a schedule rather than once at signup.
          </p>
        </article>
      </section>

      <div className="button-row">
        <Link className="button primary" href="/join">
          Get verified
        </Link>
        <Link className="button secondary" href="/explore">
          Browse verified businesses
        </Link>
      </div>
    </div>
  );
}
