"use client";

import { useState } from "react";
import {
  getPostMode,
  isPostModePrivate,
  postModeFlag,
  postModeText,
  todayIsoDate,
  validatePostModeField,
  type PostModeField,
  type PostModeId,
  type PostModeValues,
} from "@/lib/phase3/post-modes";
import "./post-mode-fields.css";

type PostModeFieldsProps = {
  disabled?: boolean;
  mode: PostModeId;
  onChange: (values: PostModeValues) => void;
  values: PostModeValues;
};

type TouchedState = { mode: PostModeId; fields: Record<string, boolean> };

export function PostModeFields({ disabled = false, mode, onChange, values }: PostModeFieldsProps) {
  const [touched, setTouched] = useState<TouchedState>({ mode, fields: {} });
  const definition = getPostMode(mode);
  const today = todayIsoDate();

  /* Switching mode clears the touched set, so a fresh form is never pre-scolded. */
  const touchedFields = touched.mode === mode ? touched.fields : {};

  function set(name: string, value: string | boolean) {
    onChange({ ...values, [name]: value });
  }

  function markTouched(name: string) {
    setTouched({ mode, fields: { ...touchedFields, [name]: true } });
  }

  /* Toggles render their own row, so this only ever sees the labelled controls. */
  function renderControl(
    field: Exclude<PostModeField, { type: "toggle" }>,
    invalid: boolean,
    describedBy: string | undefined,
  ) {
    const id = `pm-${mode}-${field.name}`;
    const shared = {
      "aria-describedby": describedBy,
      "aria-invalid": invalid || undefined,
      disabled,
      id,
      onBlur: () => markTouched(field.name),
    } as const;

    if (field.type === "textarea") {
      return (
        <textarea
          {...shared}
          maxLength={field.maxLength}
          onChange={(event) => set(field.name, event.target.value)}
          placeholder={field.placeholder}
          rows={3}
          value={postModeText(values, field.name)}
        />
      );
    }

    if (field.type === "date") {
      return (
        <input
          {...shared}
          /* The browser's own date picker enforces the floor before validation has to. */
          min={field.notPast ? today : undefined}
          onChange={(event) => set(field.name, event.target.value)}
          type="date"
          value={postModeText(values, field.name)}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select {...shared} onChange={(event) => set(field.name, event.target.value)} value={postModeText(values, field.name)}>
          <option value="">Choose one</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        {...shared}
        maxLength={field.maxLength}
        onChange={(event) => set(field.name, event.target.value)}
        placeholder={field.placeholder}
        type="text"
        value={postModeText(values, field.name)}
      />
    );
  }

  return (
    <fieldset className="pm-fields">
      <legend>{definition.label} details</legend>

      {definition.fields.length === 0 && (
        <p className="form-hint">An update takes no extra fields. Write the post itself above.</p>
      )}

      {definition.fields.map((field) => {
        const id = `pm-${mode}-${field.name}`;
        const error = touchedFields[field.name]
          ? validatePostModeField(field, values[field.name], today)
          : null;
        const describedBy = [field.hint ? `${id}-hint` : null, error ? `${id}-error` : null]
          .filter(Boolean)
          .join(" ");

        if (field.type === "toggle") {
          return (
            <div className="pm-field" key={field.name}>
              <label className="check-row" htmlFor={id}>
                <input
                  aria-describedby={describedBy || undefined}
                  checked={postModeFlag(values, field.name)}
                  disabled={disabled}
                  id={id}
                  onChange={(event) => set(field.name, event.target.checked)}
                  type="checkbox"
                />
                <span>{field.label}</span>
              </label>
              {field.hint && (
                <p className="form-hint" id={`${id}-hint`}>
                  {field.hint}
                </p>
              )}
            </div>
          );
        }

        return (
          <div className="pm-field" key={field.name}>
            <label htmlFor={id}>
              {field.label}
              {!field.required && <span className="pm-field-optional"> (optional)</span>}
            </label>
            {renderControl(field, error !== null, describedBy || undefined)}
            {field.type === "textarea" && (
              <p className="pm-field-count">
                {postModeText(values, field.name).length}/{field.maxLength}
              </p>
            )}
            {field.hint && (
              <p className="form-hint" id={`${id}-hint`}>
                {field.hint}
              </p>
            )}
            {error && (
              <p className="form-error" id={`${id}-error`} role="alert">
                {error}
              </p>
            )}
          </div>
        );
      })}

      {isPostModePrivate(mode, values) && (
        <p className="pm-fields-private">
          Private to verified businesses. Reach is pinned to B2B and Adults 21+ comes off the audience list.
        </p>
      )}
    </fieldset>
  );
}
