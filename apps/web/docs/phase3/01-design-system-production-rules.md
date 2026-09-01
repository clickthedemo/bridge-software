# Phase 3 design-system production rules

Trusted Current remains the deployed provisional direction. These rules apply to the Phase 3 Create and My Profile slice and to any later production bind.

## Tokens

- Use only CSS custom properties from `app/globals.css`. Do not introduce hex values in component files.
- Required semantic tokens: `--brand`, `--accent`, `--signal`, `--canvas`, `--surface`, `--text`, `--muted`, `--border`, `--success`, `--warning`, `--danger`.
- Status color is never the only indicator. Pair chips with text (`Verified`, `Confirmation needed`, `Publish unavailable`).

## Components

- Primary action: `.button.primary`
- Secondary / toggle off: `.button.secondary`
- Destructive or blocked copy: `.form-error` with `role="alert"`
- Pending copy: `.form-hint` with `aria-busy` when loading
- Visibility chips: `.status-chip.verified` / `.pending` / `.warning`

## States every Phase 3 mutation must show

1. Loading / session unresolved
2. Permission denied
3. Inline validation
4. Submission pending (disable the control, keep the data)
5. Retryable server/network error
6. Success without a second submit

## Accessibility

- Visible focus, labeled inputs, `aria-pressed` on view toggles, `aria-live` on preview and confirmation.
- No page-level horizontal overflow at 390 / 768 / 1440.
- Disabled Adults 21+ must include the reason in the label text.

## What this does not approve

These rules do not approve a final logo, palette, or typeface. Tori still owns visual acceptance. Production auth chrome is still Miraj's later work.
