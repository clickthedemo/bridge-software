"use client";

import { FollowButton } from "@/components/FollowButton";
import { PostActions } from "@/components/PostActions";
import { getOwnAnalytics, useSocial } from "@/lib/social";

const orgs = [
  { id: "cascade-canna", name: "Cascade Canna Co.", detail: "Oregon · Edibles" },
  { id: "northstar-sales", name: "Northstar Sales Group", detail: "Michigan · Retail" },
  { id: "purple-route", name: "Purple Route Logistics", detail: "Michigan · Transport" },
];

const posts = [
  { id: "1", title: "Fall wholesale calendar is open", org: "Cascade Canna Co." },
  { id: "5", title: "New lab verified tincture line", org: "Greenline Goods" },
  { id: "20", title: "Retailer sample kit pairs product with education", org: "Cascade Canna Co." },
];

/* The demo route owns no stylesheet, so the two row layouts it needs sit here
   rather than in a component file that pages would then inherit. */
const rowStyle = { borderTop: "1px solid var(--border)", justifyContent: "space-between", paddingBlock: "16px" };

export default function SocialDesignSystemPage() {
  /* Subscribe once here too: the dashboard figures move as the controls above
     them are used, which is the fastest way to see that the store is shared. */
  const social = useSocial();
  const analytics = getOwnAnalytics(social);

  return (
    <section className="page shell">
      <div className="page-heading">
        <p className="eyebrow">Social components</p>
        <h1>Follow, repost, save.</h1>
        <p className="lede">
          Reposting is how a drop travels. Following is how a member keeps a supplier close. The
          number of followers an organization has is theirs alone.
        </p>
      </div>

      <p className="review-notice">
        Review build. The organizations and posts below are written sample content, and follower and
        repost figures are sample numbers rather than live activity. Following, reposting and saving
        all work for real and persist in this browser.
      </p>

      <div className="system-stack">
        <section className="content-card">
          <p className="eyebrow">FollowButton</p>
          <h3>Follow an organization</h3>
          <p className="muted">
            Nothing on this row says how many followers an organization has, on a profile or
            anywhere else a member can see. That is the point, not an omission.
          </p>
          {orgs.map((org) => (
            <div className="component-row" key={org.id} style={rowStyle}>
              <span>
                <strong>{org.name}</strong>
                <br />
                <small className="muted">{org.detail}</small>
              </span>
              <FollowButton orgId={org.id} orgName={org.name} />
            </div>
          ))}
        </section>

        <section className="content-card">
          <p className="eyebrow">PostActions</p>
          <h3>Repost and save a post</h3>
          <p className="muted">
            A repost count is public — it is the visible sign that a product drop is spreading. A
            save is private, so no save count is rendered for anyone, the owner included.
          </p>
          {posts.map((post) => (
            <article className="component-row" key={post.id} style={rowStyle}>
              <span>
                <strong>{post.title}</strong>
                <br />
                <small className="muted">{post.org}</small>
              </span>
              <PostActions postId={post.id} postTitle={post.title} />
            </article>
          ))}
        </section>

        <section className="content-card">
          <p className="eyebrow">Owner-only analytics</p>
          <h3>Your back end</h3>
          <p className="muted">
            These are the figures a member sees about their own organization. They are read from
            <code> getOwnAnalytics()</code> and must never be rendered beside another member&rsquo;s
            profile.
          </p>
          <dl style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", margin: "18px 0 0" }}>
            {[
              ["Followers", analytics.followers],
              ["Reposts of your posts", analytics.repostsOfMyPosts],
              ["Organizations you follow", analytics.following],
              ["Posts you reposted", analytics.repostsMade],
              ["Posts you saved", analytics.saved],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="eyebrow">{label}</dt>
                <dd style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, margin: 0 }}>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="form-hint">
            Followers and reposts of your posts are sample figures. The three counts below them are
            your real activity in this browser.
          </p>
        </section>
      </div>
    </section>
  );
}
