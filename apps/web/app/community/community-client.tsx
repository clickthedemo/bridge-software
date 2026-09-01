"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { US_STATE_OPTIONS } from "@/lib/states";

type FeedItem = {
  id: string;
  type: "Promotion" | "Product introduction" | "Vendor announcement" | "Industry news" | "Event" | "Education" | "Market signal" | "Service update";
  title: string;
  org: string;
  audience: string;
  body: string;
  state: string;
  category: string;
  image: string;
  imageAlt: string;
  age: string;
};

const items: FeedItem[] = [
  { id: "1", type: "Promotion", title: "Fall wholesale calendar is open", org: "Cascade Canna Co.", audience: "Verified retailers", body: "Regional partners can request menus and education support through August 31.", state: "Oregon", category: "Edibles", image: "/bridge-editorial/community-oregon-edibles.webp", imageAlt: "Small-batch edible products prepared for an Oregon wholesale presentation", age: "2 hours ago" },
  { id: "2", type: "Market signal", title: "Michigan buyers are planning fall shelf resets", org: "Northstar Sales Group", audience: "Industry professionals", body: "Multi-location retailers are asking for dependable restock schedules and staff education.", state: "Michigan", category: "Retail", image: "/bridge-editorial/community-michigan-retail.webp", imageAlt: "Michigan retail buyers planning a cannabis shelf reset", age: "4 hours ago" },
  { id: "3", type: "Industry news", title: "What California operators are testing now", org: "Signal Desk Media", audience: "All Bridge members", body: "A practical look at genetics, production efficiency, and product formats moving between legal markets.", state: "California", category: "Cultivation", image: "/bridge-editorial/community-california-cultivation.webp", imageAlt: "California cultivation team inspecting healthy plants and environmental controls", age: "Today" },
  { id: "4", type: "Event", title: "Community education night with Maryland brands", org: "Harbor Dispensary", audience: "Adults 21+", body: "A public safe education event connecting customers with verified regional operators.", state: "Maryland", category: "Events", image: "/bridge-editorial/community-maryland-education.webp", imageAlt: "Adults attending a professional cannabis education event in Maryland", age: "Tomorrow" },
  { id: "5", type: "Promotion", title: "New lab verified tincture line", org: "Greenline Goods", audience: "Verified retailers", body: "Wholesale samples and education materials are available for approved retail partners.", state: "New Jersey", category: "Wellness", image: "/bridge-editorial/community-new-jersey-wellness.webp", imageAlt: "Wellness tinctures arranged for a New Jersey wholesale review", age: "Yesterday" },
  { id: "6", type: "Service update", title: "Two secure transport routes opened", org: "Purple Route Logistics", audience: "Verified businesses", body: "New Southwest Michigan pickup windows are available for retailers, laboratories, and manufacturers.", state: "Michigan", category: "Transport", image: "/bridge-editorial/community-michigan-logistics.webp", imageAlt: "Licensed Michigan transport coordinator planning secure routes", age: "Yesterday" },
  { id: "7", type: "Market signal", title: "Facility teams are booking fall maintenance", org: "Evergreen Facility Group", audience: "Industry professionals", body: "Cultivators are scheduling HVAC, electrical, and environmental control work before winter.", state: "Ohio", category: "Services", image: "/bridge-editorial/community-ohio-facility.webp", imageAlt: "Ohio facility technician servicing cultivation climate controls", age: "2 days ago" },
  { id: "8", type: "Industry news", title: "Testing teams publish new sample intake windows", org: "Great Lakes Analytics", audience: "Verified businesses", body: "Current intake contacts and scheduling guidance are now available to Michigan operators.", state: "Michigan", category: "Testing", image: "/bridge-editorial/community-michigan-testing.webp", imageAlt: "Michigan analytical laboratory team receiving sealed samples", age: "3 days ago" },
  { id: "9", type: "Product introduction", title: "A multi-store preview puts new formats in buyers' hands", org: "Mosaic Market", audience: "Verified retailers", body: "The Phoenix buying team is reviewing compliant product formats and merchandising support for its next illustrative shelf set.", state: "Arizona", category: "Retail", image: "/bridge-editorial/community-arizona-retail-planning.webp", imageAlt: "Fictional Arizona dispensary buyers comparing packaged products and merchandising notes", age: "Today" },
  { id: "10", type: "Vendor announcement", title: "Midwest retailer office hours are open", org: "Northstar Sales Group", audience: "Industry professionals", body: "Emerging brands can bring route questions, education plans, and sample market priorities to a fictional Chicago planning session.", state: "Illinois", category: "Services", image: "/bridge-editorial/community-illinois-route-planning.webp", imageAlt: "Fictional Illinois sales representative mapping Midwest retailer routes", age: "Today" },
  { id: "11", type: "Event", title: "Local cultivators meet independent Boston buyers", org: "Union Street Collective", audience: "Verified businesses", body: "A small sample-network session gives Massachusetts operators room to compare supply needs and community event ideas.", state: "Massachusetts", category: "Events", image: "/bridge-editorial/community-massachusetts-meetup.webp", imageAlt: "Fictional Massachusetts dispensary team speaking with local cultivation partners", age: "This week" },
  { id: "12", type: "Education", title: "Fall patient education calendar is ready for review", org: "Presque Isle Wellness", audience: "Adults 21+", body: "The illustrative Erie program organizes product-literacy sessions without making medical or treatment claims.", state: "Pennsylvania", category: "Wellness", image: "/bridge-editorial/community-pennsylvania-education.webp", imageAlt: "Fictional Pennsylvania dispensary educator preparing product-literacy materials", age: "This week" },
  { id: "13", type: "Promotion", title: "Mountain West craft-brand office hours", org: "Front Range Reps", audience: "Verified businesses", body: "Sample-network founders can review territory readiness, retailer education, and route planning with a fictional Colorado representative.", state: "Colorado", category: "Services", image: "/bridge-editorial/community-colorado-office-hours.webp", imageAlt: "Fictional Colorado territory representative meeting a craft cannabis founder", age: "Tomorrow" },
  { id: "14", type: "Event", title: "Expansion-readiness clinic for verified operators", org: "Canopy Capital Services", audience: "Verified businesses", body: "A private prototype session walks through questions operators may want to prepare for qualified banking and treasury partners.", state: "Colorado", category: "Events", image: "/bridge-editorial/community-colorado-finance-clinic.webp", imageAlt: "Fictional cannabis-aware finance advisor leading an operator readiness clinic", age: "Next week" },
  { id: "15", type: "Product introduction", title: "Packaging review brings production details forward", org: "Steel City Botanicals", audience: "Verified retailers", body: "The fictional Pittsburgh team is previewing compliant packaging, testing documentation, and restock expectations for sample partners.", state: "Pennsylvania", category: "Testing", image: "/bridge-editorial/community-pennsylvania-packaging.webp", imageAlt: "Fictional Pennsylvania manufacturing specialist reviewing compliant packaging details", age: "Yesterday" },
  { id: "16", type: "Vendor announcement", title: "Fourth-quarter production planning is open", org: "Lake Effect Manufacturing", audience: "Verified businesses", body: "Illustrative Michigan partners can compare lead times, packaging needs, and manufacturing capacity before requesting an introduction.", state: "Michigan", category: "Services", image: "/bridge-editorial/community-michigan-production.webp", imageAlt: "Fictional Michigan manufacturing team reviewing production windows", age: "Yesterday" },
  { id: "17", type: "Industry news", title: "Operator interview series starts in New York", org: "Signal Desk Media", audience: "All Bridge members", body: "The sample editorial desk is recording practical conversations about operations, partnerships, and lessons moving between markets.", state: "New York", category: "Services", image: "/bridge-editorial/community-new-york-interview.webp", imageAlt: "Fictional New York cannabis journalist recording an operator interview", age: "2 days ago" },
  { id: "18", type: "Education", title: "Cultivar field notes focus on dependable production", org: "Golden State Genetics", audience: "Industry professionals", body: "A fictional California grower shares practical observations about plant structure and consistency without presenting cultivation advice as a live service.", state: "California", category: "Cultivation", image: "/bridge-editorial/community-california-field-notes.webp", imageAlt: "Fictional California genetics specialist examining a plant and recording field notes", age: "2 days ago" },
  { id: "19", type: "Event", title: "Water-efficiency workshop moves onto the facility floor", org: "Root Zone Hydro", audience: "Verified businesses", body: "The illustrative workshop shows how cultivation teams could exchange facility-system knowledge through Bridge introductions.", state: "California", category: "Cultivation", image: "/bridge-editorial/community-california-water-workshop.webp", imageAlt: "Fictional California cultivation team reviewing irrigation controls with a technician", age: "3 days ago" },
  { id: "20", type: "Product introduction", title: "Retailer sample kit pairs product with education", org: "Cascade Canna Co.", audience: "Verified retailers", body: "A fictional Oregon release packages compliant samples, merchandising notes, and staff-education materials into one review-ready kit.", state: "Oregon", category: "Edibles", image: "/bridge-editorial/community-oregon-sample-kit.webp", imageAlt: "Fictional Oregon edible producer assembling a retailer sample kit", age: "3 days ago" },
];

