# Bridge frontend integration API contract

Date: 2026-08-31
Audience: Greencubes engineering and Bridge product/QA

This document maps the existing frontend to the backend work Miraj described in Milestone 3. It is the current integration handoff, not a claim that unverified product-policy decisions are final.

## Why `/join` shows Step 1 but not Steps 2–4

The current `/join` screen implements role selection as **Step 1 of 4**. Its Continue action intentionally displays a boundary note instead of pretending to save data. Steps 2–4 require a real member identity, organization-scoped draft persistence, protected evidence storage, and a review case. Those are backend-owned capabilities.

This is not a missing route or a Netlify problem. The correct integration sequence is:

1. Connect registration, login, email verification, password reset, and session claims.
2. Persist role-specific organization details as an organization-scoped onboarding draft.
3. Upload verification evidence through server-created upload intents; scan it and expose processing state.
4. Return a redacted review summary, submit the verification case, and expose its lifecycle to the member and admin queue.

The existing Connected purple screens are the design authority. Integrate into them; do not replace or restyle them.

## Runtime switch

`lib/phase3/client.ts` selects the HTTP adapter only when this public browser variable is configured:

```text
NEXT_PUBLIC_BRIDGE_API_BASE=https://api.example.com
```

The value is an origin only. `HttpPhase3Client` appends `/api/v1/...`. The adapter sends `credentials: include` so cookie-based sessions can work across the exact allowed frontend origins.

Required CORS origins:

- `https://bridge-connected-signal-dev.netlify.app`
- `https://bridge-connected-signal.netlify.app`
- the agreed local development origin, normally `http://localhost:3000`

If cookies are used, the API must return a specific `Access-Control-Allow-Origin`, not `*`, and allow credentials. Mutating endpoints also need the agreed CSRF protection. If Greencubes uses bearer tokens instead, flag that contract change before changing the frontend client.

## Existing implemented frontend endpoints

These paths and payloads are already called by `lib/phase3/http-client.ts`.

| Method | Path | Request | Success response |
| --- | --- | --- | --- |
| `GET` | `/api/v1/session` | none | `SessionClaims` |
| `POST` | `/api/v1/uploads/intent` | `{ fileName, mimeType, sizeBytes }` | `UploadIntent` |
| `GET` | `/api/v1/posts` | none | `PostRecord[]` |
| `POST` | `/api/v1/posts` | `CreatePostInput` | `PostRecord` |
| `GET` | `/api/v1/profiles/current?view=public|protected` | query | `ProfileProjection` |
| `PATCH` | `/api/v1/contacts` | `UpdateContactsInput` | `ProfileProjection` |
| `POST` | `/api/v1/contacts/confirm` | `{ organizationId }` | `ConfirmContactsResult` |

The normative TypeScript shapes are in `lib/phase3/types.ts`. Greencubes should map its existing routes to these paths or submit a small typed adapter change with the backend route table.

HTTP status mapping expected by the frontend:

- `401` unauthenticated
- `403` authenticated but forbidden
- `400` or `422` validation
- `409` stale/conflicting record
- other failures unavailable/retryable

Successful JSON must use stable camelCase fields matching the checked-in types. A `204` response is allowed only where no response body is required.

## Required session claims

Every protected request must be authorized server-side from the session, never from a disabled control or browser-provided claim:

- `userId`
- `ageEligible`
- `membershipStatus`: `none | pending | active | suspended`
- `organizationId`
- `organizationVerificationState`: `unverified | pending | verified | changes_requested | rejected`
- `role`
- `delegatedPermissions`
- `stateLicenseEligibility`
- `adminScope`

The server must reject protected profile reads, uploads, publishing, contact changes, verification decisions, and admin actions when those claims do not permit them.

## Steps 1–4 onboarding contract to confirm

Greencubes already owns auth, RBAC, EIN intake, and the admin verification queue. Before wiring `/join`, provide the actual route table for these behaviors. The frontend needs the following capabilities; names below are a capability map, not permission to duplicate working backend routes.

### Step 1: member account and role

- Register account and verify email.
- Log in, log out, request reset, and complete reset.
- Create or resume one onboarding draft for the authenticated member.
- Persist selected role and return the current step.
- Return the session claims above after authentication.

### Step 2: organization details

Persist a draft containing the role-appropriate subset of:

- legal and public organization names
- organization type and selected member role
- EIN intake status; never return or log a full EIN after submission
- licenses/permits and jurisdiction
- locations and service markets
- responsible contact owner
- role-specific fields documented by the existing `/join` role cards

The response must include a draft ID, organization ID, optimistic-concurrency version, saved timestamp, validation errors, and next eligible step.

### Step 3: verification evidence

- Create an upload intent scoped to the authenticated organization and verification case.
- Upload directly to protected storage using a short-lived server-issued target.
- Validate type and size, scan for malware, and expose `accepted | processing | rejected | ready` state.
- Store document category, jurisdiction, expiration date when applicable, and a server-generated evidence ID.
- Never expose raw protected evidence in public profile responses or unredacted logs.

### Step 4: review and submit

- Return a redacted review summary for the current member.
- Block submission until required fields and evidence are ready.
- Create or update a verification case on submit.
- Return a stable lifecycle: `draft | submitted | in_review | changes_requested | verified | rejected`.
- Record actor, time, reason code, and audit event for submission and every admin decision.
- Expose only safe change-request guidance to the member; keep internal reviewer notes private.

## Admin verification queue

The existing `/admin/verification` screen is currently fictional. The backend integration needs:

- paginated cases with organization, type, market, status, age, and assignment
- case detail with protected evidence references and scan state
- approve, request-changes, and reject actions with confirmation and reason codes
- role checks for Platform Admin and any delegated reviewer scope
- immutable audit events for views and decisions
- safe empty, loading, error, conflict, and stale-record behavior

## Security and data rules

- Authorization and organization isolation are enforced in the API and Supabase RLS.
- The client never receives service-role keys or database credentials.
- Full EINs, verification files, and protected contacts never appear in URLs, analytics, public projections, or routine logs.
- Uploads use short-lived intents and are not public until policy explicitly allows a public derivative.
- Protected-detail posts cannot target the public Adults 21+ audience; the server enforces this even if the client is modified.
- Public profile projections must omit responsible contacts and all protected verification data.
- Production and staging data, storage, cookies, and environment variables remain separated.

## Greencubes handoff evidence needed

Before Dillon can bind the preview site to the API, Miraj should provide:

1. Backend repository, branch, and commit.
2. Staging API origin plus `/health` and `/version` responses.
3. Actual auth and onboarding route table mapped to the capabilities above.
4. Example redacted success/error payloads for session, onboarding draft, upload status, review submission, and admin decision.
5. CORS/cookie or bearer-token decision and CSRF behavior.
6. Supabase migration and RLS test evidence for identity, organization isolation, and protected records.
7. A test account matrix for member roles and an admin reviewer, with secrets transferred through an approved vault rather than Slack or Git.

## Frontend acceptance test

The preview integration is ready for production review only when all of these pass:

- registration, verification, login, logout, and reset
- session claims and role denial paths
- save/resume across Steps 1–4
- organization validation and EIN redaction
- evidence upload, scan, rejection, retry, and ready state
- redacted review summary and submission lifecycle
- admin queue and decision audit trail
- public vs protected profile projection
- current Phase 3 tests, typecheck, lint, production build, desktop/mobile QA, and browser error review

Until an API origin and these contract details are supplied, both Netlify sites correctly remain in mock mode.
