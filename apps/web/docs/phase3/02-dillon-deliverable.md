# Dillon Phase 3 deliverable — Tori feedback reconciliation

**Date:** 2026-08-20
**Status:** FRONTEND REVIEW BUILD COMPLETE LOCALLY — internal review only. Do not Slack, email Tori/Melissa/Mac/Miraj, or update Netlify without separate approval.
**PR:** https://github.com/dillonmohr8777/bridge-discovery-prototype/pull/6

This is Dillon's frontend lock for the contracted Phase 3 vertical slice: targeted Promotion create plus protected profile projection, on the existing Phase 1/2 five-route Connected product. It is not a new app, not the Kimi suite, and not Trusted Current navy/teal. It is not Tori formal brand acceptance and not Miraj's live `/api/v1` bind.

Visual default: Connected purple using the dark network tokens in `app/globals.css`, the existing typography, and the exact `public/bridge-mark.svg`. Product inventory remains Home, Community News, Create, My Profile, and Explore, with supplemental pricing and Bridge League concept routes; legacy Studio/Business/Signal redirects; Phase 1 directory, join, profile, dashboard, admin, contact, and search.

## What shipped

| Surface | Journey | What to demo |
|---|---|---|
| `/create` | C | Promotion, upload intent on file select, PNG/JPEG/WebP/PDF ≤25MB, audiences, protected detail strips Adults 21+, publish blocked with no audience or empty message, preview access level, persisted posts |
| `/my-profile` | D | Mandatory first-login and monthly gate, sales + accounting in B2B, edit then save, confirm cycle, Public hides contacts and protected promotions, no EIN |
| `/community` | Content discovery | Media rich cannabis news, promotions, events, market signals, service updates, visual categories, state filters, favorites, and two feed layouts |
| `/explore` | Nationwide discovery | Sample search, state and category controls, visual category rail, featured markets, favorites, cross market signal, and broader industry roles |
| `/profile/[slug]` | Member utility | Products, services, menus, ordering state, directions, channels, recent activity, and market signals |
| `/pricing` | Commercial concept | Clearly labeled first six months free and $349 founding business discussion for Tori's decision; no billing |
| `/league` | Cooperative concept | Private participation and recognition without public rankings; reward mechanics require Tori's decision |
| `/design-system` | Production rules | Six mutation states using existing tokens/classes |
| `lib/phase3/` | Contract | Claims, upload intent, posts, projections, contact update/confirm, mock + HTTP clients |

## Demo script

1. Open `/create` as Harbor Dispensary (in-memory adapter).
2. Attach a PNG. Confirm upload intent is requested before Publish.
3. Enable protected wholesale detail. Adults 21+ is removed and labeled.
4. Publish. The record appears under Persisted promotions.
5. Adapter controls: simulate a network failure, then retry. Toggle unverified organization and confirm publish is forbidden.
6. Open `/my-profile` B2B. Complete the mandatory first-login review, edit a contact, save, then confirm. The next due date should be 30 days later.
7. Switch Public view. Contacts disappear. Protected promotions disappear. No EIN.

## How to verify

```bash
npm run test:phase3
npm run typecheck
npm run lint
npm run build
```

Local UI: `npm run dev` then `/create` and `/my-profile`.

## Gated on purpose

- Live `NEXT_PUBLIC_BRIDGE_API_BASE` — wait for Miraj repository, branch, commit, and staging URL
- Netlify update of https://bridge-connected-signal.netlify.app
- Slack or client send
- Tori written accept/revise on the five Phase 2 routes
- Live nationwide data, ranking, subscriptions, payments, in-platform ordering, EIN docs, production auth UI, and third party provider integrations

Proposed HTTP paths (`GET /api/v1/session`, `POST /api/v1/uploads/intent`, `POST|GET /api/v1/posts`, `GET /api/v1/profiles/current`, `POST /api/v1/contacts/confirm`, `PATCH /api/v1/contacts`) are a frontend proposal, not Miraj-confirmed.
