# Bridge frontend integration source

Canonical private integration source for Greencubes. This is the Next.js frontend published at https://bridge-connected-signal.netlify.app.

Start here:

- Pipeline, branch rules, access, and deploy URLs: `docs/INTEGRATION-PIPELINE.md`
- Exact frontend API adapter and onboarding Steps 1–4 contract: `docs/INTEGRATION-API-CONTRACT.md`
- Contribution and verification workflow: `CONTRIBUTING.md`

- Branch from and merge daily work into `development`; Netlify deploys it to the preview site.
- Open a pull request from `development` to `production` only after preview QA; Netlify deploys `production` live.
- Keep the current Connected purple visual design and wire APIs into the existing screens.
- Set `NEXT_PUBLIC_BRIDGE_API_BASE` only after Greencubes provides an inspectable versioned API origin. Until then the frontend intentionally uses the in-memory adapter.

# Product and prototype history

A decision-ready front-end prototype for Monday's product session with Tori. It is built in Next.js, React, and TypeScript and uses mock data only.

> **Project identity:** This is the Bridge software-development project for Tori's cannabis-industry professional network. It is not Bridge of Hope OTC, an SEO audit, or the user's general client-meeting workspace. Claude should read `CLAUDE.md` before using external memory or asking discovery questions.

## Starting an implementation session

Connect the implementation tool to the private repository `dillonmohr8777/bridge-software-frontend`. Start feature work from `development`, not from the historical public prototype. `CLAUDE_SESSION_PROMPT.md` contains a current integration prompt; `CLAUDE_BUILD_SPEC.md` remains historical product-definition context and does not override the integration pipeline or API contract.

## What is included

Phase 2 five-route product (2026-08-16 actual-work report), in Connected purple:

- `/` Home, `/community` Community News (News Grid + Classic), `/create` Create, `/my-profile` My Profile, `/explore` Explore
- Global 21+ entry confirmation before any route, with an under-21 blocked state and device-local affirmative persistence
- Legacy redirects: `/studio` → Create, `/business` → My Profile, `/signal` → Explore
- Create: PNG/JPEG/WebP/PDF up to 25 MB, multi-audience, protected-detail guardrail
- My Profile: Public vs verified-business, sales/accounting contacts, 90-day confirmation
- Explore: search, composable filters, 50 states + D.C., local favorites, permissioned introductions

Phase 1 surfaces that remain in this same app:

- Working search, role, and verification filters (`/directory`, `/explore`)
- Role selection/onboarding (`/join`)
- Member profile and permission-based contact request (`/profile/<slug>`)
- Brand dashboard and admin verification queue
- Three switchable visual directions on unlocked builds; unified review URL stays Connected
- Provisional brand kit and reusable design-system page
- Monday meeting package, product definition, evidence audit, and Claude workflow

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. Important routes:

- `/` — Home
- `/community` — Community News (News Grid / Classic)
- `/create` — Phase 3 targeted Promotion slice (upload intent on file select, persisted audiences)
- `/my-profile` — Phase 3 protected profile projection (contact edit, 90-day confirm, Public vs B2B)
- `/explore` — search, filters, favorites, introductions
- `/directory` — Phase 1 directory (also reachable from Explore)
- `/join`
- `/profile/cascade-canna` (any member: `/profile/<slug>`)
- `/dashboard`
- `/admin/verification`
- `/directions`
- `/design-system`

## Staging previews (one link per direction)

Three static, direction-pinned copies of this prototype are hosted for side-by-side comparison. Each hides the theme switcher, labels itself "Provisional preview", and sends `noindex`; none is an approved identity.

- Trusted Current — https://bridge-preview-current.netlify.app
- Modern Network — https://bridge-preview-network.netlify.app
- Botanical Ledger — https://bridge-preview-botanical.netlify.app

Rebuild all three with `./scripts/build-staging.sh` (outputs to `staging/<direction>/`), then redeploy each folder to its Netlify site (zip deploy via the Netlify API, or drag-and-drop in the Netlify UI).

## Status and boundaries

Phase 3 frontend lock is complete on the Promotion + protected-profile slice. `/create` and `/my-profile` use typed claims, upload-intent, post, projection, and contact adapters in `lib/phase3/`. The default visual direction is Modern Network (Connected purple). A live `/api/v1` bind requires `NEXT_PUBLIC_BRIDGE_API_BASE` plus Miraj's inspectable staging origin. Republishing `https://bridge-connected-signal.netlify.app` must keep Modern Network, not Trusted Current navy/teal.

There is still no production Supabase session, email delivery, or real license verification. All profiles and metrics are fictional. The brand identity is provisional.

## Verification

```powershell
npm run test:phase3
npm run typecheck
npm run lint
npm run build
npm run build:staging
npm run test:staging
```

`build:staging` creates three direction-pinned static builds under
`staging/current`, `staging/network`, and `staging/botanical`. The verification
command checks the expected routes, provisional label, theme lock, and noindex
metadata before a staging upload. Netlify's three connected projects use the
single-direction commands so each project builds only its assigned preview.
# bridge-software-frontend
