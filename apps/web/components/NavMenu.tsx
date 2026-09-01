"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/community", label: "Community News", match: (p: string) => p.startsWith("/community") },
  { href: "/create", label: "Create", match: (p: string) => p.startsWith("/create") },
  { href: "/my-profile", label: "My Profile", match: (p: string) => p.startsWith("/my-profile") },
  { href: "/explore", label: "Explore", match: (p: string) => p.startsWith("/explore") || p.startsWith("/directory") },
  { href: "/login", label: "Sign in", match: (p: string) => p === "/login" || p.startsWith("/auth/") },
] as const;

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        aria-controls="site-nav"
        aria-expanded={open}
        className="nav-toggle"
        onClick={() => setOpen((value) => !value)}
        ref={toggleRef}
        type="button"
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span> Menu
      </button>
      <nav aria-label="Main navigation" data-open={open || undefined} id="site-nav">
        {links.map((link) => (
          <Link
            aria-current={link.match(pathname) ? "page" : undefined}
            href={link.href}
            key={link.href}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
