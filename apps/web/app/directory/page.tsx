import { DirectoryClient } from "./directory-client";

export default function DirectoryPage() {
  return (
    <section className="page shell">
      <div className="page-heading">
        <p className="eyebrow">Member discovery</p>
        <h1>Find your next partner.</h1>
        <p className="lede">Search the provisional directory by organization, role, market, or specialty.</p>
      </div>
      <DirectoryClient />
    </section>
  );
}
