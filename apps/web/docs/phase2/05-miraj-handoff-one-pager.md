# Bridge — Miraj Handoff (Phase 2 → Phase 3 contract input)

**Original date:** 2026-08-06
**Integration route refreshed:** 2026-08-31
**From:** Dillon (product / UX / front-end)  
**To:** Miraj (backend / platform)

## Truthful front-end status

- Product definition (route map, role/visibility matrix, journeys + acceptance, backlog, this contract) is complete and lives in this repo under `docs/phase2/`.
- The **reviewable interactive prototype** (five routes with feed comparison, Create upload + multi-audience + protected guard, Public/B2B profile + contacts, Explore filters/favorites) is live at:
  **https://bridge-connected-signal.netlify.app** (noindex,nofollow).
- The unified URL serves the canonical Next.js Connected purple application from the private integration repository `dillonmohr8777/bridge-software-frontend`.
- The validated Kimi static suite remains historical product and visual evidence. It is no longer the deployed frontend owner.
- `/studio`, `/business`, and `/signal` remain compatible links and redirect to `/create`, `/my-profile`, and `/explore`.

## Entities to model
`User`, `Organization`, `Membership`, `RoleGrant`, `Verification`, `ProfileField`, `ResponsibleContact`,  
`Post`, `Asset`, `Audience`, `PostAudience`, `ModerationState`,  
`ExploreRecord`, `Location`, `Category`, `Product`, `Brand`, `Strain`, `Favorite`,  
`IntroductionRequest`

## Auth claims required
user ID, age eligibility, membership status, organization ID, organization verification state, role, delegated permissions, state/license eligibility, admin scope.

## API behaviors for vertical slice (Promotion + protected profile)
1. Return current user + verified authorization claims  
2. Create upload intent; validate type/size; scan; return processing state  
3. Persist post with one or more audiences; reject protected content targeted at public  
4. Return public vs protected profile projections  
5. Record responsible-contact confirmation (actor, time, next-due)  
6. Search Explore with filters + favorite state  
7. Create permissioned introduction request without revealing protected contacts  

## Storage / uploads
PNG, JPEG, WebP, PDF; max 25 MB in prototype rules; malware scan + processing state in production.

## Audience rules
Multi-select; protected detail disables Adults 21+; **server must enforce**.

## Recommended first vertical slice
Targeted Promotion creation + protected profile projection.  
Proves: identity/claims, upload intent + scan + storage, multi-audience rules, public vs B2B projection, contact confirmation + next-due, audit events.  
Explicitly out of slice: full nationwide marketplace, live menus/orders, production auth UI, EIN verification flow, algorithmic feed.

## Non-goals for this handoff
Live marketplace data, production billing, HR module, final legal policy text, real auth in the current prototype.

## Ask from Miraj
1. Provide the exact repository, branch, commit, and staging endpoint for inspection.
2. Confirm or revise API behaviors and claims model against the matrix.
3. Provide migrations and RLS test evidence for identity, roles, and protected records.
4. Confirm upload, storage, scanning, audience persistence, profile projection, contact confirmation/reminder, search/favorites, introduction request, and audit event contracts.
5. Provide current `/health` and `/version` evidence and the first staging vertical-slice availability or delivery date.
6. Identify any contract mismatch or blocker rather than treating this checklist as acceptance.

Full product contract: `docs/phase2/phase2-product-contract.md`
Current pipeline: `docs/INTEGRATION-PIPELINE.md`
Current API and onboarding contract: `docs/INTEGRATION-API-CONTRACT.md`
Historical status note: `docs/phase2/00-status-and-reconciliation.md`
