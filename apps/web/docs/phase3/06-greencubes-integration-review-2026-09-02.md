# Greencubes integration review — 2026-09-02

Independent review of the Greencubes (Miraj) work delivered on 2026-09-02, covering
`origin/feature/admin-login` and the live backend at `bridge-software-backend.onrender.com`.

- Branch reviewed: `origin/feature/admin-login` @ `fde9cf0`
- Base: `origin/development` @ `6d7aed6`
- Commits in scope: `93ba32b`, `a409d97`, `436203a`, `9f5fa49`, `fde9cf0`
- Diff: 32 files, +830 / −313
- Reviewed against `docs/INTEGRATION-API-CONTRACT.md` and `docs/INTEGRATION-PIPELINE.md`

**Verdict: do not merge to `development` yet.** The backend is genuinely well built and
clears the security bar that was set on 2026-08-31. Three items block the merge, and the
first is a governance question only Dillon can answer.

---

## What was verified as working

### Backend (verified live, unauthenticated probes)

| Check | Result |
|---|---|
| `GET /api/v1/health` | `200` `{"status":"ok","service":"bridge-api"}` |
| `GET /api/v1/admin/users` unauthenticated | `401 UNAUTHORIZED` |
| `GET /api/v1/admin/verification-queue` unauthenticated | `401 UNAUTHORIZED` |
| `GET /api/v1/auth/me` unauthenticated | `401 UNAUTHORIZED` |
| Same three routes with a forged `Bearer` token | `401 UNAUTHORIZED` |
| `POST /api/v1/auth/login` with bad credentials | `401 INVALID_CREDENTIALS` |

**Server-side RBAC is real.** The 2026-08-31 requirement — "enforce admin access through
backend RBAC, not only by hiding the route on the frontend" — is met. Admin routes reject
both missing and forged tokens at the server.

CORS is configured correctly for a credentialed design:

- `Access-Control-Allow-Origin: https://bridge-connected-signal.netlify.app` — a specific
  origin, not `*`, exactly as the contract requires
- `Vary: Origin`
- `Access-Control-Allow-Headers: Authorization,Content-Type`
- `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`

