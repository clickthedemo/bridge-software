import Image from "next/image";

/*
 * Tori struck out the Founding pricing block on the homepage and wrote in its
 * place: "PHOTOS OR A SCREENSHOT OF THE PLATFORM LIKE A SNEAK PEAK OF WHAT A
 * POST LOOKS LIKE".
 *
 * This is the post itself rather than a screenshot of one. It reuses the exact
 * classes the Community News feed renders with (content-card / news-card /
 * grain-image / news-card-copy), so when the feed card changes this preview
 * changes with it. A PNG would be stale the first time anyone touched the feed.
 *
 * It is presentational only: no PostActions, nothing clickable, aria-hidden on
 * the fake counts so a screen reader is not told this is a real post.
 */
export function PostPeek() {
  return (
    <div className="post-peek-frame">
      <article className="content-card news-card media-card post-peek-card">
        <div className="grain-image news-image">
          <Image
            alt="A dispensary team photographing a new edibles line for a wholesale post"
            fill
            sizes="(max-width: 900px) 100vw, 40vw"
            src="/bridge-editorial/community-oregon-edibles.webp"
          />
        </div>
        <div className="news-card-copy">
          <div className="card-topline">
            <span className="status-chip">Promotion</span>
            <span className="tag">Verified retailers</span>
          </div>
          <p className="eyebrow">Oregon · Edibles</p>
          <h3>Fall wholesale calendar is open now</h3>
          <p className="muted">Cascade Canna Co. · 2 hours ago</p>
          <p className="news-card-summary">
            Menus and training are ready. Reach out before Aug 31.
          </p>
          <div className="news-actions post-peek-actions" aria-hidden="true">
            <span className="post-peek-action">Repost 1</span>
            <span className="post-peek-action">Save</span>
          </div>
        </div>
      </article>
      <p className="post-peek-caption">
        Every post carries who it is from, the market it applies to, and who is
        allowed to see it.
      </p>
    </div>
  );
}
