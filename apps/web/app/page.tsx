import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bridge-home">
      <nav className="landing-nav" aria-label="Landing navigation">
        <Link className="landing-logo" href="/" aria-label="Bridge home">
          <Image src="/bridge-mark.svg" alt="" height={48} priority width={76} />
          <span>BRIDGE</span>
        </Link>
        <div className="landing-links">
          <Link className="button primary" href="/join">Join the Bridge</Link>
        </div>
      </nav>

      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-copy">
          <p className="hero-label">Verified cannabis community and market intelligence</p>
          <h1 id="hero-title">One industry.<br />One network.<br /><span>One Bridge.</span></h1>
          <p>
            Connect cannabis brands, dispensaries, cultivators, sales teams, and service partners. Follow industry activity, discover verified operators, and build the right relationships nationwide.
          </p>
          <div className="landing-links landing-actions">
            <Link className="button primary" href="/join">Join the verified network <span aria-hidden="true">→</span></Link>
            <Link className="button ghost" href="/explore">Explore cannabis businesses</Link>
          </div>
          <div className="landing-stats" aria-label="Bridge capabilities">
            <div><strong>50</strong><span>State discovery</span></div>
            <div><strong>03</strong><span>Audience controls</span></div>
            <div><strong>B2B</strong><span>EIN aware access</span></div>
          </div>
        </div>

        <div className="signal-visual" aria-label="Bridge connects the cannabis community, businesses, campaigns, and market discovery">
          <div className="signal-orbit" />
          <div className="signal-orbit" />
          <div className="signal-orbit" />
          <div className="signal-node one"><span><strong>Community</strong><small>Industry activity</small></span></div>
          <div className="signal-node two"><span><strong>Businesses</strong><small>Verified profiles</small></span></div>
          <div className="signal-node three"><span><strong>Campaigns</strong><small>Targeted promotion</small></span></div>
          <div className="signal-node four"><span><strong>Explore</strong><small>Markets and services</small></span></div>
          <div className="signal-core"><span><strong>Connected<br />cannabis</strong><small>Trusted by design</small></span></div>
        </div>
      </section>

      <section className="visual-story" aria-labelledby="visual-story-title">
        <div className="visual-story-copy">
          <span>Bridge in motion</span>
          <h2 id="visual-story-title">Find the signal. Meet the people. Move the cannabis industry forward.</h2>
          <p>One nationwide home for cannabis news, promotions, verified profiles, products, and industry services.</p>
        </div>
        <div className="visual-story-track" aria-label="Bridge product moments">
          <Link className="visual-story-card network" href="/community"><span>Community News</span><strong>A visual feed for useful cannabis industry discovery.</strong></Link>
          <Link className="visual-story-card markets" href="/explore"><span>Nationwide Explore</span><strong>Filter legal markets, products, brands, and services.</strong></Link>
          <Link className="visual-story-card identity" href="/my-profile"><span>Verified identity</span><strong>Know who is current before the introduction.</strong></Link>
        </div>
      </section>

      <nav className="entry-rail" aria-label="Enter the Bridge platform">
        <div className="entry-rail-copy">
          <span>Inside Bridge</span>
          <strong>One account. Four connected spaces.</strong>
        </div>
        <div className="entry-rail-links">
          <Link href="/community"><strong>Community News</strong><span>Follow people, products, events, and daily signals</span></Link>
          <Link href="/create"><strong>Create</strong><span>Publish targeted cannabis promotions</span></Link>
          <Link href="/my-profile"><strong>My Profile</strong><span>Manage identity, contacts, and access</span></Link>
          <Link href="/explore"><strong>Explore</strong><span>Search markets, businesses, products, and services</span></Link>
        </div>
      </nav>

      <section className="bridge-growth-model" aria-labelledby="growth-model-title">
        <div>
          <p className="hero-label">Bridge League</p>
          <h2 id="growth-model-title">Cooperate, contribute, and grow without public rankings.</h2>
          <p>Bridge League gives members private recognition for useful participation. There are no public leaderboards and no pressure to turn selective relationships into a popularity contest.</p>
          <Link className="button ghost" href="/league">Review the Bridge League concept</Link>
        </div>
        <div>
          <p className="hero-label">Founding pricing</p>
          <h2>See the membership concepts before billing is connected.</h2>
          <p>Review a consumer entry, the founding business concept discussed in the meeting, and a multi-market option. Every price remains subject to Tori’s approval.</p>
          <Link className="button ghost" href="/pricing">Review proposed pricing</Link>
        </div>
      </section>

      <section className="suite-section" id="suite" aria-labelledby="suite-title">
        <div className="suite-heading">
          <p>Built for the legal cannabis industry</p>
          <h2 id="suite-title">Four spaces. One connected Bridge.</h2>
          <span>Move from industry activity to trusted business discovery without leaving the platform.</span>
        </div>
        <div className="suite-grid">
          <article className="suite-card">
            <div className="arc" />
            <span className="number">Community News</span>
            <h3>See what the cannabis industry is doing now.</h3>
            <p>Follow launches, promotions, events, announcements, and community activity in a visual feed built for fast discovery.</p>
            <Link className="button ghost" href="/community">Open Community News <span aria-hidden="true">→</span></Link>
          </article>
          <article className="suite-card">
            <div className="arc" />
            <span className="number">Create</span>
            <h3>Publish cannabis promotions to the right audience.</h3>
            <p>Create targeted promotions while keeping public and protected business information separate.</p>
            <Link className="button ghost" href="/create">Open Create</Link>
          </article>
          <article className="suite-card">
            <div className="arc" />
            <span className="number">My Profile</span>
            <h3>A verified home base for your cannabis business.</h3>
            <p>Manage public information, business contacts, protected fields, and the details partners need before they connect.</p>
            <Link className="button ghost" href="/my-profile">Open My Profile</Link>
          </article>
          <article className="suite-card">
            <div className="arc" />
            <span className="number">Explore</span>
            <h3>Search the legal cannabis industry nationwide.</h3>
            <p>Find brands, dispensaries, cultivators, sales teams, service partners, products, and specialties across legal markets.</p>
            <Link className="button ghost" href="/explore">Open Explore <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>
    </div>
  );
}
