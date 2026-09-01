# Phase 0 baseline report

Verified: 2026-07-11 · Repository `dillonmohr8777/bridge-discovery-prototype` · Branch `main` @ `f7fddf4` (clean working tree) · Development branch `claude/bridge-discovery-phase-0-jw6vn2`

## Commands run

```bash
npm install          # clean install, no errors
npm run typecheck    # pass (tsc --noEmit, strict)
npm run lint         # pass (eslint .)
npm run build        # pass — 8 routes + /_not-found, all prerendered static
npm audit            # 0 vulnerabilities
```

Runtime sweep: production server (`npm run start`) driven by headless Chromium (Playwright) across all 8 routes plus an unknown profile slug, at 390, 768, and 1440 CSS px. Captured HTTP status, console errors/warnings, page errors, `scrollWidth` overflow, and screenshots. Keyboard and interaction spot-checks on landing and directory.

## Working behavior (preserve)

- All 8 routes return 200 and render: `/`, `/directory`, `/join`, `/profile/cascade-canna`, `/dashboard`, `/admin/verification`, `/directions`, `/design-system`. Unknown routes 404 via the default not-found page.
- Directory search, role filter, verified-only filter, clear-filters, live result count, and empty state all work (verified in-browser: `zzzz` → empty state; clear → 6 members; Brand → 2 members).
- Theme switching works and persists across reloads via `localStorage`; buttons expose `aria-pressed`.
- Skip link is first in tab order and becomes visible on focus; header tab order is logical (skip → brand → nav → theme buttons).
- Semantic HTML, labeled form controls, `:focus-visible` treatment, and reduced-motion handling are present throughout.
- No hydration warnings or page errors on any route at any width.

## Defects found (Phase 1 scope)

| ID | Defect | Evidence |
|---|---|---|
| D1 | No navigation at ≤980px — `nav { display: none }` with no mobile alternative | `app/globals.css` 980px media query |
| D2 | Every profile card links to `/profile/cascade-canna` regardless of member — ternary with identical branches | `components/ProfileCard.tsx:19` |
| D3 | Contact request form has no validation/pending/success/error states; submit button inert; note pre-filled | `app/profile/cascade-canna/page.tsx` |
| D4 | Join role selection never updates the static "Next up" preview (wrong for Sales rep); Continue inert | `app/join/page.tsx` |
| D5 | Dead active-looking controls: dashboard Edit profile/Review, admin section nav, Oldest first, queue Open | dashboard/admin pages |
| D6 | Direction card swatches don't match the theme tokens actually applied (e.g. amber `#F2A93B` shown vs `#D9820F` applied) | `app/directions/page.tsx` vs `globals.css` |
| D7 | Saved non-default theme flashes default on full reload (applied post-hydration); theme-set logic duplicated | `components/ThemeSwitcher.tsx`, `app/directions/page.tsx` |
| D8 | Directory result count not announced to screen readers; "Sorted by relevance" copy is untrue (no sorting exists) | `app/directory/directory-client.tsx` |
| D9 | Fictional data (landing stats, dashboard metrics, admin counts) marked provisional only in the footer | multiple routes |
| D10 | Console error on every full load: `favicon.ico` 404 (no icon wired; `public/bridge-mark.svg` unused as icon) | runtime sweep |
| D11 | Horizontal overflow at 768px on `/directory` (+15px): results column grid track expands past viewport (`min-width: auto` grid items) | runtime sweep |
| D12 | Horizontal overflow at 768px on `/admin/verification` (+213px): absolutely-positioned `.sr-only` table-header span escapes the `.table-scroll` scroll container and stretches the document to 981px | runtime sweep |

No horizontal overflow at 390 or 1440 on any route; 768px issues are limited to D11/D12.

## Unimplemented states (documented, mostly later-phase)

- Contact request: pending/success/error (D3 — required end state for the route, in Phase 1 scope as defect repair with mock adapter).
- Join: validation, progress beyond step 1, save/resume boundary (steps 2–4 are post-decision build).
- Admin: detail review with evidence, approve/request-changes/reject with confirmation (Phase 3 journey; Phase 1 only makes existing controls honest).
- Loading/refresh states: not applicable yet — all data is static mock, no async boundaries exist.

## Contradictions found

- README run instructions use PowerShell fences; environment-neutral commands work fine (cosmetic only).
- Dashboard greets "Tori" but is labeled "Brand dashboard" and links to Cascade Canna's profile — persona inconsistency to note for the walkthrough, not changed without direction.
- Status screenshots say "browser console showed no errors": current baseline shows the favicon 404 (D10).

## Approval-dependent items (not touched)

- Visual direction choice, logo, palette, typography → Tori (gate A). `Trusted Current` remains provisional default.
- Retailer vs dispensary as distinct account types (D-02), verification evidence/meaning (D-03/D-04), field visibility (D-05) → Tori/Miraj/compliance.
- Supabase/auth/RLS/storage contracts → Miraj (gate B). No backend dependency added.