Response security headers are strong: HSTS (`max-age=31536000; includeSubDomains`), a
restrictive CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`,
`X-Frame-Options: SAMEORIGIN`. Errors use a consistent `{error, message}` envelope.

### Frontend gates

| Gate | Result |
|---|---|
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** |
| `npm run build` | **pass** — 33 routes compiled |
| `npm run test:phase3` | **fail — 23 pass, 1 fail** |

---

## Blocking

### B1 — Repository identity was rewritten in the canonical repo

`93ba32b` rewrites the repository pointer in all three project-identity files (this review
originally attributed the change to `9f5fa49`; `git log -S` places it in `93ba32b`):

| File | From | To |
|---|---|---|
| `CLAUDE.md` | `dillonmohr8777/bridge-software-frontend` | `getonthebridge0-max/thebridge` |
| `CLAUDE_BUILD_SPEC.md` | `dillonmohr8777/bridge-software-frontend` | `getonthebridge0-max/thebridge` |
| `CLAUDE_SESSION_PROMPT.md` | `dillonmohr8777/bridge-software-frontend` (×2) | `getonthebridge0-max/thebridge` |

`CLAUDE.md` opens with "STOP: verify the Bridge repository first" — a guard that exists
specifically to stop sessions working against the wrong Bridge. Merging this change points
every future session at a different repository.

### B1 status — decided, and now fixed (2026-09-21)

This was written as an open governance question. It is neither open nor a governance
question: the target repository does not exist. `gh api repos/getonthebridge0-max/thebridge`
returned HTTP 404 to a `repo`-scoped admin token on 2026-09-02, and
`docs/INTEGRATION-PIPELINE.md` records `getonthebridge0-max` as a *pending invitee to this
repository*, not the owner of another one. The rewrite took an invitee's username and turned
it into a repository path.

D-09 was finalised accordingly: canonical stays `dillonmohr8777/bridge-software-frontend`.

The revert itself sat unexecuted for nineteen days and reached `production` in the meantime,
so between 2026-09-03 and 2026-09-21 the "STOP: verify the Bridge repository first" guard on
the default branch pointed every session at a 404. **This commit applies the revert**,
restoring all four lines across the three files to their exact pre-`93ba32b` text.

A later transfer to a client-owned repository remains possible; it would be its own decision
and its own commit, with the pipeline docs migrated alongside.

### B2 — The branch fails the existing test suite

```
not ok 23 - http client sends credentialed requests to the versioned API origin
# tests 24  # pass 23  # fail 1
```

`lib/phase3/phase3.test.ts:306` asserts `requestInit?.credentials === "include"`. It now
receives `undefined`, because `fde9cf0` commented out `credentials: "include"` in
`lib/phase3/http-client.ts`.

`CLAUDE.md` lists `npm run test:phase3` first among the required commands and states that a
change is not complete until the gates pass. This is a real regression in the Phase 3
adapter, not a stale test — the assertion still describes the contract as written.

### B3 — Bearer-token switch was never flagged as a contract change

`docs/INTEGRATION-API-CONTRACT.md:29` states the adapter sends `credentials: include` so
cookie sessions work. Line 37 is explicit:

> If Greencubes uses bearer tokens instead, **flag that contract change before changing the
> frontend client.**

`fde9cf0` ("remove credentials include from HTTP clients") changed the frontend client to a
pure bearer-token model in two files without that flag being raised. The commit message
describes it as a fix; it is an architecture change.

The change is also avoidable in its current form. Because the backend already echoes a
specific origin with `Vary: Origin`, credentialed requests fail only for the want of one
response header — `Access-Control-Allow-Credentials: true`. Adding that header on the
Greencubes side restores cookie support and resolves B2 and B4 together.

---

## Should fix before production

### S1 — Refresh tokens are stored in `sessionStorage`

`lib/auth/storage.ts` persists the whole session — `accessToken` **and** `refreshToken` —
into `sessionStorage` under `bridge_session`. Any XSS on any Bridge page can read both. An
access token is short-lived; a refresh token is the long-lived credential, and it should
not be reachable from JavaScript.

Recommended: move the refresh token to an httpOnly, `Secure`, `SameSite` cookie and keep
only the access token in memory. This needs the `Access-Control-Allow-Credentials: true`
header from B3, and restores `credentials: "include"`, which also fixes B2.

If the pure-bearer design is deliberately kept instead, it is at least internally coherent
(bearer auth is not CSRF-exposed, and no CSRF header is defined), but it should be recorded
as an accepted risk in `docs/decision-log.md` with a short refresh-token TTL and
server-side revocation.

### S2 — Required session claims are missing from `/auth/me`

The contract's "Required session claims" section lists nine claims the server must
authorize from. The implemented `CurrentUser` type carries roughly four:

| Contract claim | Present in `/auth/me`? |
|---|---|
| `userId` | yes (`id`) |
| `role` | partial — `platformRoles` plus per-org `role` |
| `organizationId` | yes, via `memberships` |
| `ageEligible` | **missing** |
| `membershipStatus` | **missing** |
| `organizationVerificationState` | **missing** |
| `delegatedPermissions` | **missing** |
| `stateLicenseEligibility` | **missing** |
| `adminScope` | **missing** |

Age eligibility matters here: Bridge runs a 21+ age gate, and the frontend currently has no
server-authoritative signal for it. Verification state and membership status gate the
product's core flows. These need to land before the verification and publishing slices.

### S3 — The auth layer has no mock-mode fallback, so `/login` breaks in the default config

`lib/auth/api.ts` computes its base once at module scope:

```ts
const configuredBase = process.env.NEXT_PUBLIC_BRIDGE_API_BASE?.replace(/\/$/, "") ?? "";
const apiBase = configuredBase.endsWith("/api/v1") ? configuredBase : `${configuredBase}/api/v1`;
```

`CLAUDE.md` documents the repo as "in-memory by default; live `/api/v1` only when
`NEXT_PUBLIC_BRIDGE_API_BASE` is set", and `lib/phase3/client.ts` honours that by selecting
the in-memory adapter. The new auth layer has no such branch: with the variable unset,
`apiBase` collapses to the relative `/api/v1`, so `/login` posts to the Netlify origin
itself, 404s, and surfaces the generic "The request could not be completed."

Anyone running the documented `npm run dev` gets a login screen that cannot work and does
not say why. Either give the auth layer the same in-memory fallback, or fail loudly at
startup when the variable is missing.

### S4 — Contract shape is inconsistent between endpoints

`/auth/me` returns `platformRoles: "admin"[]` (plural array, and typed so narrowly that
`"admin"` is the only representable value). `/admin/users` returns
`platformRole: string | null` (singular, open string). Same concept, two shapes, two names.
Pick one before more code depends on either.

---

## Minor

| # | Item | Detail |
|---|---|---|
| M1 | Dead code | `credentials: "include"` is commented out rather than removed in `lib/auth/api.ts` and `lib/phase3/http-client.ts`. Whichever way B3 resolves, do not leave it commented. |
| M2 | `next-env.d.ts` edited | Changed `./.next/types/` → `./.next/dev/types/`. The file says "should not be edited"; this is dev-server output. Build passes, but it should not be committed. |
| M3 | Lockfile drift | `package-lock.json` shows 90 deletions / 0 insertions, stripping `libc: ["glibc"]` from optional platform deps — the signature of `npm install` on an older npm than the one that generated the lockfile. Revert and re-run with the project's npm. |
| M4 | `netlify.toml` | Trailing newline removed for no reason. |
| M5 | `app/layout.tsx` formatting | `<AuthProvider><AgeGate>` and `</AgeGate></AuthProvider>` collapsed onto single lines, against surrounding style. |
| M6 | Commit hygiene | `93ba32b`, `a409d97`, `436203a` share the identical message "Complete admin login implementation". Squash before merge. |
| M7 | Auth runs on public pages | `AuthProvider` now wraps `AgeGate` at the root, so every public page mounts the provider and issues a `/auth/me` call when a session exists. Intentional is fine; worth confirming it is. |

---

## What Greencubes should be asked for

1. A decision on B1 — is `getonthebridge0-max/thebridge` the canonical repo, or should the
   pointer be reverted?
2. `Access-Control-Allow-Credentials: true` on the API, which unblocks B2, B3 and S1
   together — or an explicit, recorded decision to stay on pure bearer tokens.
3. The remaining session claims in S2, with the age-eligibility signal prioritised.
4. The route table and request/response examples for the endpoints now in use:
   `/auth/register`, `/auth/login`, `/auth/me`, `/auth/forgot-password`,
   `/auth/reset-password`, `/auth/resend-verification`, `/admin/users`,
   `/admin/verification-queue`. The contract still lists these as "to confirm".
5. Access-token TTL and the refresh/rotation policy.
6. Confirmation that `/api/v1` is stable as the versioned prefix on the staging origin.

## Reviewer notes

Product approval for Steps 2 and 4 remains with Melissa and Tori and is unchanged by this
review. Nothing in this branch has been merged or promoted. The backend security posture is
the strongest part of this delivery and should be acknowledged as such — the blocking items
are a governance question, one broken test, and one undeclared contract change, all of which
are cheap to resolve.

---

# 2026-09-02 local re-verification

Independent second pass, run on Dillon's machine against the live branch and the live
backend. Everything above was re-checked; this section records the evidence, corrects what
the first pass got wrong, and adds findings the first pass missed.

## Provenance

| Item | Value |
|---|---|
| `origin/feature/admin-login` head | `fde9cf035ba011592a997fb33fbd99c44c1bcc1b` (unchanged since the first review) |
| `origin/development` head | `f548013a2f6985a8be5c52de8338abaa67c81e85` |
| `git merge-base development feature/admin-login` | `f548013a…` — the branch already contains all of `development`; PR #13 is `MERGEABLE` |
| `origin/claude/va-claims-slack-bridge-qg1vqa` head | `5e9aee2463b04463f977e2e785c1e434da16a4c7` |
| Diff | 32 files, +830 / −313 |
| Toolchain | Node v24.18.0, npm 12.0.2, Next.js 16.3.1 (Turbopack) |
| Backend | `https://bridge-software-backend.onrender.com`, `/api/v1/version` returns `{"service":"bridge-api","version":"0.1.0","environment":"development"}` |
| Deploy preview | `https://deploy-preview-13--bridge-connected-signal-dev.netlify.app` (live, unauthenticated 200s) |

