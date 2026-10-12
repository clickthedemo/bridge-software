import Link from "next/link";
import { BoostPanel } from "@/components/BoostPanel";
import { PromotedSlot } from "@/components/PromotedSlot";
import { StatusChip } from "@/components/StatusChip";
import { profiles } from "@/lib/data";

export const metadata = { title: "Boost · Bridge design system" };

const demoProfiles = profiles.slice(0, 2);

export default function BoostDemoPage() {
  return (
    <section className="page shell">
      <div className="page-heading">
        <p className="eyebrow">Placement concept</p>
        <h1>Boost.</h1>
        <p className="lede">
          Two pieces: a panel where a business would buy a placement, and the marker every bought
          placement carries. Both are previews of a capability Bridge does not have yet, so nothing
          on this page can be purchased.
        </p>
      </div>

      <div className="system-stack">
        <section>
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Where it lives</p>
              <h2>Beside the results</h2>
            </div>
          </div>
          <p className="lede small">
            The panel is container-width, so the same component sits in the 250px Directory sidebar
            here or fills a dashboard column in the business backend.
          </p>
          <div className="directory-layout">
            <aside aria-label="Boost placements">
              <BoostPanel />
            </aside>
            <div className="card-grid two">
              {demoProfiles.map((profile, index) => (
                <article className="profile-card" key={profile.slug}>
                  <div className="card-topline">
                    <span className="avatar" aria-hidden="true">{profile.initials}</span>
                    {index === 0 && <PromotedSlot />}
                    <StatusChip verified={profile.verified} />
                  </div>
                  <p className="eyebrow">{profile.role}</p>
                  <h3>{profile.name}</h3>
                  <p className="muted">{profile.location}</p>
                  <p>{profile.description}</p>
                  <div className="tag-row" aria-label="Specialties">
                    {profile.specialties.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                  </div>
                  <Link className="text-link" href={`/profile/${profile.slug}`}>
                    View profile <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="content-card">
          <p className="eyebrow">The marker</p>
          <h2>A bought result says so</h2>
          <p>
            The first card above is marked <PromotedSlot /> and the second is not. The marker rides
            in the same row as the verification chip, so a promoted card keeps its layout, its
            height and its place in the grid — the only difference is that a member can tell.
          </p>
          <p>
            It is not decoration. Wherever Bridge sells position, the position has to be labelled,
            or the directory stops being worth reading.
          </p>
        </section>
      </div>
    </section>
  );
}
