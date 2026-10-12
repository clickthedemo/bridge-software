"use client";

import { followOrg, isFollowing, unfollowOrg, useSocial } from "@/lib/social";
import "./follow-button.css";

type FollowButtonProps = {
  orgId: string;
  /** Named in the label, so a directory is not a column of bare "Follow"s. */
  orgName: string;
  className?: string;
};

export function FollowButton({ orgId, orgName, className }: FollowButtonProps) {
  /* The subscribed snapshot keeps the profile header and the card in the feed
     in step, and matches the server's empty state during hydration. */
  const social = useSocial();
  const followed = isFollowing(orgId, social);

  return (
    /* No follower count here, by design: how many people follow an org is the
       org's own data. Only the owner sees it, on their dashboard. */
    <button
      aria-label={`${followed ? "Following" : "Follow"} ${orgName}`}
      aria-pressed={followed}
      className={className ? `bridge-follow ${className}` : "bridge-follow"}
      onClick={() => (followed ? unfollowOrg(orgId) : followOrg(orgId))}
      type="button"
    >
      <span aria-hidden="true" className="bridge-follow-glyph">
        {followed ? (
          <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="m4.5 12.6 5 5.1L19.6 6.4" />
          </svg>
        ) : (
          <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </span>
      <span>{followed ? "Following" : "Follow"}</span>
    </button>
  );
}