**Correction to the first pass:** it recorded the base as `origin/development @ 6d7aed6`.
The correct base is `f548013`. The branch is current with `development`; no rebase is needed.

## Commands run and results

```
npm ci                  ok
npm run test:phase3     FAIL - tests 24, pass 23, fail 1
npm run typecheck       pass (also passes from a deleted .next/, so M2 is not a CI risk)
npm run lint            pass
npm run build           pass - 43 static routes generated
```

The single failure is exactly the one reported:

```
x http client sends credentialed requests to the versioned API origin
  AssertionError: expected 'include', actual undefined
  at lib/phase3/phase3.test.ts:306
```

## Backend probes (read-only GET only; no accounts created, no POSTs)

All sent with `Origin: https://bridge-connected-signal-dev.netlify.app`.

| Request | Status | Body / notes |
|---|---|---|
| `GET /health` | **200** | `{"status":"ok","service":"thebridge-api"}` |
| `GET /version` | **404** | `Cannot GET /version` |
| `GET /api/v1/health` | **200** | `{"status":"ok","service":"bridge-api"}` |
| `GET /api/v1/version` | **200** | `{"service":"bridge-api","version":"0.1.0","environment":"development"}` |
| `GET /api/v1/auth/me` no auth | **401** | `{"error":"UNAUTHORIZED","message":"A valid Bearer access token is required."}` |
| `GET /api/v1/admin/users` no auth | **401** | same envelope |
| `GET /api/v1/admin/verification-queue` no auth | **401** | same envelope |
| the same three with `Authorization: Bearer invalid` | **401** | same envelope |
| `OPTIONS /api/v1/auth/login` preflight | **204** | `Allow-Headers: Authorization,Content-Type`; `Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`; `Vary: Origin` |

