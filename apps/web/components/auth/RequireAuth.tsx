"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRef } from "react";
import { useAuth } from "./AuthProvider";
export function RequireAuth({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { status, isAdmin } = useAuth(); const router = useRouter(); const pathname = usePathname();
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
  if (status !== "authenticated" || (admin && !isAdmin)) return null;
  return children;
}
