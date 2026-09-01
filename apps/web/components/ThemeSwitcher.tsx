"use client";

import { applyTheme, useTheme, type ThemeId } from "@/lib/theme";

const directions: { id: ThemeId; label: string }[] = [
  { id: "current", label: "Current" },
  { id: "network", label: "Network" },
  { id: "botanical", label: "Botanical" },
];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();

  return (
    <div className={compact ? "theme-switcher compact" : "theme-switcher"} aria-label="Preview visual direction">
      {!compact && <span className="theme-label">Visual direction</span>}
      {directions.map((direction) => (
        <button
          aria-pressed={theme === direction.id}
          className={theme === direction.id ? "active" : ""}
          key={direction.id}
          onClick={() => applyTheme(direction.id)}
          type="button"
        >
          {direction.label}
        </button>
      ))}
    </div>
  );
}
