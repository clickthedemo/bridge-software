import type { Profile } from "./types";

// Client-side search over the fictional sample profiles. This is also the
// proposed matching contract for the future server-side directory search
// (Miraj to confirm semantics at the backend gate): tokens are ANDed; a token
// matches as a word prefix (not mid-word, so "erie" never matches
// "experiences"); a US state abbreviation also matches the spelled-out state
// name; tokens shorter than three characters must match a whole word.

const STATE_NAMES: Record<string, string> = {
  al: "alabama", ak: "alaska", az: "arizona", ar: "arkansas", ca: "california",
  co: "colorado", ct: "connecticut", de: "delaware", fl: "florida", ga: "georgia",
  hi: "hawaii", id: "idaho", il: "illinois", in: "indiana", ia: "iowa",
  ks: "kansas", ky: "kentucky", la: "louisiana", me: "maine", md: "maryland",
  ma: "massachusetts", mi: "michigan", mn: "minnesota", ms: "mississippi", mo: "missouri",
  mt: "montana", ne: "nebraska", nv: "nevada", nh: "new hampshire", nj: "new jersey",
  nm: "new mexico", ny: "new york", nc: "north carolina", nd: "north dakota", oh: "ohio",
  ok: "oklahoma", or: "oregon", pa: "pennsylvania", ri: "rhode island", sc: "south carolina",
  sd: "south dakota", tn: "tennessee", tx: "texas", ut: "utah", vt: "vermont",
  va: "virginia", wa: "washington", wv: "west virginia", wi: "wisconsin", wy: "wyoming",
  dc: "district of columbia",
};

function searchableText(profile: Profile): string {
  return [
    profile.name,
    profile.location,
    profile.role,
    profile.serving,
    profile.description,
    ...profile.specialties,
  ]
    .join(" ")
    .toLowerCase();
}

export function tokenize(query: string): string[] {
  return query.toLowerCase().split(/[\s,]+/).filter(Boolean);
}

export function matchesQuery(profile: Profile, query: string): boolean {
  const haystack = searchableText(profile);
  const words = haystack.split(/[^a-z0-9]+/).filter(Boolean);
  return tokenize(query).every((token) => {
    const stateName = STATE_NAMES[token];
    if (stateName) return haystack.includes(stateName) || words.includes(token);
    if (token.length >= 3) return words.some((word) => word.startsWith(token));
    return words.includes(token);
  });
}
