"use client";

import { useSyncExternalStore } from "react";
import { directionNames, isUnifiedReviewHost } from "@/lib/direction-lock";
import { useTheme } from "@/lib/theme";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return isUnifiedReviewHost(window.location.hostname);
}

function getServerSnapshot() {
  return false;
}

export function DirectionLockChip() {
  const theme = useTheme();
  const unified = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // The public-facing build carries no provisional labelling. The direction
  // name is still useful while three design directions exist, but only off
  // the unified review host.
  if (unified) return null;
  return (
    <span className="status-chip preview-chip" suppressHydrationWarning>
      {directionNames[theme]}
    </span>
  );
}