const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))];
const categoryImageByName: Record<string, string> = {
  All: "/bridge-network-night.webp",
  Edibles: "/bridge-editorial/community-category-edibles.webp",
  Retail: "/bridge-editorial/community-category-retail.webp",
  Cultivation: "/bridge-editorial/community-category-cultivation.webp",
  Events: "/bridge-editorial/community-category-events.webp",
  Wellness: "/bridge-editorial/community-category-wellness.webp",
  Transport: "/bridge-editorial/community-category-transport.webp",
  Services: "/bridge-editorial/community-category-services.webp",
  Testing: "/bridge-editorial/community-category-testing.webp",
};
const FAVORITE_KEY = "bridge-community-favorites";

export function CommunityClient() {
  const [layout, setLayout] = useState<"grid" | "classic">("grid");
  const [category, setCategory] = useState("All");
  const [state, setState] = useState("All states");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const sampleStates = useMemo(
    () => Array.from(new Set(items.map((item) => item.state))).sort(),
    [],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(FAVORITE_KEY) ?? "[]");
        if (Array.isArray(stored)) setFavorites(stored.filter((value): value is string => typeof value === "string"));
      } catch {
        setFavorites([]);
      } finally {
        setReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(FAVORITE_KEY, JSON.stringify(favorites));
  }, [favorites, ready]);

  const visibleItems = useMemo(
    () => items.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (state !== "All states" && item.state !== state) return false;
      if (favoritesOnly && !favorites.includes(item.id)) return false;
      return true;
    }),
    [category, favorites, favoritesOnly, state],
  );
  const noSampleForState = state !== "All states" && !sampleStates.includes(state) && visibleItems.length === 0;

  function toggleFavorite(id: string) {
    setFavorites((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  return (
    <div>
      <div className="visual-category-rail" aria-label="Filter Community News by cannabis category">
        {categories.map((item) => (
          <button aria-pressed={category === item} className="visual-category" key={item} onClick={() => setCategory(item)} type="button">
            <span className="category-thumb grain-image" aria-hidden="true" style={{ backgroundImage: `linear-gradient(rgba(9,6,13,.08),rgba(9,6,13,.5)), url(${categoryImageByName[item]})` }} />
            <strong>{item}</strong>
          </button>
        ))}
      </div>

      <div className="feed-toolbar" aria-label="Community News controls">
        <div className="layout-toggle" role="group" aria-label="Feed layout">
          <button type="button" className={layout === "grid" ? "button primary" : "button secondary"} aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}>Visual news</button>
          <button type="button" className={layout === "classic" ? "button primary" : "button secondary"} aria-pressed={layout === "classic"} onClick={() => setLayout("classic")}>Classic feed</button>
        </div>
        <label className="compact-control" htmlFor="community-state">
          Market
          <select id="community-state" value={state} onChange={(event) => setState(event.target.value)}>
            {US_STATE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="check-row favorites-control"><input checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} type="checkbox" /><span>Favorites only</span></label>
      </div>

      <p className="feed-sample-summary" aria-live="polite"><strong>{visibleItems.length}</strong> illustrative {visibleItems.length === 1 ? "story" : "stories"} shown · {sampleStates.length} sample markets · 52 nationwide filter options</p>

      {noSampleForState ? (
        <div className="empty-state"><h3>No sample posts for {state}</h3><p>The Community filter covers all 50 states plus D.C. This review build only includes illustrative posts for {sampleStates.join(", ")}. Empty here means no sample content, not an empty market.</p></div>
      ) : visibleItems.length === 0 ? (
        <div className="empty-state"><h3>No saved signals here yet</h3><p>Change the market or category, or save posts you want to keep close.</p></div>
      ) : (
        <div className={layout === "grid" ? "news-grid editorial-feed" : "news-classic editorial-feed"} data-layout={layout}>
          {visibleItems.map((item) => {
            const favorite = favorites.includes(item.id);
            return (
              <article key={item.id} className="content-card news-card media-card">
                <div className="grain-image news-image">
                  <Image alt={item.imageAlt} fill sizes={layout === "grid" ? "(max-width: 720px) 100vw, 50vw" : "220px"} src={item.image} />
                </div>
                <div className="news-card-copy">
                  <div className="card-topline"><span className="status-chip">{item.type}</span><span className="tag">{item.audience}</span></div>
                  <p className="eyebrow">{item.state} · {item.category}</p>
                  <h3>{item.title}</h3>
                  <p className="muted">{item.org} · {item.age}</p>
                  <p className="news-card-summary">{item.body}</p>
                  <div className="news-actions">
                    <button aria-pressed={favorite} className={favorite ? "text-link is-favorite" : "text-link"} onClick={() => toggleFavorite(item.id)} type="button">{favorite ? "Saved to favorites" : "Save to favorites"}</button>
                    <Link className="text-link" href="/explore">Explore related members</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="form-hint">Nationwide filter: 50 states + D.C. Sample posts currently illustrate {sampleStates.join(", ")}. No paid feed placement and no live market claims.</p>
    </div>
  );
}