**Server-side RBAC confirmed.** Missing and forged bearer tokens are both rejected at the
server on all three protected routes. The 2026-08-31 requirement is met.

**`Access-Control-Allow-Credentials` is absent** - on every response above and on the
preflight. This is the confirmed root cause behind B2/B3/S1: one response header on the
Greencubes side restores cookie sessions.

**Correction to the first pass on CORS.** It reported
`Access-Control-Allow-Origin: https://bridge-connected-signal.netlify.app` as if that were
a fixed value. It is an allowlist echo, and the allowlist is correct:

| Origin sent | `Access-Control-Allow-Origin` returned |
|---|---|
| `https://bridge-connected-signal-dev.netlify.app` | echoed |
| `https://bridge-connected-signal.netlify.app` | echoed |
| `http://localhost:3000` | echoed |
| `https://evil.example.com` | **no header at all** |

That is all three origins the contract requires and nothing else - a real allowlist, not a
blind echo. This is better than the first pass described and should be credited as such.

**Not re-verified:** `POST /api/v1/auth/login` with bad credentials. This pass was
read-only by instruction, so the first pass's `401 INVALID_CREDENTIALS` result stands
unconfirmed rather than contradicted.

Security response headers re-confirmed on every route: HSTS `max-age=31536000;
includeSubDomains`, a restrictive CSP, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy: same-origin`,
`Cross-Origin-Resource-Policy: same-origin`, `X-Frame-Options: SAMEORIGIN`, `Vary: Origin`.

Two health endpoints exist with two different service names - `thebridge-api` at the root
and `bridge-api` under `/api/v1`. Worth one question to Miraj; it suggests two apps or a
rename mid-flight.

## Deploy preview

`gh pr checks 13` reports "no checks reported on the 'feature/admin-login' branch" and the
PR carries no status-check rollup, but a Netlify deploy preview **does** exist and is live:

| Route on `deploy-preview-13--bridge-connected-signal-dev.netlify.app` | Status |
|---|---|
| `/login` | 200 |
| `/join` | 200 |
| `/admin` | **404** |
| `/admin/dashboard`, `/admin/users`, `/admin/verification` | 200 |
| `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email` | 200 |
| `/unauthorized`, `/my-profile` | 200 |

Status codes only; no authenticated interaction was attempted. The PR template's
"preview deploy" checkbox is unchecked even though the preview exists - Greencubes should
tick it and link it.

## D-09 evidence

`gh api repos/getonthebridge0-max/thebridge` returns **HTTP 404** with a token carrying the
`repo` scope. The repository either does not exist or is not visible to Dillon's admin
account. **It cannot be the canonical repository today.**

---

## Findings the first pass missed

### B4 (new, blocking) - `/join` Step 1 was deleted, not integrated

`app/join/join-form.tsx` loses 200 lines and gains 83. The change removes:

- the entire twelve-role selection grid (Brand, Dispensary, Retailer, Sales rep,
  Cultivator, Manufacturer, Lab, Transport, Bank, Service, Media, Hydroponics) with its
  per-role `nextTitle` and `requirements` copy
- the typed `MemberRole` binding
- the "Step 1 of 4 - How do you work in cannabis?" heading in `app/join/page.tsx`
- the founding-member pricing callout ($349/month after six free months) and the link to
  `/pricing`
- the `aria-live` boundary note that explains why Steps 2-4 are not yet interactive

and replaces the screen with a plain display-name / email / password / confirm signup card.

This contradicts three written instructions at once:

- `docs/INTEGRATION-PIPELINE.md`, Ownership: "Do not restyle the product or replace screens
  while integrating."
- `docs/INTEGRATION-PIPELINE.md`, First integration target: "Keep the current visual design."
- `docs/INTEGRATION-API-CONTRACT.md`: "The existing Connected purple screens are the design
  authority. Integrate into them; do not replace or restyle them."

It also destroys the exact surface whose Step 2 and Step 4 product approval is still open
with Melissa and Tori, and it drops the only place the product captures a member's role -
which the organization-onboarding and verification slices both depend on.

Registration itself is wired correctly (409 handled, password policy enforced client-side,
confirmation state, resend link). The account form should be **added** - as its own screen
or as a step ahead of role selection - not swapped in on top of `/join`.

### B5 (new, blocking) - tokens in web storage violates a written pipeline rule

The first pass filed this as should-fix S1. It is stronger than that.
`docs/INTEGRATION-PIPELINE.md` states: "Never place API keys, Supabase service-role keys,
**access tokens**, passwords, or private verification documents in Git, Netlify build logs,
**browser storage**, or public client-side variables."

`lib/auth/storage.ts` writes both `accessToken` and `refreshToken` to `sessionStorage` under
`bridge_session`. That is the prohibited placement, named explicitly, for the long-lived
credential. Everything in S1 still applies; the classification changes from advisory to a
documented-rule violation.

### S5 (new) - the refresh token is stored but never used

`AuthSession` carries `refreshToken`, `expiresAt` and `expiresIn`. Nothing reads them.
There is no refresh call, no expiry check, and no 401-triggered re-auth. When the access
token expires the user simply starts getting failures - on `/admin/users` the raw backend
string "A valid Bearer access token is required." is rendered into the admin UI. Storing a
refresh token that is never exercised is the worst of both worlds: full XSS exposure, none
of the benefit.

### S6 (new) - the new auth layer bypasses the Phase 3 adapter entirely

`lib/auth/api.ts` is a second, parallel HTTP client. It does not use `lib/phase3/client.ts`,
so it inherits none of `mapStatus` / `Phase3Error` / `userMessageFor`. The contract's status
mapping (401 unauthenticated, 403 forbidden, 400/422 validation, 409 conflict) is implemented
once in `lib/phase3/http-client.ts` and not at all in the auth layer, which only distinguishes
409 at one call site. There are now two clients, two error models, and two base-URL
computations for one API. This is also why S3 (no mock-mode fallback) exists at all.

Pages compound it by importing `authStorage` directly (`app/admin/dashboard/page.tsx`,
`app/admin/users/page.tsx`, `app/admin/verification/verification-client.tsx`) instead of
reading the token from `AuthProvider`, so storage becomes a de facto global.

### S7 (new) - admin dashboard displays hardcoded values as data

`app/admin/dashboard/page.tsx` renders, as stat cards: "Active roles **1**", "Account status
**Active**", "Portal access **Granted**", and an "Your access" list containing a literal
`<span>Admin</span>`. None of these come from the API. Only "Organizations" (membership
count) and "Total users" (from `/admin/users` pagination) are real. Four of the five tiles
on the primary admin screen are static strings dressed as live metrics. Either derive them
or remove them.

### S8 (new) - `/admin/users` search and filters are page-local, and the counts disagree

`authApi.adminUsers` sends only `page` and `pageSize`. Search, platform-role and email-status
filtering all run client-side over the 50 rows already loaded. Consequences:

- filtering across a multi-page dataset is impossible - a match on page 3 is invisible
- the header still reads "N total users" and "Page 1 of M" from the **unfiltered**
  server pagination while the table shows the filtered subset
- the Slack update's "admin users API with search/filters/pagination" overstates it

The field label ("Search current page") is at least honest. The fix is server-side query
parameters, which Greencubes has to add.

### S9 (new) - the verification queue guesses at its own response shape

`normalizeQueue` probes five possible envelope keys (`cases`, `queue`, `items`,
`verificationCases`, `data`, plus a nested `data`) and three alternative names for each
field, and `authApi.verificationQueue` is typed `unknown`. That defensive code is direct
evidence that no response schema was ever supplied. The filters themselves are sent as real
server-side query parameters, which is correct - the shape is the gap. This is the same
missing route table already listed in "What Greencubes should be asked for", item 4.

### S10 (new) - the admin portal is a separate visual system

Every colour in the 110-line admin block in `app/globals.css` is a raw hex literal -
`#09070c`, `#0d0a11`, `#0f0c13`, `#29232f`, `#bc82ff`, `#f5f2f7` and about thirty more -
with its own radii (4px/5px/6px rather than `var(--radius)`), its own accent purple, and its
own dark ground. It uses none of the semantic tokens
`docs/phase3/01-design-system-production-rules.md` requires (`--brand`, `--accent`,
`--surface`, `--text`, `--muted`, `--border`, `--success`, `--warning`, `--danger`), and it
ignores the theme switcher and `lib/direction-lock.ts` entirely: the admin portal is dark
regardless of the selected Bridge theme.

