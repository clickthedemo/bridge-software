"use client";

import { useState } from "react";
import { contactReasons, submitContactRequest, type ContactReason } from "@/lib/contact";

type FormStatus = "idle" | "pending" | "success" | "error";

export function ContactRequestForm({ profileName, profileSlug }: { profileName: string; profileSlug: string }) {
  const [reason, setReason] = useState<ContactReason>(contactReasons[0]);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [simulateFailure, setSimulateFailure] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending" || status === "success") return;

    if (!note.trim()) {
      setNoteError("Add a short note so the member knows why you are reaching out.");
      return;
    }
    setNoteError("");
    setStatus("pending");
    try {
      await submitContactRequest({ profileSlug, reason, note: note.trim() }, { simulateFailure });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status">
        <p className="eyebrow">Request sent</p>
        <h2>Your request is pending.</h2>
        <p>
          {profileName} will see your {reason.toLowerCase()} note and can accept or decline. Contact details stay
          private until they accept.
        </p>
        <p className="form-hint">Prototype: this submission was simulated and nothing was stored.</p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <p className="eyebrow">Make a connection</p>
      <h2>Contact {profileName}</h2>
      <p>Share a concise reason for connecting. Direct contact details stay private until accepted.</p>

      <label htmlFor="reason">Reason for contact</label>
      <select
        disabled={status === "pending"}
        id="reason"
        onChange={(event) => setReason(event.target.value as ContactReason)}
        value={reason}
      >
        {contactReasons.map((option) => <option key={option}>{option}</option>)}
      </select>

      <label htmlFor="message">Short note</label>
      <textarea
        aria-describedby={noteError ? "message-error" : undefined}
        aria-invalid={noteError ? true : undefined}
        disabled={status === "pending"}
        id="message"
        maxLength={500}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Example: We would like to discuss a retail partnership in Maryland."
        rows={4}
        value={note}
      />
      {noteError && <p className="form-error" id="message-error" role="alert">{noteError}</p>}

      {status === "error" && (
        <p className="form-error" role="alert">
          The request could not be sent. Your note is still here — try again.
        </p>
      )}

      <button className="button primary full" disabled={status === "pending"} type="submit">
        {status === "pending" ? "Sending request…" : status === "error" ? "Try again" : "Send contact request"}
      </button>

      <details className="demo-controls">
        <summary>Prototype demo controls</summary>
        <label className="check-row">
          <input
            checked={simulateFailure}
            onChange={(event) => setSimulateFailure(event.target.checked)}
            type="checkbox"
          />
          Simulate a network failure
        </label>
        <p className="form-hint">Submissions are simulated for the walkthrough — nothing is sent or stored.</p>
      </details>
    </form>
  );
}
