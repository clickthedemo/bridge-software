// Shared (server + client) direction constants and the optional build-time lock.
// Staging builds set NEXT_PUBLIC_DIRECTION_LOCK to pin the whole app to one
// provisional direction; normal builds leave it unset and stay switchable.
//
// Visual only. This does not add, remove, or replace Phase 1/2 product:
// Home, Community News, Create, My Profile, Explore; legacy /studio,
// /business, /signal redirects; Phase 1 directory, join, profile, dashboard,
// admin, contact, and search adapters stay in place.
//
// The unified review URL is Connected / Modern Network (ink + electric violet).
// Trusted Current navy/teal stays on its own preview link.

export const themeIds = ["current", "network", "botanical"] as const;
export type ThemeId = (typeof themeIds)[number];

export const DEFAULT_THEME: ThemeId = "network";

export const UNIFIED_REVIEW_HOST = "bridge-connected-signal.netlify.app";

export const CONNECTED_REVIEW_LABEL = "Connected · Modern Network";

export const directionNames: Record<ThemeId, string> = {
  current: "Trusted Current",
  network: "Modern Network",
  botanical: "Botanical Ledger",
};

const candidate = process.env.NEXT_PUBLIC_DIRECTION_LOCK;

export const lockedTheme: ThemeId | null = (themeIds as readonly string[]).includes(candidate ?? "")
  ? (candidate as ThemeId)
  : null;

export function isUnifiedReviewHost(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  return host === UNIFIED_REVIEW_HOST || host.endsWith(`.${UNIFIED_REVIEW_HOST}`);
}

export function visualTheme(hostname: string | null | undefined): ThemeId {
  if (isUnifiedReviewHost(hostname)) return "network";
  return lockedTheme ?? DEFAULT_THEME;
}
