# Bridge connected redesign and MVP recovery

Observed September 12, 2026. This record supersedes dated claims that the backend location is unknown. It does not certify authenticated production acceptance.

## Verified destination and ownership

- Frontend: `dillonmohr8777/bridge-software-frontend`.
- Connected site: `https://bridge-connected-signal.netlify.app`, Netlify ID `3087fe90-74de-40ee-b4dc-042afe1bc8ae`, linked to `production`.
- Development: `https://bridge-connected-signal-dev.netlify.app`, ID `74244ea7-dc7f-4748-9b20-9b0cc3898b36`, linked to `development`.
- Starting published production commit: `6d7aed66ae84ec07fb6ad6a93a2dc53d1dc0c6b9`. Starting development commit: `f548013a2f6985a8be5c52de8338abaa67c81e85`.
- Only development currently configures `NEXT_PUBLIC_BRIDGE_API_BASE`, pointing to the Greencubes staging backend. Preserve the production/staging boundary.
- Backend source: `https://github.com/clickthedemo/bridge-software-backend`, `main`, `5da54867ed5f4f5c01f2b451f9f4cf1d0b4cac34`. Source cloned for inspection, not modified.
- Backend origin: `https://bridge-software-backend.onrender.com`. `/api/v1/health` returns healthy; `/api/v1/version` identifies staging version 0.1.0. Unauthenticated `/api/v1/session` and `/api/v1/auth/me` return 401. Credentialed CORS allows the exact development and production frontend origins and localhost:3000. These checks do not prove a successful login or authorization isolation.

## Recovered implementation

- Redesign source tip `3c5977c`, transferred onto connected production baseline as `5bbdd6b`.
- Cookie authentication PR 16 at `a26d39d7fc9ce69f5a55c6bbf9c7c9a867011e7c` combined with the redesign locally. Preserve its endpoints, cookie client, CurrentUser/membership shape and admin routes.
- Earlier `54bf2c9` hardening reviewed selectively for session failure, safe return routes, stale response handling and sign out behavior. Do not merge its competing adapter wholesale.
- Claude social work `6dd091a` and mock feed persistence `41ad779` are reusable visual/interaction work, not proof of durable backend features.

## Milestone acceptance map

Contract terminology follows the final-proposal reconciliation at `clients/bridge-software/deliverables/2026-09-02-phase-and-proposal-map/phase-map.md`. That document did not retrieve the signed PDF, so contractual verification remains limited to its cited final proposal and correspondence. Engineering phases in CLAUDE_BUILD_SPEC.md use different numbering.

| Milestone | Outcome | Current boundary |
| --- | --- | --- |
| 4: Directory MVP | Search/filter real member profiles, business details, territory, product/categories, logo and visibility | Existing directory uses sample records. Inspected backend does not mount a public directory/profile service. |
| 4 | Authorized profile editing | Existing backend creates, lists and edits member organizations, with name and organizationType only. This is a useful integration slice, not the complete profile contract. |
| 4 | Claims and corrections | No corresponding mounted route found in inspected backend. |
| 4 | Persisted contact requests and email notifications | Existing frontend simulates requests; no matching mounted backend service found. |
| 3 prerequisite | Onboarding steps 2 to 4 and verification | Organization and EIN services exist. Protected evidence upload, review-summary and case-submission contracts still require confirmation. |
| 5: Early Engagement | Verified-profile posts, updates/news, saved profiles, notifications | Recovered frontend includes post modes and local interaction state. Current backend router does not mount the proposed posts, favorites or notifications services. |

Do not treat member-owned `GET /organizations` as the public directory. Its scope is the authenticated user's memberships. Do not manufacture successful submissions, store private records in browser storage or map unsupported roles silently to business types.

## Release checks

1. Combine design and authentication without changing staging/production API settings.
2. Run regression tests, typecheck, lint and production build.
3. Inspect responsive routes and protected-route behavior on preview.
4. Promote only the inspected revision; record Git and Netlify receipts separately.
5. Keep unimplemented backend capabilities pending until a verified contract and actual end-to-end readback exist.

## Team follow-up

Dillon authorized a factual follow-up to Miraj. The Slack connector refused sending to the externally shared channel. A draft was saved as `Dr0C1DEZLUNA` in `C0BGWRK03B2`; nothing sent. It asks for current onboarding/directory/contact contracts and EIN provider status. Backend source was independently located after that draft was composed.
