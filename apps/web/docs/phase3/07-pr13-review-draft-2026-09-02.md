# PR #13 review — DRAFT, NOT POSTED

**Status: DRAFT — NOT POSTED.** This is the exact text that would be submitted as a
"Request changes" review on `dillonmohr8777/bridge-software-frontend#13` if and when Dillon
approves posting it. Nothing has been posted to GitHub. No comment, no review, no merge.

- PR: #13 "Feature/admin login", `feature/admin-login` → `development`
- Head reviewed: `fde9cf035ba011592a997fb33fbd99c44c1bcc1b`
- Base: `f548013a2f6985a8be5c52de8338abaa67c81e85`
- Evidence behind every claim: `docs/phase3/06-greencubes-integration-review-2026-09-02.md`

---

## Draft review body

Thanks Miraj — this is a substantial delivery and the backend is the strongest part of it.
I verified the security posture independently against `bridge-software-backend.onrender.com`
and it holds up: `/api/v1/auth/me`, `/api/v1/admin/users` and `/api/v1/admin/verification-queue`
all return `401` both unauthenticated and with a forged `Bearer` token, the CORS allowlist
echoes exactly the three contract origins and returns no header at all for an unknown origin,
and the response headers (HSTS, CSP, `nosniff`, `no-referrer`, COOP/CORP, `X-Frame-Options`)
are correct. Server-side RBAC is real, which is what I asked for on 31 August. `typecheck`,
`lint` and `build` all pass locally on `fde9cf0`.

Five things block the merge into `development`. Three of them are one fix.

**1. The repository pointer was changed in this branch.** `9f5fa49` rewrites
`dillonmohr8777/bridge-software-frontend` to `getonthebridge0-max/thebridge` in `CLAUDE.md`,
`CLAUDE_BUILD_SPEC.md` and `CLAUDE_SESSION_PROMPT.md` (four lines). `getonthebridge0-max/thebridge`
returns 404 to my admin token and `getonthebridge0-max` is still a pending invitee, so it
cannot be canonical today. Canonical stays `dillonmohr8777/bridge-software-frontend`. Please
revert those four lines. If the client wants to own the repository later, that is a separate
decision, a separate commit, and a decision-log entry — not a line edit inside a feature branch.

**2. `npm run test:phase3` fails on this branch.** 23 pass, 1 fail:
`http client sends credentialed requests to the versioned API origin`
(`lib/phase3/phase3.test.ts:306`), because `fde9cf0` comments out `credentials: "include"` in
`lib/phase3/http-client.ts`. `CLAUDE.md` and `CONTRIBUTING.md` both list that command as a
required gate.

**3. The switch to bearer tokens was never flagged.** `docs/INTEGRATION-API-CONTRACT.md`
line 37 says: if Greencubes uses bearer tokens instead of cookie sessions, flag that contract
change before changing the frontend client. The commit message reads as a fix; it is an
architecture change. And it is avoidable in its current form — the API already returns a
specific origin with `Vary: Origin`, so credentialed requests fail only for the want of
`Access-Control-Allow-Credentials: true`, which is absent on both the simple responses and
the `OPTIONS` preflight. Adding that one header restores cookie support and clears items 2,
3 and 5 together. If you would rather stay on pure bearer tokens, say so explicitly and I
will record it as an accepted risk with a short access-token TTL and server-side revocation.

**4. `/join` Step 1 was replaced rather than integrated.** `app/join/join-form.tsx` drops the
twelve-role selection grid (Brand, Dispensary, Retailer, Sales rep, Cultivator, Manufacturer,
Lab, Transport, Bank, Service, Media, Hydroponics), the per-role requirements copy, the
"Step 1 of 4" framing, the founding-member pricing callout, and the boundary note, and puts a
plain email/password signup card in their place. `docs/INTEGRATION-PIPELINE.md` says "Do not
restyle the product or replace screens while integrating" and "Keep the current visual design";
the API contract says the existing screens are the design authority. That screen is also the
one Melissa and Tori are still approving, and it is the only place the product captures a
member's role, which the organization-onboarding and verification slices both need. The
registration form itself is good work — 409 handling, password policy, confirmation state,
resend link. Please add it as its own screen or as a step ahead of role selection, and restore
`/join`.

**5. Access and refresh tokens are written to `sessionStorage`.** `lib/auth/storage.ts` stores
the whole session, including the refresh token, under `bridge_session`.
`docs/INTEGRATION-PIPELINE.md` states: never place access tokens in browser storage. Any XSS
on any Bridge page reads the long-lived credential. The refresh token should live in an
httpOnly, Secure, SameSite cookie with only the access token in memory — which is the same fix
as item 3.