Dillon's 2026-08-31 direction was "a separate admin panel is fine ... no separate visual
system." A separate palette is exactly a separate visual system. Retokenising it is not a
large change - the layout can stay.

### S11 (new, accessibility) - contrast failures and a removed skip link

Measured against the admin surfaces' own backgrounds:

| Colour | On | Ratio | Used for |
|---|---|---|---|
| `#5f5868` | `#0d0a11` | **2.9:1** | the "WORKSPACE" sidebar section label |
| `#625b69` | `#0d0a11` | **3.0:1** | the signed-in account email in the sidebar |
| `#746d7d` | `#0f0c13` | **3.9:1** | membership metadata, empty states |
| `#756e7e` / `#766e80` | `#0f0c13` | **3.9:1** | card subtitles, the "Admin" role caption |

All are small text (0.61rem-0.8rem), so all four fail WCAG AA 4.5:1. `#81798d` (4.6:1) and
`#837b8c` (4.8:1) pass.

Separately, this rule hides the skip link on every admin page:

```css
.age-gated-content:has(.admin-shell) > .site-header,
.age-gated-content:has(.admin-shell) > .site-footer,
.age-gated-content:has(.admin-shell) > .skip-link { display: none; }
```

Hiding the site header on an admin shell is reasonable. Hiding "Skip to content" is a
WCAG 2.4.1 bypass-blocks regression on a keyboard-heavy screen with a five-item sidebar.
Drop `.skip-link` from that selector list.

