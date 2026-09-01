"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, isUnifiedReviewHost, lockedTheme, themeIds, type ThemeId } from "./direction-lock";

export { themeIds, type ThemeId } from "./direction-lock";

export const THEME_STORAGE_KEY = "bridge-theme";
const THEME_EVENT = "bridge-theme";

export function applyTheme(id: ThemeId) {
  if (typeof window !== "undefined" && isUnifiedReviewHost(window.location.hostname)) {
    document.documentElement.setAttribute("data-theme", "network");
    window.dispatchEvent(new CustomEvent<ThemeId>(THEME_EVENT, { detail: "network" }));
    return;
  }
  if (lockedTheme) return;
  document.documentElement.setAttribute("data-theme", id);
  window.localStorage.setItem(THEME_STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent<ThemeId>(THEME_EVENT, { detail: id }));
}

function isThemeId(value: string | null): value is ThemeId {
  return value !== null && (themeIds as readonly string[]).includes(value);
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_EVENT, onStoreChange);
}

function getSnapshot(): ThemeId {
  if (isUnifiedReviewHost(window.location.hostname)) return "network";
  const active = document.documentElement.getAttribute("data-theme");
  if (isThemeId(active)) return active;
  return lockedTheme ?? DEFAULT_THEME;
}

function getServerSnapshot(): ThemeId {
  return lockedTheme ?? DEFAULT_THEME;
}

export function useTheme(): ThemeId {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
