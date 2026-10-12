"use client";

import { useSyncExternalStore } from "react";

/* Follows, reposts and saves share one key: they are read together on every
   render, and one parse is cheaper than three. */
export const SOCIAL_STORAGE_KEY = "bridge-social-v1";
const SOCIAL_EVENT = "bridge-social";

export type SocialState = {
  favorites: readonly string[];
  following: readonly string[];
  reposts: readonly string[];
  /* Folder name -> post ids. Tori asked for "SAVED EVENTS", "SAVED DEALS" or
     "maybe they can custom their own", so the two she named are seeded and the
     shape takes any name the member types. A post can sit in more than one. */
  collections: Readonly<Record<string, readonly string[]>>;
};

/* Seeded, not hard-coded: they are ordinary folders the member can empty or
   ignore, and a folder only persists once something is filed in it. */
export const DEFAULT_COLLECTIONS = ["Saved events", "Saved deals"] as const;

/**
 * The owner's own numbers. Tori's rule: a follower count is back-end data, so
 * this belongs behind the member's own dashboard and must never be rendered
 * beside anyone else's profile.
 */
export type OwnAnalytics = {
  followers: number;
  following: number;
  repostsMade: number;
  repostsOfMyPosts: number;
  saved: number;
};

/* Sample data. A review build has no server, so the two figures that could
   only come from other members are fixed rather than invented per session. */
const SAMPLE_OWN_FOLLOWERS = 214;
const SAMPLE_OWN_REPOSTS = 37;

const EMPTY: SocialState = { favorites: [], following: [], reposts: [], collections: {} };

/* useSyncExternalStore compares snapshots by identity, so the parsed state is
   held here and only replaced on a write. */
let snapshot: SocialState | null = null;

function ids(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/* Anything in localStorage is untrusted input: another tab, an older build or
   a hand-edited value can all land here, so every folder name and every id is
   checked rather than assumed. */
function folders(value: unknown): Record<string, readonly string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, readonly string[]> = {};
  for (const [name, list] of Object.entries(value as Record<string, unknown>)) {
    const clean = name.trim().slice(0, 40);
    if (!clean) continue;
    const members = ids(list);
    if (members.length) out[clean] = members;
  }
  return out;
}

function read(): SocialState {
  if (snapshot) return snapshot;
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SOCIAL_STORAGE_KEY) ?? "{}");
    const stored = (parsed ?? {}) as Partial<Record<keyof SocialState, unknown>>;
    snapshot = {
      favorites: ids(stored.favorites),
      following: ids(stored.following),
      reposts: ids(stored.reposts),
      collections: folders(stored.collections),
    };
  } catch {
    /* Private mode throws on read. An empty store is still a working store. */
    snapshot = EMPTY;
  }
  return snapshot;
}

/* collections is a map, not a list, so it is deliberately not addressable
   here. Widening this to keyof SocialState makes state[key] a union and the
   list operations below stop type-checking. */
type ListKey = "favorites" | "following" | "reposts";

function setMember(key: ListKey, id: string, on: boolean) {
  const state = read();
  if (state[key].includes(id) === on) return;
  snapshot = { ...state, [key]: on ? [...state[key], id] : state[key].filter((item) => item !== id) };
  try {
    window.localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* Private mode throws on write too. The session keeps working in memory. */
  }
  window.dispatchEvent(new Event(SOCIAL_EVENT));
}

/* Every reader takes the snapshot a component is subscribed to. Reading the
   live store instead would return the stored ids during the hydration pass,
   while useSyncExternalStore is still handing out the empty server snapshot -
   the two disagree and React throws the whole subtree away and re-renders. */
export function isFollowing(orgId: string, state: SocialState = read()) {
  return state.following.includes(orgId);
}

export function followOrg(orgId: string) {
  setMember("following", orgId, true);
}

export function unfollowOrg(orgId: string) {
  setMember("following", orgId, false);
}

export function isReposted(postId: string, state: SocialState = read()) {
  return state.reposts.includes(postId);
}

export function repost(postId: string) {
  setMember("reposts", postId, true);
}