### M8-M11 (new, minor)

| # | Item | Detail |
|---|---|---|
| M8 | No `/admin` route | Dillon's 2026-08-31 direction routes admins to `/admin`. Only `/admin/dashboard` exists; `/admin` returns 404 on the live preview. Add a redirect. |
| M9 | `role="alert"` inconsistency | `app/auth/verify-email/page.tsx` renders its error as a bare `<p className="form-error">`. `/login`, `/join`, `/auth/forgot-password` and `/auth/reset-password` all use `role="alert"`. |
| M10 | Recovery tokens arrive in the URL fragment | `app/auth/reset-password/page.tsx` parses `access_token` / `refresh_token` out of `location.hash` - the Supabase recovery pattern. Fragments are not sent to servers and the page calls `history.replaceState` after success, so this is acceptable, but it confirms the identity provider and belongs in the contract. `authApi.resetPassword` also posts the refresh token in the request body. |
| M11 | `AuthProvider` memo dependencies | `useMemo` omits `login` / `logout`, which are re-created on every render, so the context value is stale-by-construction rather than stable. Harmless today; wrap them in `useCallback`. |

Two things the branch gets right that deserve saying: the `?next=` redirect in
`app/login/page.tsx` is properly sanitised against open redirects
(`next.startsWith("/") && !next.startsWith("//")`), and `RequireAuth` guards against double
navigation with a `useRef`. Role-aware navigation, `/unauthorized`, and member-vs-admin
routing on `/login` all match the 2026-08-31 direction.

