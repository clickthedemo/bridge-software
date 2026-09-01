import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page shell">
      <div className="empty-state">
        <p className="eyebrow">Page not found</p>
        <h1>We could not find that page.</h1>
        <p>The member or page you are looking for may have moved, or the link may be out of date.</p>
        <div className="button-row centered">
          <Link className="button primary" href="/directory">Browse the directory</Link>
          <Link className="button secondary" href="/">Go to the home page</Link>
        </div>
      </div>
    </section>
  );
}
