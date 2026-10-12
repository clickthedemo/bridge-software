import Image from "next/image";

/*
 * Tori annotated all four "Four spaces. One connected Bridge." cards in her
 * 2026-09-16 screenshot set (Screenshot 2026-09-14 at 7.16.16 PM) and asked for
 * a visual in each one. Her words, per card:
 *
 *   Community News  "LET'S DO A 4 SQUARE VISUAL LIKE INSTAGRAM FEEL. LET'S USE
 *                    PHOTOS IN THIS AREA SO FOR SEE WHAT THE INDUSTRY IS DOING
 *                    RIGHT NOW: A SCREENSHOT AI AD OF WHAT THE NEWSFEED WOULD
 *                    LOOK LIKE."
 *   Create          "GET YOUR NEW PRODUCT LAUNCH TO THE RIGHT PEOPLE. LET'S HAVE
 *                    A SCREENSHOT OF THE POST OPTIONS OR WHAT IT LOOKS LIKE TO
 *                    GET REPOSTS ETC."
 *   My Profile      "MY PROFILE: LET'S MAKE THIS A VIEW OF A BUSINESS PROFILE
 *                    THE ABOUT ME ETC."
 *   Explore         (her note here is the member-to-member messaging question,
 *                    which is a scope conversation, not a visual. The card still
 *                    gets a preview so the row reads as one set.)
 *
 * Same approach as PostPeek: these are the real things, not pictures of them.
 * The labels come from lib/phase3/post-modes.ts and lib/data.ts, the tiles from
 * app/explore/explore-client.tsx, and the photography from the editorial set
 * already in public/bridge-editorial. No asset was generated for this: every
 * image below was already in the repository and is already used elsewhere on
 * the site, so nothing here can drift away from what the product actually is.
 *
 * Presentational only. Nothing is focusable and nothing is announced, because
 * the card's own heading, copy and link already carry the meaning; the preview
 * is decoration on top of them.
 */

const NEWS_TILES = [
  { src: "/bridge-editorial/community-oregon-edibles.webp", alt: "" },
  { src: "/bridge-editorial/community-michigan-retail.webp", alt: "" },
  { src: "/bridge-editorial/community-california-cultivation.webp", alt: "" },
  { src: "/bridge-editorial/community-massachusetts-meetup.webp", alt: "" },
];

// lib/phase3/post-modes.ts, in the order the Create page presents them.
const POST_MODES = ["Update", "Deal", "Drop", "Service listing", "Hiring"];

// app/explore/explore-client.tsx category rail.
const EXPLORE_TILES = [
  { src: "/bridge-editorial/category-flower-genetics.webp", label: "Flower and genetics" },
  { src: "/bridge-editorial/category-prerolls-vapes.webp", label: "Pre rolls and vapes" },
  { src: "/bridge-editorial/category-edibles-wellness.webp", label: "Edibles and wellness" },
];

export type SuitePeekKind = "news" | "create" | "profile" | "explore";

export function SuitePeek({ kind }: { kind: SuitePeekKind }) {
  if (kind === "news") {
    return (
      <div className="suite-peek suite-peek-news" aria-hidden="true">
        {NEWS_TILES.map((tile) => (
          <span className="suite-peek-tile" key={tile.src}>
            <Image alt={tile.alt} fill sizes="120px" src={tile.src} />
          </span>
        ))}
      </div>
    );
  }

  if (kind === "create") {
    return (
      <div className="suite-peek suite-peek-create" aria-hidden="true">
        <span className="suite-peek-label">What are you posting?</span>
        <span className="suite-peek-modes">
          {POST_MODES.map((mode, index) => (
            <span
              className={index === 0 ? "suite-peek-mode is-on" : "suite-peek-mode"}
              key={mode}
            >
              {mode}
            </span>
          ))}
        </span>
        <span className="suite-peek-reposts">Reposted 3 times across 2 markets</span>
      </div>
    );
  }

  if (kind === "profile") {
    return (
      <div className="suite-peek suite-peek-profile" aria-hidden="true">
        <span className="suite-peek-avatar">HD</span>
        <span className="suite-peek-profile-copy">
          <span className="suite-peek-name">
            Harbor Dispensary <span className="suite-peek-verified">Verified</span>
          </span>
          <span className="suite-peek-meta">Dispensary · Baltimore, Maryland</span>
          <span className="suite-peek-about">
            Harbor pairs a curated shelf with patient education, and looks for
            brands that can support in-store training.
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="suite-peek suite-peek-explore" aria-hidden="true">
      {EXPLORE_TILES.map((tile) => (
        <span className="suite-peek-explore-tile" key={tile.src}>
          <Image alt="" fill sizes="150px" src={tile.src} />
          <span className="suite-peek-explore-label">{tile.label}</span>
        </span>
      ))}
    </div>
  );
}
