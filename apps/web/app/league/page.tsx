import Link from "next/link";

const participation = [
  ["Keep information current", "Complete monthly contact confirmation and maintain a useful verified profile."],
  ["Share useful signals", "Publish relevant promotions, events, market education, and operational updates."],
  ["Respond thoughtfully", "Acknowledge qualified introductions and protect selective business relationships."],
  ["Help the network grow", "Invite credible operators and service partners that strengthen the cannabis ecosystem."],
];

export default function LeaguePage() {
  return (
    <section className="page shell league-page">
      <div className="page-heading">
        <p className="eyebrow">Bridge League concept</p>
        <h1>A league built around cooperation, not public rankings</h1>
        <p className="lede">Bridge League can reward healthy participation privately while letting brands and operators remain selective about relationships. No public point total or leaderboard is included.</p>
      </div>
      <div className="league-principles">
        {participation.map(([title, body], index) => (
          <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{body}</p></div></article>
        ))}
      </div>
      <section className="private-recognition">
        <div><p className="eyebrow">Private by design</p><h2>Members see encouragement, not a popularity contest.</h2></div>
        <div className="recognition-list">
          <p><strong>Contribution streak</strong><span>Visible only to the member</span></p>
          <p><strong>Profile reliability</strong><span>Based on current information and response habits</span></p>
          <p><strong>Founding recognition</strong><span>Private benefit or rate, not a public rank</span></p>
        </div>
      </section>
      <section className="decision-panel">
        <p className="eyebrow">Tori’s input required</p>
        <h2>Choose what the reward actually unlocks</h2>
        <p>Possible rewards include private profile insights, founding rate protection, event access, early feature access, or recognition visible only inside the member’s own dashboard.</p>
        <Link className="button primary" href="/dashboard">See the member dashboard</Link>
      </section>
    </section>
  );
}
