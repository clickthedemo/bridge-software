"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

type HomeAccountLinkProps = {
  className: string;
  signedOutLabel: string;
  authenticatedLabel: string;
  showArrow?: boolean;
};

export function HomeAccountLink({
  className,
  signedOutLabel,
  authenticatedLabel,
  showArrow = false,
}: HomeAccountLinkProps) {
  const { status } = useAuth();
  const authenticated = status === "authenticated";
  const label = authenticated ? authenticatedLabel : signedOutLabel;

  return (
    <Link className={className} href={authenticated ? "/my-profile" : "/join"}>
      {label}{showArrow && <> <span aria-hidden="true">→</span></>}
    </Link>
  );
}
