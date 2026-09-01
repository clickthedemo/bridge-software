"use client";

import { useSyncExternalStore } from "react";
import { CONNECTED_REVIEW_LABEL, directionNames, isUnifiedReviewHost } from "@/lib/direction-lock";
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
  const label = unified ? CONNECTED_REVIEW_LABEL : "Provisional preview · " + directionNames[theme];
  return (
    <span className="status-chip preview-chip" suppressHydrationWarning>
      {label}
    </span>
  );
}
