"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRef } from "react";
import { useAuth } from "./AuthProvider";
export function RequireAuth({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { status, isAdmin, refresh } = useAuth(); const router = useRouter(); const pathname = usePathname();
  const redirectStarted = useRef(false);
  useEffect(() => {
    if (redirectStarted.current) return;
    if (status === "unauthenticated") {
      redirectStarted.current = true;
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && admin && !isAdmin) {
      redirectStarted.current = true;
      router.replace("/unauthorized");
    }
  }, [status, isAdmin, admin, pathname, router]);
  if (status === "loading") return <div className="page shell"><p>Checking access…</p></div>;
  if (status === "unavailable") return <div className="page shell"><p role="alert">Your session could not be checked. Please try again.</p><button className="button primary" onClick={() => void refresh()} type="button">Try again</button></div>;
  if (status !== "authenticated" || (admin && !isAdmin)) return null;
  return children;
}
