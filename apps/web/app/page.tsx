import Link from "next/link";
import Image from "next/image";
import { HeroFilm } from "@/components/HeroFilm";
import { HomeAccountLink } from "@/components/HomeAccountLink";
import { PostPeek } from "@/components/PostPeek";
import { SuitePeek } from "@/components/SuitePeek";

export default function Home() {
  return (
    <div className="bridge-home">
      <nav className="landing-nav" aria-label="Landing navigation">
        <Link className="landing-logo" href="/" aria-label="Bridge home">
          <Image src="/bridge-mark.svg" alt="" height={48} priority width={76} />
          <span>BRIDGE</span>
        </Link>
        <div className="landing-links">
          <HomeAccountLink className="button primary" signedOutLabel="Join the Bridge" authenticatedLabel="My Profile" />
        </div>
      </nav>

      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-copy">
          <p className="hero-label">Verified cannabis community</p>
          <h1 id="hero-title">One industry.<br />One network.<br /><span>One Bridge.</span></h1>
          <p className="hero-tagline">To connect us all.</p>
          <p>
            A space to promote yourself, have others help promote you, advertise your movement, and let people know what you are doing. A space to connect, a space to build, a space to keep in touch.
          </p>
          <div className="landing-links landing-actions">
            <HomeAccountLink className="button primary" signedOutLabel="Business sign up" authenticatedLabel="Open Bridge" showArrow />
            <Link className="button ghost" href="/join?audience=consumer">Consumer sign up</Link>
          </div>
          <p className="signup-note">
            Business accounts are EIN verified and can post. Consumer accounts skip
            verification and can repost, save and follow, not post.
          </p>
          <div className="landing-stats" aria-label="Bridge capabilities">
            <div><strong>50</strong><span>State discovery</span></div>
            <div><strong>03</strong><span>Audience controls</span></div>
            <div><strong>B2B</strong><span>EIN-verified access</span></div>
          </div>
          <p className="handwrite aside">no algorithm deciding who gets seen. just the industry, talking.</p>
        </div>

        {/* Launch video slot. Tori asked for the orbit graphic to become the
            launch film; this is the interim plate until her cut is finished.
            Swap the two paths below and nothing else changes. */}
        {/* Launch video slot. Interim plate until Tori's cut is finished;
            swap the two paths and nothing else changes. */}
        <div className="signal-visual">
          <HeroFilm
            label="Bridge launch film: the Bridge mark painted on a city wall"
            poster="/bridge-launch-poster.webp"
            src="/bridge-launch.mp4"
          />
        </div>
      </section>

      <section className="visual-story" aria-labelledby="visual-story-title">
        <div className="visual-story-copy">
          <span>Bridge in motion</span>
          <h2 id="visual-story-title">Stay connected with the world. Move the industry forward.</h2>
          <p>One nationwide home for cannabis news, promotions, verified profiles, products, and services.</p>
          <p className="handwrite right">everything in one place, finally</p>
        </div>
        <div className="visual-story-track" aria-label="Bridge product moments">
          <Link className="visual-story-card network" href="/community"><span>Community News</span><strong>Where the industry shows up every day.</strong><em>Find out about events state by state. Get involved, get tickets, get in the know.</em></Link>
          <Link className="visual-story-card markets" href="/explore"><span>Nationwide Explore</span><strong>Every legal market, one search away.</strong><em>Look up any brand, learn about them, watch their business grow, support them or learn from them.</em></Link>
          <Link className="visual-story-card identity" href="/verified"><span>Verified identity</span><strong>Know who is current before you make the introduction.</strong><em>Skip the gossip and the rumours. Find out from the source.</em></Link>
        </div>
      </section>

      <nav className="entry-rail" aria-label="Enter the Bridge platform">
        <div className="entry-rail-copy">
          <span>Inside Bridge</span>
          <strong>One account. Four connected spaces.</strong>
        </div>
        <div className="entry-rail-links">
          <Link href="/community"><strong>Community News</strong><span>Follow people, products, events, and daily signals</span></Link>
          <Link href="/create"><strong>Create</strong><span>Post promotions to the right people</span></Link>
          <Link href="/my-profile"><strong>My Profile</strong><span>Manage your identity, contacts, and access</span></Link>
          <Link href="/explore"><strong>Explore</strong><span>Search markets, businesses, products, and services</span></Link>
        </div>
      </nav>

      <section className="bridge-growth-model" aria-labelledby="growth-model-title">
        <div>
          <p className="hero-label">Bridge League</p>
          <h2 id="growth-model-title">Get recognized for good work, not for winning.</h2>
          <p>Post in a place that lets you post, and get recognized for it. Bridge League recognizes useful participation privately. No public leaderboard, no pressure to turn relationships into a competition.</p>
          <Link className="button ghost" href="/league">See the Bridge League concept</Link>
        </div>
        <div className="post-peek">
          <p className="hero-label">A look inside</p>
          <h2>This is what a post looks like.</h2>
          <PostPeek />
        </div>
      </section>

      <section className="suite-section" id="suite" aria-labelledby="suite-title">
        <div className="suite-heading">
          <p>Built for the legal cannabis industry</p>
          <h2 id="suite-title">Four spaces. One connected Bridge.</h2>
          <span>Keep up with the industry, promote yourself, and find who you need. All without leaving Bridge.</span>
        </div>
        <div className="suite-grid">
          <article className="suite-card">
            <div className="arc" />
            <span className="number">Community News</span>
            <SuitePeek kind="news" />
            <h3>See what the industry is doing right now.</h3>
            <p>Launches, promotions, events, and what people are talking about. All in one feed.</p>
            <Link className="button ghost" href="/community">Open Community News <span aria-hidden="true">→</span></Link>
          </article>
          <article className="suite-card">
            <div className="arc" />
            <span className="number">Create</span>
            <SuitePeek kind="create" />
            <h3>Get your promotion to the right people.</h3>
            <p>Post for consumers, verified operators, or just the trade. Protected details stay out of the public feed automatically.</p>
            <Link className="button ghost" href="/create">Open Create</Link>
          </article>
          <article className="suite-card">
            <div className="arc" />
            <span className="number">My Profile</span>
            <SuitePeek kind="profile" />
            <h3>Your verified home base in the industry.</h3>
            <p>Keep your public info, contacts, and protected details current for the partners who need them.</p>
            <Link className="button ghost" href="/my-profile">Open My Profile</Link>
          </article>
          <article className="suite-card">
            <div className="arc" />
            <span className="number">Explore</span>
            <SuitePeek kind="explore" />
            <h3>Find who you need, anywhere in the country.</h3>
            <p>Brands, dispensaries, cultivators, service partners, and everything in between. Across every legal market.</p>
            <Link className="button ghost" href="/explore">Open Explore <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>
    </div>
  );
}
