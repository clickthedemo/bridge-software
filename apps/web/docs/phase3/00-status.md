# Phase 3 — Promotion, protected profile, and Tori feedback reconciliation

**Opened:** 2026-08-19

**Expanded:** 2026-08-20

**Entry requirement restored:** 2026-08-21

**Status:** FRONTEND REVIEW BUILD LIVE — the required 21+ entry gate was restored to the existing Connected purple review URL on 2026-08-21. The typed contract, mock adapter, Create / My Profile journeys, transcript feedback surfaces, and contract tests remain in place. Live `/api/v1` binding still waits on Miraj's inspectable staging origin.

## August 20 feedback pass

The Connected purple direction, existing typography, exact Bridge mark, and core Home, Community News, Create, My Profile, and Explore product remain intact. The review build now also includes:

1. Unmistakable legal cannabis positioning and a single primary join action on first impression
2. Media rich Community News with category, state, favorites, visual grid, and classic feed controls
3. Nationwide sample discovery for brands, dispensaries, retailers, sales representatives, cultivators, manufacturers, laboratories, transport, cannabis aware banking, service trades, media, and hydroponics
4. Visual product and service categories plus California to Michigan cross market discovery cues
5. Rich profiles with products, capabilities, menu preview, ordering state, directions, channels, and recent activity
6. Three purple creative directions, local draft and library actions, review routing, and PNG preview export
7. A required first login and monthly sales and accounting contact confirmation gate
8. Clearly labeled pricing and Bridge League concept pages for Tori's review
9. Grain animation and slow editorial image movement using the approved Bridge editorial treatment, with reduced motion support
10. A global 21+ entry confirmation that blocks underage access before any route and remembers an affirmative confirmation on that device

Full transcript reconciliation: `docs/phase3/03-tori-feedback-reconciliation.md`.
Unsent communication drafts: `docs/phase3/04-message-drafts.md`.

## Why this is Phase 3 now

Phase 2's five-route frontend is technically complete and live. That product stays intact: the 2026-08-16 report routes and the Phase 1 integrations instituted with Tori. The review visual is Connected purple, not Trusted Current navy/teal. The next contracted product/UX lane is Phase 3: productionize the first vertical slice against typed claims, upload intent, audience persistence, and profile projections.

Locked slice for this implementation:

1. Targeted **Promotion** creation
2. **Protected profile projection** plus required first-login and monthly contact confirmation

Still outside the production contract: live nationwide data, algorithmic ranking, subscriptions and payments, in-platform ordering, EIN document handling, production auth UI, and third party provider integrations. Some are represented as clearly labeled review concepts only.

## Adapter contract

Default: in-memory `MockPhase3Client`.  
Live bind: set `NEXT_PUBLIC_BRIDGE_API_BASE` to Miraj's versioned origin. The HTTP client then calls:

| Behavior | Method | Path |
|---|---|---|
| Session claims | GET | `/api/v1/session` |
| Upload intent | POST | `/api/v1/uploads/intent` |
| Persist post | POST | `/api/v1/posts` |
| List posts | GET | `/api/v1/posts` |
| Profile projection | GET | `/api/v1/profiles/current?view=public\|protected` |
| Confirm contacts | POST | `/api/v1/contacts/confirm` |
| Update contacts | PATCH | `/api/v1/contacts` |

Those paths are the frontend proposal from the Phase 2 Miraj handoff. They are not accepted as Miraj's final routes until he returns repository, branch, commit, and staging evidence.

## Claims required

`userId`, `ageEligible`, `membershipStatus`, `organizationId`, `organizationVerificationState`, `role`, `delegatedPermissions`, `stateLicenseEligibility`, `adminScope`.

Promotion create requires an active membership, a verified organization, and `create_promotion`. Protected projection requires `view_protected_profile`. Contact confirmation and contact updates require `confirm_contacts`.

## Server rules the UI now shares

- PNG / JPEG / WebP / PDF, 25 MB max
- Upload intent is requested when a valid file is selected, not only at publish
- Protected wholesale detail cannot target Adults 21+
- Publish requires a message and at least one remaining eligible audience
- This vertical slice publishes Promotion records only; Update and Event remain outside the active permission contract
- Stale upload-intent responses are ignored, and failed intents can be retried without reselecting the file
- A successful publish is never reported as failed just because the subsequent list refresh fails
- Published posts persist on the organization; Public view hides protected promotions
- Public projection never includes sales/accounting contacts
- Contacts can be updated, then confirmed; confirmation records actor, time, and next-due (+30 days)

## Verification

```bash
npm run test:phase3
npm run typecheck
npm run lint
npm run build
```

Internal walkthrough: `docs/phase3/02-dillon-deliverable.md`.

The approved 21+ gate restoration is deployed at `https://bridge-connected-signal.netlify.app` as Netlify deploy `6a88e3ac3974a1b866ed5383`. Do not bind a live API origin without Miraj's inspectable staging URL. Do not Slack or email the client from this slice without separate approval.
