"use client";

import {
  favoritePost,
  isFavorite,
  isReposted,
  repost,
  repostCount,
  unfavoriteEverywhere,
  unrepost,
  useSocial,
} from "@/lib/social";
import { SaveToFolder } from "./SaveToFolder";
import "./post-actions.css";

type PostActionsProps = {
  postId: string;
  /** Goes into each label, so a feed is not twenty identical "Repost" buttons. */
  postTitle: string;
  className?: string;
};

export function PostActions({ postId, postTitle, className }: PostActionsProps) {
  /* Read through the subscribed snapshot, never the live store: on the first
     client render that snapshot is still the server's empty one, which is what
     keeps the prerendered markup and the hydrated markup identical. */
  const social = useSocial();
  const reposted = isReposted(postId, social);
  const saved = isFavorite(postId, social);
  const reposts = repostCount(postId, social);

  return (
    <div className={className ? `bridge-post-actions ${className}` : "bridge-post-actions"}>
      <button
        aria-label={`${reposted ? "Undo repost of" : "Repost"} ${postTitle}. ${reposts} ${reposts === 1 ? "repost" : "reposts"}.`}
        aria-pressed={reposted}
        className="bridge-post-action"
        onClick={() => (reposted ? unrepost(postId) : repost(postId))}
        type="button"
      >
        <span aria-hidden="true" className="bridge-post-glyph">
          <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
            <path d="M4 9.5V7.6A2.6 2.6 0 0 1 6.6 5H17" />
            <path d="m14 2 3 3-3 3" />
            <path d="M20 14.5v1.9a2.6 2.6 0 0 1-2.6 2.6H7" />
            <path d="m10 22-3-3 3-3" />
          </svg>
        </span>
        <span>{reposted ? "Reposted" : "Repost"}</span>
        <span aria-hidden="true" className="bridge-post-count">{reposts}</span>
      </button>

      <button
        aria-label={`${saved ? "Remove" : "Add"} ${postTitle} ${saved ? "from" : "to"} your favorites`}
        aria-pressed={saved}
        className="bridge-post-action bridge-post-save"
        onClick={() => (saved ? unfavoriteEverywhere(postId) : favoritePost(postId))}
        type="button"
      >
        <span aria-hidden="true" className="bridge-post-glyph">
          <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
            <path d="M6.8 3.8h10.4a1 1 0 0 1 1 1v15.4l-6.2-3.7-6.2 3.7V4.8a1 1 0 0 1 1-1Z" />
          </svg>
        </span>
        <span>{saved ? "Saved" : "Save"}</span>
        {/* No saved-count: who saved a post is nobody's business, owner included. */}
      </button>

      {saved && <SaveToFolder postId={postId} postTitle={postTitle} />}
    </div>
  );
}
