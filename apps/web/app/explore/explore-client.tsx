"use client";
import Image from "next/image";
import { LiveDirectory } from "@/components/LiveDirectory";
import { isPhase3LiveApi } from "@/lib/phase3";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { profiles } from "@/lib/data";
import { US_STATE_OPTIONS } from "@/lib/states";
import { matchesQuery, matchesServiceState } from "@/lib/search";
import { StatusChip } from "@/components/StatusChip";
import { Mascot } from "@/components/Mascot";
import { FollowButton } from "@/components/FollowButton";
import { PromotedSlot } from "@/components/PromotedSlot";
import { GetListedBand } from "@/components/GetListedBand";
const CATEGORIES = ["All categories","Brand","Dispensary","Retailer","Sales rep","Cultivator","Manufacturer","Lab","Transport","Bank","Service","Media","Hydroponics"];
const FEATURED_MARKETS = ["All states", "California", "Michigan", "Maryland", "Colorado", "Pennsylvania"];
const VISUAL_CATEGORIES = [
  { label: "Flower and genetics", query: "genetics", image: "/bridge-editorial/category-flower-genetics.webp" },
  { label: "Pre rolls and vapes", query: "pre rolls", image: "/bridge-editorial/category-prerolls-vapes.webp" },
  { label: "Edibles and wellness", query: "wellness", image: "/bridge-editorial/category-edibles-wellness.webp" },
  { label: "Testing and compliance", query: "testing", image: "/bridge-editorial/category-testing-compliance.webp" },
  { label: "Industry services", query: "service", image: "/bridge-editorial/category-industry-services.webp" },
];
const FAVORITES_STORAGE_KEY = "bridge-phase2-favorites";
const DEFAULT_FAVORITES = ["harbor-dispensary"];
function stateFromLocation(location: string) {
  const parts = location.split(",").map((p) => p.trim());
  return parts[1] || "";
}
export function ExploreClient() { return isPhase3LiveApi() ? <LiveDirectory /> : <><p className="boundary-note">Preview mode · fictional sample profiles</p><SampleExploreClient /></>; }
function SampleExploreClient() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("All states");
  const [category, setCategory] = useState("All categories");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [includeServiceArea, setIncludeServiceArea] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(DEFAULT_FAVORITES);
  const [favoritesReady, setFavoritesReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "null");
        if (Array.isArray(saved) && saved.every((value) => typeof value === "string")) {
          setFavorites(saved);
        }
      } catch {
        // Keep the safe illustrative default when storage is unavailable or invalid.
      } finally {
        setFavoritesReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!favoritesReady) return;
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Session state remains usable when persistent storage is unavailable.
    }
  }, [favorites, favoritesReady]);
  const results = useMemo(() => {
    return profiles.filter((p) => {
      if (favoritesOnly && !favorites.includes(p.slug)) return false;
      if (verifiedOnly && !p.verified) return false;
      if (category !== "All categories" && p.role !== category) return false;
      const st = stateFromLocation(p.location);
      if (includeServiceArea ? !matchesServiceState(p, state) : state !== "All states" && st !== state) return false;
      return matchesQuery(p, query);
    });
  }, [query, state, category, favoritesOnly, favorites, verifiedOnly, includeServiceArea]);
  const sampleStates = useMemo(() => {
    const set = new Set(profiles.map((p) => stateFromLocation(p.location)).filter(Boolean));
    return Array.from(set).sort();
  }, []);
  function toggleFavorite(slug: string) {
    setFavorites((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }
  const noSampleForState = state !== "All states" && !profiles.some((p) => includeServiceArea ? matchesServiceState(p, state) : stateFromLocation(p.location) === state);
  return (
    <div>
      <section className="explore-visual-filters" aria-labelledby="browse-category-title">
        <div className="section-heading compact-heading">
          <div><p className="eyebrow">Browse visually</p><h2 id="browse-category-title">Start with what you are looking for</h2></div>
          <button className="text-link" onClick={() => { setQuery(""); setCategory("All categories"); }} type="button">Clear category search</button>
        </div>
        {/* The rail itself scrolls sideways on phones, so the mascot is
            anchored to this wrapper instead - inside the scroller she ends up
            parked off-screen at the end of the scroll. */}
        <div className="explore-rail-wrap">
        <Mascot className="bridge-mascot-explore" interactive />
        <div className="explore-category-rail">
          {VISUAL_CATEGORIES.map((item) => (
            <button aria-pressed={query === item.query} className="explore-category-tile grain-image" key={item.label} onClick={() => { setQuery(item.query); setCategory("All categories"); }} type="button">
              <Image alt="" fill sizes="220px" src={item.image} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        </div>
      </section>

      <GetListedBand />

      <section className="market-switcher" aria-labelledby="market-switcher-title">
        <div><p className="eyebrow">Nationwide market view</p><h2 id="market-switcher-title">Stay in signal with how other states are moving. Browse the movement.</h2><p>Use the complete state selector or jump into a featured prototype market. California and Michigan show how cross-state learning can work without claiming live market coverage.</p></div>
        <div className="market-pills" role="group" aria-label="Featured markets">
          {FEATURED_MARKETS.map((market) => <button aria-pressed={state === market} className={state === market ? "button primary" : "button secondary"} key={market} onClick={() => setState(market)} type="button">{market}</button>)}
        </div>
        <div className="market-connection" aria-label="Illustrative California to Michigan market connection">
          <div><strong>California</strong><span>Genetics · cultivation · emerging formats</span></div>
          <span aria-hidden="true">→</span>
          <div><strong>Michigan</strong><span>Retail planning · testing · distribution</span></div>
        </div>
      </section>

      <div className="directory-layout">
      <aside className="filter-panel">
        <label htmlFor="explore-q">Search</label>
        <input id="explore-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Brand, strain, service…" />
        <label htmlFor="explore-state">State</label>
        <select id="explore-state" value={state} onChange={(e) => setState(e.target.value)}>{US_STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <label className="check-row"><input type="checkbox" checked={includeServiceArea} onChange={(e) => setIncludeServiceArea(e.target.checked)} /><span>Include members serving this state</span></label>
        <p className="form-hint">Uses the listed location, named service states, and nationwide coverage. Broad regions such as “the West” do not imply a specific state.</p>
        <label htmlFor="explore-cat">Category</label>
        <select id="explore-cat" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <label className="check-row"><input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} /><span>Favorites only</span></label>
        <label className="check-row"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /><span>Verified only (sample status)</span></label>
        <p className="form-hint">Geographic filter: 50 states + D.C. Sample records currently illustrate: {sampleStates.join(", ")}.</p>
      </aside>
      <div>
        <div className="result-bar"><p className="result-count" aria-live="polite"><strong>{results.length}</strong> result{results.length === 1 ? "" : "s"}</p></div>
        {noSampleForState && (
          <div className="empty-state">
            <h3>No sample records for {state}</h3>
            <p>The selector includes nationwide coverage. This prototype only ships illustrative records for a limited set of states ({sampleStates.join(", ")}). Empty here means no sample data — not a claim that the market is empty.</p>
          </div>
        )}
        {!noSampleForState && results.length === 0 && (
          <div className="empty-state"><h3>No matches</h3><p>Try a simpler term, clear the category, include service areas, or switch off the favorites and verified filters.</p></div>
        )}
        <div className="card-grid two">
          {results.map((profile, index) => {
            const fav = favorites.includes(profile.slug);
            return (
              <article key={profile.slug} className="profile-card">
                {profile.imageSrc && <div className="grain-image profile-card-image"><Image alt={profile.imageAlt ?? ""} fill sizes="(max-width: 720px) 100vw, 50vw" src={profile.imageSrc} /></div>}
                <div className="card-topline"><span className="avatar">{profile.initials}</span><StatusChip verified={profile.verified} />{index === 0 ? <PromotedSlot /> : null}</div>
                <h3>{profile.name}</h3>
                <p className="muted">{profile.role} · {profile.location}</p>
                <p>{profile.description}</p>
                <div className="tag-row">{profile.specialties.map((s) => <span className="tag" key={s}>{s}</span>)}</div>
                <div className="button-row" style={{ marginTop: "auto", paddingTop: "1rem" }}>
                  <Link className="button secondary" href={`/profile/${profile.slug}`}>View profile</Link>
                  <FollowButton orgId={profile.slug} orgName={profile.name} />
                  <button type="button" className={fav ? "button primary" : "button secondary"} aria-pressed={fav} aria-label={`${fav ? "Remove" : "Add"} ${profile.name} ${fav ? "from" : "to"} favorites`} onClick={() => toggleFavorite(profile.slug)}>{fav ? "Favorited" : "Favorite"}</button>
                  <Link className="button secondary" href={`/profile/${profile.slug}#contact-request`}>Request introduction</Link>
                </div>
              </article>
            );
          })}
        </div>
        <p className="form-hint">Introduction links open a preview form. Nothing is sent or stored in this prototype.</p>
      </div>
      </div>
    </div>
  );
}