export function unrepost(postId: string) {
  setMember("reposts", postId, false);
}

/* ---------------------------------------------------------------- folders */

function writeCollections(next: Record<string, readonly string[]>) {
  const state = read();
  snapshot = { ...state, collections: next };
  try {
    window.localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* Private mode throws on write. The session keeps working in memory. */
  }
  window.dispatchEvent(new Event(SOCIAL_EVENT));
}

/** Every folder that exists, the two seeded names first, then the member's own. */
export function collectionNames(state: SocialState = read()): readonly string[] {
  const own = Object.keys(state.collections).filter(
    (name) => !DEFAULT_COLLECTIONS.includes(name as (typeof DEFAULT_COLLECTIONS)[number]),
  );
  return [...DEFAULT_COLLECTIONS, ...own.sort()];
}

export function inCollection(postId: string, name: string, state: SocialState = read()) {
  return (state.collections[name] ?? []).includes(postId);
}

export function collectionsOf(postId: string, state: SocialState = read()): readonly string[] {
  return Object.keys(state.collections).filter((name) => state.collections[name].includes(postId));
}

export function collectionCount(name: string, state: SocialState = read()) {
  return (state.collections[name] ?? []).length;
}

/**
 * Files a post into a folder, or takes it out. Filing also saves the post,
 * because a post in "Saved events" that is not saved would be a contradiction
 * the member never asked for.
 */
export function setCollection(postId: string, name: string, on: boolean) {
  const clean = name.trim().slice(0, 40);
  if (!clean) return;
  const state = read();
  const current = state.collections[clean] ?? [];
  if (current.includes(postId) === on) return;

  const next = { ...state.collections };
  if (on) {
    next[clean] = [...current, postId];
  } else {
    const rest = current.filter((item) => item !== postId);
    /* An empty folder that the member did not create is not worth persisting. */
    if (rest.length) next[clean] = rest;
    else delete next[clean];
  }
  writeCollections(next);
  if (on && !isFavorite(postId)) favoritePost(postId);
}

/** Unsaving a post takes it out of every folder, so nothing is orphaned. */
export function unfavoriteEverywhere(postId: string) {
  const state = read();
  const next: Record<string, readonly string[]> = {};
  for (const [name, list] of Object.entries(state.collections)) {
    const rest = list.filter((item) => item !== postId);
    if (rest.length) next[name] = rest;
  }
  writeCollections(next);
  unfavoritePost(postId);
}

export function isFavorite(postId: string, state: SocialState = read()) {
  return state.favorites.includes(postId);
}

export function favoritePost(postId: string) {
  setMember("favorites", postId, true);
}

export function unfavoritePost(postId: string) {
  setMember("favorites", postId, false);
}

/* Sample engagement, derived from the id so the number is identical on the
   server, on the client and on every later render. */
function sampleReposts(postId: string) {
  let total = 0;
  for (let index = 0; index < postId.length; index += 1) total = (total * 31 + postId.charCodeAt(index)) % 1000;
  return total % 24;
}

export function repostCount(postId: string, state: SocialState = read()) {
  return sampleReposts(postId) + (isReposted(postId, state) ? 1 : 0);
}

export function getOwnAnalytics(state: SocialState = read()): OwnAnalytics {
  return {
    followers: SAMPLE_OWN_FOLLOWERS,
    following: state.following.length,
    repostsMade: state.reposts.length,
    repostsOfMyPosts: SAMPLE_OWN_REPOSTS,
    saved: state.favorites.length,
  };
}

function subscribe(onStoreChange: () => void) {
  /* Another tab wrote: drop the cache so the next snapshot re-reads storage. */
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== SOCIAL_STORAGE_KEY) return;
    snapshot = null;
    onStoreChange();
  };
  window.addEventListener(SOCIAL_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SOCIAL_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot(): SocialState {
  return EMPTY;
}

/**
 * Subscribes a component to every social change, so two controls for the same
 * org or post can never disagree. Read the values with the functions above.
 */
export function useSocial(): SocialState {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}
