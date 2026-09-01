"use client";

import { useMemo, useState } from "react";
import { ProfileCard } from "@/components/ProfileCard";
import { profiles } from "@/lib/data";
import { matchesQuery } from "@/lib/search";

export function DirectoryClient() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const matches = useMemo(
    () =>
      profiles.filter((profile) => {
        const matchesRole = role === "All roles" || profile.role === role;
        return matchesQuery(profile, query) && matchesRole && (!verifiedOnly || profile.verified);
      }),
    [query, role, verifiedOnly],
  );

  // When nothing matches, surface members that match the search text but sit
  // outside the role/verified filters — relax verified-only first, then role.
  const nearMisses = useMemo(() => {
    if (matches.length) return [];
    const textMatches = profiles.filter((profile) => matchesQuery(profile, query));
    const sameRole = textMatches.filter((profile) => role === "All roles" || profile.role === role);
    return (sameRole.length ? sameRole : textMatches).slice(0, 3);
  }, [matches, query, role]);

  const activeConstraints = [
    query.trim() && `“${query.trim()}”`,
    role !== "All roles" && role,
    verifiedOnly && "Verified only",
  ].filter(Boolean);

  function clearAll() {
    setQuery("");
    setRole("All roles");
    setVerifiedOnly(false);
  }

  return (
    <div className="directory-layout">
      <aside className="filter-panel" aria-label="Directory filters">
        <label htmlFor="directory-search">Search</label>
        <input id="directory-search" onChange={(event) => setQuery(event.target.value)} placeholder="Name, city, state, specialty…" type="search" value={query} />
        <label htmlFor="role-filter">Member type</label>
        <select id="role-filter" onChange={(event) => setRole(event.target.value)} value={role}>
          <option>All roles</option>
          <option>Brand</option>
          <option>Dispensary</option>
          <option>Retailer</option>
          <option>Sales rep</option>
        </select>
        <label className="check-row"><input checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} type="checkbox" /> Verified only</label>
        <button className="text-button" onClick={clearAll} type="button">Clear filters</button>
      </aside>
      <div>
        <div className="result-bar"><p className="result-count" role="status"><strong>{matches.length === 1 ? "1 member" : `${matches.length} members`}</strong></p><span className="muted">Fictional sample profiles</span></div>
        {matches.length ? (
          <div className="card-grid two">{matches.map((profile) => <ProfileCard key={profile.slug} profile={profile} />)}</div>
        ) : (
          <>
            <div className="empty-state">
              <h2>No members match</h2>
              {activeConstraints.length > 0 && <p>{activeConstraints.join(" · ")}</p>}
              <div className="button-row centered">
                {query.trim() && <button className="button secondary" onClick={() => setQuery("")} type="button">Clear search</button>}
                <button className="button secondary" onClick={clearAll} type="button">Clear all filters</button>
              </div>
              <p className="form-hint">
                This prototype searches {profiles.length} fictional sample profiles. Live whole-network search
                arrives with the backend contract.
              </p>
            </div>
            {nearMisses.length > 0 && (
              <section aria-label="Members outside your current filters">
                <div className="result-bar near-miss-bar"><strong>Outside your current filters</strong></div>
                <div className="card-grid two">{nearMisses.map((profile) => <ProfileCard key={profile.slug} profile={profile} />)}</div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
