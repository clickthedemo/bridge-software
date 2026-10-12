"use client";

import { useState } from "react";
import { PostModeFields } from "@/components/PostModeFields";
import { PostModePicker } from "@/components/PostModePicker";
import { audienceLabel, reachCatalog, reachLabel, resolveEffectiveAudiences } from "@/lib/phase3";
import {
  composePostModeMessage,
  emptyPostModeValues,
  getPostMode,
  postModeProtectedDetail,
  resolvePostModeReach,
  validatePostMode,
  type PostModeId,
  type PostModeValues,
} from "@/lib/phase3/post-modes";
import type { ReachId } from "@/lib/phase3/audiences";

/* The composer's own audience checkboxes stay in Create; this route only has to
   show what the mode does to them. */
const demoSelected = ["adults", "retailers", "industry"];

export default function PostModesDemoPage() {
  const [mode, setMode] = useState<PostModeId>("deal");
  const [values, setValues] = useState<PostModeValues>(() => emptyPostModeValues("deal"));
  const [message, setMessage] = useState("");
  const [reach, setReach] = useState<ReachId>(getPostMode("deal").defaultReach);

  const definition = getPostMode(mode);
  const issues = validatePostMode(mode, values);
  const protectedDetail = postModeProtectedDetail(mode, values, false);
  const effectiveAudiences = resolveEffectiveAudiences(demoSelected, protectedDetail);
  const resolvedReach = resolvePostModeReach(mode, values, reach);
  const composed = composePostModeMessage(mode, values, message);

  function chooseMode(next: PostModeId) {
    setMode(next);
    setValues(emptyPostModeValues(next));
    setReach(getPostMode(next).defaultReach);
  }

  return (
    <section className="page shell">
      <div className="page-heading">
        <p className="eyebrow">Composer component</p>
        <h1>Posting modes.</h1>
        <p className="lede">
          A post has a mode, and the mode decides which fields it asks for. Deals carry terms and an end
          date, drops can go public or private to buyers, service listings are B2B by nature.
        </p>
      </div>

      <p className="review-notice">
        Review build. The offers, prices and hiring detail here are sample text, and nothing is placed,
        sold or paid for in this build. The fields, the validation and the reach each mode resolves to
        all work for real.
      </p>

      <div className="create-layout">
        <div className="content-card create-form">
          <PostModePicker onChange={chooseMode} value={mode} />

          <label htmlFor="pm-demo-message">Message</label>
          <textarea
            id="pm-demo-message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Say it in your own words"
            rows={3}
            value={message}
          />

          <PostModeFields mode={mode} onChange={setValues} values={values} />

          <fieldset className="audience-fieldset">
            <legend>Who do you want to see this?</legend>
            {reachCatalog.map((item) => (
              <label className="check-row" key={item.id}>
                <input
                  checked={reach === item.id}
                  disabled={definition.forcesB2B}
                  name="pm-demo-reach"
                  onChange={() => setReach(item.id)}
                  type="radio"
                />
                <span>
                  {item.label} <span className="muted">· {item.hint}</span>
                </span>
              </label>
            ))}
            <p className="form-hint">
              {definition.forcesB2B
                ? `${definition.label} posts are business to business, so reach is not a choice here.`
                : "Reach is who you are talking to. The 21+ and verified-access rules still apply on top of it."}
            </p>
          </fieldset>

          {issues.length > 0 ? (
            <div>
              <p className="form-hint">
                {issues.length === 1 ? "One field" : `${issues.length} fields`} to finish before this could publish:
              </p>
              {issues.map((issue) => (
                <p className="form-error" key={issue.field}>
                  {issue.message}
                </p>
              ))}
            </div>
          ) : (
            <p className="status-chip verified" role="status">
              Every {definition.label.toLowerCase()} field is complete.
            </p>
          )}
        </div>

        <aside aria-live="polite" className="content-card create-preview">
          <p className="eyebrow">Preview</p>
          <h3>{definition.label}</h3>
          <p className="status-chip">Sent as {definition.contentType}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{composed || "The post and its mode detail appear here."}</p>
          <p className="muted">
            Reach: {reachLabel(resolvedReach)} · Access level:{" "}
            {protectedDetail ? "Verified audiences only" : "As selected"}
          </p>
          <div className="tag-row">
            {effectiveAudiences.length === 0 ? (
              <span className="tag">No eligible audience</span>
            ) : (
              effectiveAudiences.map((id) => (
                <span className="tag" key={id}>
                  {audienceLabel(id)}
                </span>
              ))
            )}
          </div>
          <p className="form-hint">
            The mode can only narrow this. It pins a private post to B2B and drops Adults 21+ from the
            audience list; it never adds an audience the author did not pick.
          </p>
        </aside>
      </div>
    </section>
  );
}