## Every first-pass claim, adjudicated

| Claim | Verdict |
|---|---|
| Backend 401 on all three routes, unauth and forged bearer | **Confirmed** |
| CORS specific origin + `Vary: Origin` | **Confirmed and strengthened** - genuine three-origin allowlist, bogus origins get no header |
| Strong security response headers | **Confirmed** |
| `POST /auth/login` bad creds returns 401 | **Not re-verified** (read-only pass) |
| typecheck / lint / build pass | **Confirmed** (build emits 43 routes, not 33) |
| `test:phase3` 23 pass / 1 fail | **Confirmed**, same assertion |
| B1 repository pointer rewritten in three files | **Confirmed** - four lines total |
| B2 failing test caused by commented-out `credentials` | **Confirmed** |
| B3 bearer switch never flagged per contract line 37 | **Confirmed**; `Access-Control-Allow-Credentials` absence confirmed as the root cause |
| S1 refresh token in `sessionStorage` | **Confirmed and escalated to B5** |
| S2 six of nine session claims missing incl. `ageEligible` | **Confirmed** against `lib/auth/types.ts` |
| S3 no mock-mode fallback, `/login` breaks unset | **Confirmed** |
| S4 `platformRoles` vs `platformRole` shape mismatch | **Confirmed** |
| M1 commented-out `credentials` in two files | **Confirmed** |
| M2 `next-env.d.ts` edited | **Confirmed**; verified it does *not* break a clean typecheck, so hygiene only |
| M3 lockfile drift, 90 deletions of `libc: ["glibc"]` | **Confirmed** |
| M4 `netlify.toml` trailing newline | **Confirmed** |
| M5 `app/layout.tsx` formatting | **Confirmed** |
| M6 three identical commit messages | **Confirmed** |
| M7 `AuthProvider` wraps every public page | **Confirmed** - `/auth/me` fires on public routes when a session exists |
| Base commit `6d7aed6` | **Corrected** - base is `f548013`; branch is current with `development` |
| No deploy preview (implied by the unchecked PR box) | **Corrected** - `deploy-preview-13--bridge-connected-signal-dev.netlify.app` is live |

## Verdict after re-verification

**Do not merge.** Five blocking items, not three: B1 (repository pointer), B2 (failing
test), B3 (undeclared bearer switch), B4 (`/join` Step 1 replaced), B5 (tokens in browser
storage against a written rule). B2, B3 and B5 collapse into one fix on the Greencubes side
plus one revert on the frontend. B4 is a revert-and-re-add. B1 is settled below.

The backend remains the strongest part of this delivery and the security posture is real.

## D-09 - finalised recommendation

**The canonical repository stays `dillonmohr8777/bridge-software-frontend`.**
`getonthebridge0-max/thebridge` returns 404 to an admin token and `getonthebridge0-max` is
still only a pending invitee. Greencubes must revert all four lines across `CLAUDE.md`,
`CLAUDE_BUILD_SPEC.md`, and `CLAUDE_SESSION_PROMPT.md` before this branch can merge. A
future transfer to a client-owned repository is a reasonable end state, but it is its own
decision, its own commit, and its own decision-log entry - not a line edit inside a feature
branch.
