"use client";

import { postModeCatalog, type PostModeId } from "@/lib/phase3/post-modes";
import "./post-mode-picker.css";

type PostModePickerProps = {
  disabled?: boolean;
  onChange: (id: PostModeId) => void;
  value: PostModeId;
};

export function PostModePicker({ disabled = false, onChange, value }: PostModePickerProps) {
  return (
    <fieldset className="pm-picker">
      <legend>What are you posting?</legend>
      <p className="form-hint">
        The mode decides which fields you fill in. Reach and the 21+ access rules still apply on top of it.
      </p>
      <div className="pm-picker-grid">
        {postModeCatalog.map((mode) => (
          <button
            aria-pressed={value === mode.id}
            className="pm-picker-choice"
            disabled={disabled}
            key={mode.id}
            onClick={() => onChange(mode.id)}
            type="button"
          >
            <strong>{mode.label}</strong>
            <span>{mode.blurb}</span>
            {mode.forcesB2B && <span className="pm-picker-tag">B2B only</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
