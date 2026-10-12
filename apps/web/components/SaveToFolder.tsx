"use client";

import { useId, useRef, useState } from "react";
import {
  collectionNames,
  collectionsOf,
  inCollection,
  setCollection,
  useSocial,
} from "@/lib/social";
import "./save-to-folder.css";

/*
 * Tori: "Any chance that when a user saves a post, it can go under a specific
 * folder like 'SAVED EVENTS', or 'SAVED DEALS' or maybe they can custom their
 * own?"
 *
 * Deliberately a second, optional step rather than a prompt on every save. She
 * also said she loves how fast the feed is to use, and making one-click save
 * into a modal would be the fastest way to lose that.
 *
 * <details> carries the open/closed state and the Escape and click-away
 * behaviour natively, so there is no focus-trap of my own to get wrong.
 */
export function SaveToFolder({ postId, postTitle }: { postId: string; postTitle: string }) {
  const social = useSocial();
  const names = collectionNames(social);
  const filed = collectionsOf(postId, social);
  const [draft, setDraft] = useState("");
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const fieldId = useId();

  function addCustom(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    setCollection(postId, name, true);
    setDraft("");
  }

  return (
    <details className="folder-menu" ref={detailsRef}>
      <summary
        aria-label={
          filed.length
            ? `Folders for ${postTitle}. In ${filed.join(", ")}.`
            : `Add ${postTitle} to a folder`
        }
        className="folder-summary"
      >
        <span aria-hidden="true" className="folder-glyph">
          <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
            <path d="M3 7.4a1.4 1.4 0 0 1 1.4-1.4h4.3l1.9 2.2h8A1.4 1.4 0 0 1 20 9.6v8A1.4 1.4 0 0 1 18.6 19H4.4A1.4 1.4 0 0 1 3 17.6Z" />
          </svg>
        </span>
        <span>{filed.length ? filed[0] : "Folder"}</span>
        {filed.length > 1 && <span className="folder-more">+{filed.length - 1}</span>}
      </summary>

      <div className="folder-panel">
        <p className="folder-panel-title">File this post</p>
        <ul className="folder-list">
          {names.map((name) => {
            const on = inCollection(postId, name, social);
            return (
              <li key={name}>
                <label className="folder-option">
                  <input
                    checked={on}
                    onChange={(event) => setCollection(postId, name, event.target.checked)}
                    type="checkbox"
                  />
                  <span>{name}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <form className="folder-new" onSubmit={addCustom}>
          <label className="visually-hidden" htmlFor={fieldId}>
            New folder name
          </label>
          <input
            id={fieldId}
            maxLength={40}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="New folder"
            type="text"
            value={draft}
          />
          <button className="button secondary" disabled={!draft.trim()} type="submit">
            Add
          </button>
        </form>
      </div>
    </details>
  );
}