### Should fix before this goes to production

- **Session claims.** The contract lists nine required claims; `/auth/me` supplies about four.
  `ageEligible` is missing and Bridge runs a 21+ gate, so there is currently no
  server-authoritative age signal. `membershipStatus`, `organizationVerificationState`,
  `delegatedPermissions`, `stateLicenseEligibility` and `adminScope` are also absent.
- **No mock-mode fallback.** `lib/auth/api.ts` computes its base at module scope with no
  in-memory branch, so with `NEXT_PUBLIC_BRIDGE_API_BASE` unset, `/login` posts to the Netlify
  origin, 404s, and shows "The request could not be completed." `lib/phase3/client.ts` handles
  this correctly; the auth layer should either match it or fail loudly at startup.
- **The refresh token is stored but never used.** No refresh call, no expiry check, no
  401-triggered re-auth. When the access token expires, `/admin/users` renders the raw backend
  string "A valid Bearer access token is required." into the admin UI.
- **Two HTTP clients now exist.** `lib/auth/api.ts` bypasses `lib/phase3/` entirely, so it
  inherits none of the contract's status mapping (401/403/400/422/409). Pages also import
  `authStorage` directly instead of taking the token from `AuthProvider`.
- **Shape mismatch.** `/auth/me` returns `platformRoles: "admin"[]`; `/admin/users` returns
  `platformRole: string | null`. Same concept, two names, two shapes.
- **`/admin/users` filtering is page-local.** Only `page` and `pageSize` reach the API; search
  and the role/status filters run over the 50 loaded rows, so a match on page 3 is invisible,
  and the "N total users / Page 1 of M" header reports unfiltered numbers above a filtered
  table. Server-side query parameters would fix it.
- **The verification queue guesses its own response shape.** `normalizeQueue` probes five
  possible envelope keys and three alternative names per field because no response schema was
  supplied. Please send the route table and response examples.
- **Admin dashboard tiles are hardcoded.** "Active roles 1", "Account status Active", "Portal
  access Granted" and the "Admin" chip are static strings, not API values. Derive them or
  remove them.
- **The admin portal is a separate visual system.** The new CSS block uses ~35 raw hex colours
  and its own radii instead of the semantic tokens in `app/globals.css`, and it ignores the
  theme switcher. A separate admin panel is fine; a separate palette is not. Retokenising it
  does not require changing the layout.
- **Accessibility.** Four sidebar/card text colours fail WCAG AA at their own backgrounds —
  `#5f5868` (2.9:1), `#625b69` (3.0:1), `#746d7d` and `#756e7e` (3.9:1) — all at 0.61–0.8rem.
  Separately, the admin shell hides `.skip-link` along with the header and footer; hiding the
  skip link is a 2.4.1 bypass-blocks regression. Also, `app/auth/verify-email/page.tsx` is the
  only auth screen whose error paragraph lacks `role="alert"`.

### Small things

`credentials: "include"` is commented out rather than removed in two files. `next-env.d.ts`
was edited (the file says not to). `package-lock.json` shows 90 deletions stripping
`libc: ["glibc"]`, the signature of `npm install` on an older npm — please revert and re-run.
`netlify.toml` lost its trailing newline. `app/layout.tsx` has two collapsed JSX lines. Three
commits share the message "Complete admin login implementation" — worth squashing. `/admin`
itself 404s; only `/admin/dashboard` exists, so please add a redirect. And the PR template's
preview-deploy box is unchecked even though `deploy-preview-13--bridge-connected-signal-dev.netlify.app`
is live — please tick the template boxes and link it.

### What I need back

1. Confirmation that the repository pointer will be reverted.
2. `Access-Control-Allow-Credentials: true` on the API — or an explicit decision to stay on
   pure bearer tokens so I can record it.
3. The remaining session claims, with `ageEligible` first.
4. The route table and request/response examples for `/auth/register`, `/auth/login`,
   `/auth/me`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/resend-verification`,
   `/admin/users` and `/admin/verification-queue`. The contract still lists these as
   "to confirm".
5. Access-token TTL and the refresh/rotation policy.
6. Backend repository, branch and commit for this deploy, and confirmation that `/api/v1` is
   the stable prefix. Related: `/health` reports `thebridge-api` while `/api/v1/health`
   reports `bridge-api` — are those the same service?

Product approval for Join Steps 2 and 4 still sits with Melissa and Tori and is unchanged by
this review.
