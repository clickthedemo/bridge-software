"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./tab-bar.css";

/**
 * Native-style bottom tab bar for phones.
 *
 * This is the layout drawn in the client's own branding kit (2026-07-20 Tori
 * source package): five slots with a raised purple "+" in the middle. It is
 * mobile-only - the desktop header already covers this.
 */
type Tab = { href: string; label: string; icon: string; raised?: boolean };

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/explore", label: "Explore", icon: "search" },
  { href: "/create", label: "Create", icon: "plus", raised: true },
  { href: "/community", label: "News", icon: "bookmark" },
  { href: "/my-profile", label: "Profile", icon: "person" },
];

function Icon({ name }: { name: string }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20h13V9.5" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.2-4.2" />
      </svg>
    );
  }
  if (name === "plus") {
    return (
      <svg {...common} strokeWidth={2.4}>
        <path d="M12 5.5v13M5.5 12h13" />
      </svg>
    );
  }
  if (name === "bookmark") {
    return (
      <svg {...common}>
        <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20c.9-3.6 3.7-5.4 7.2-5.4s6.3 1.8 7.2 5.4" />
    </svg>
  );
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="bridge-tabbar">
      <ul>
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={tab.raised ? "tab raised" : "tab"}
                href={tab.href}
              >
                <span className="tab-glyph">
                  <Icon name={tab.icon} />
                </span>
                <span className="tab-label">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
