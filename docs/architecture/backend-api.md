# BRIDGE Backend API Architecture — Milestone 2

## Runtime

- Node.js
- TypeScript
- Express
- Supabase/PostgreSQL
- Zod for runtime validation

## API base

All application API routes use:

/api/v1

Health remains outside the versioned application API:

/health

## API boundaries

### Auth

Responsible for authentication/session-related API concerns.

Authentication itself is provided by Supabase Auth.

### Users

Application-level user/profile operations.

### Organizations

Organization and membership operations.

### Profiles

Public and controlled business/profile projections.

### Verification

Verification cases, verification items, review operations, and protected verification workflows.

### Storage

Controlled document upload/download metadata and storage operations.

### Audit

Internal audit event recording and controlled audit retrieval.

### Promotions

Promotion/business-content operations. Authorization must be evaluated before publishing or exposing content.

## Request pipeline

HTTP request:

Express
  -> security middleware
  -> identity resolution
  -> authorization
  -> validation
  -> route handler
  -> service
  -> repository/data access
  -> response

## Identity contract

The identity layer resolves:

- authenticated user ID
- session/authentication state
- organization memberships
- application role

The route layer must not manually inspect raw authentication tokens.

## Authorization contract

Authorization is represented as an explicit application decision.

Conceptually:

authorize(identity, resource, action)

Examples:

- organization:read
- organization:update
- business:read
- business:update
- verification:read
- verification:review
- document:read
- document:upload
- ein:reveal (platform admin only)
- promotion:create
- promotion:publish
- audit:read

Authorization failures return HTTP 403.

Authentication failures return HTTP 401.


## Organization onboarding and access

Authenticated users create an organization through:

    POST /api/v1/organizations

The request supplies only the organization name and organization type. A trusted PostgreSQL function derives the owner from `auth.uid()` and creates both the organization and its active owner membership in one transaction. The owner-membership invariant is therefore atomic: the API never accepts a successfully created organization without its initial owner membership.

Organization reads and updates use the protected pipeline:

    requireAuthentication
      -> loadApplicationIdentity
      -> validate organization scope
      -> requirePermission
      -> user-scoped RLS-backed service

List responses are projected from the user's active resolved memberships. Detail and update operations validate the organization UUID and evaluate permissions for that exact organization. Permissions in one organization do not authorize access to another organization.

After onboarding completes, a subsequent `GET /api/v1/auth/me` resolves the new owner membership from database truth. Request identity is not mutated to simulate onboarding success.


## EIN intake and verification

Organization owners and administrators submit EIN intake through:

    PUT /api/v1/organizations/:organizationId/businesses/:businessId/ein

The API validates and normalizes the nine-digit EIN, encrypts it in Node with AES-256-GCM and a fresh cryptographically random IV, and atomically stores the ciphertext, IV, authentication tag, and key version in the protected `business_ein_secrets` table. `businesses.ein_last_four` remains normal display data. Plaintext EINs and encryption keys are never persisted, logged, included in history/audit metadata, or returned by normal APIs.

Encrypted intake uses a narrowly scoped service-role-only transaction that independently verifies the actor is an active owner/admin of the exact organization and that the business belongs to it. It upserts the encrypted secret, updates the last four, finds or creates the latest active verification case, resets or creates the `ein` item with API verification method, appends history, and writes an audit event without plaintext or encrypted payload metadata. The retired last-four-only intake function is no longer executable by authenticated clients.

Platform administrators may explicitly reveal an EIN through:

    POST /api/v1/businesses/:businessId/ein/reveal

The `ein:reveal` permission is granted only by the platform `admin` role—not organization owner/admin/reviewer/member roles or the `sales_rep` account type. A service-role-only database function independently rechecks that platform role, returns only the encrypted payload to Node, and records the access in the same transaction. Node decrypts and returns `{ "businessId": "...", "ein": "12-3456789" }`; ciphertext, IV, authentication tag, key version, and key are never exposed. Every successful secret retrieval for reveal is audited without the EIN. Platform-admin-only reveal is the conservative baseline and may be adjusted only after stakeholder confirmation.

Provider verification is deliberately admin-triggered through:

    POST /api/v1/verification-items/:verificationItemId/ein/verify

It is never started automatically by case submission. Organization owner/admin/reviewer roles with `verification:review`, or a platform administrator with `admin:verification_review`, may request it. Trusted database functions re-check authorization against the item's owning organization; platform-admin access is limited to this explicit verification path and does not weaken tenant RLS.

Provider-specific behavior is isolated behind an `EinVerificationProvider` adapter. The verification endpoint accepts no EIN body. A trusted backend function rechecks the requesting actor against the exact item and organization, returns the encrypted payload to Node, and Node decrypts it only for the provider call. If no approved adapter and credentials are configured, the API fails closed with `EIN_VERIFICATION_NOT_CONFIGURED` and writes no fake verification state. Once an adapter is registered, request and completion transactions persist the attempt, update the item lifecycle, append verification history, and add audit events. Raw provider responses are not retained by the MVP implementation.

API verification may begin from `pending` or `in_review`, and may restart after `rejected` or `correction_required`. It cannot overwrite `verified`, `not_applicable`, or an existing `verification_requested` state.

The request transaction remains user-scoped and rechecks tenant reviewer/platform-admin authorization. Provider completion is a distinct backend-only operation: `complete_ein_verification` is executable only by PostgreSQL `service_role`, and the Node service-role client is used only for encrypted EIN persistence, authorized encrypted-secret retrieval, and provider completion. Completion derives history/audit actor attribution from the locked attempt's `requested_by_user_id`; it accepts no caller-supplied actor identity. Normal identity, organization, membership, and request-authorization operations remain Bearer-token/RLS scoped.

`EIN_ENCRYPTION_KEY` is a server-only base64-encoded 32-byte key, and `EIN_ENCRYPTION_KEY_VERSION` identifies the active version. Sensitive EIN operations fail closed when the configured key is unavailable or invalid. Each encrypted row stores its key version; the Node key resolver is deliberately version-aware so a future key map or AWS KMS integration can support rotation without changing the database model.


## Password reset flow

1. Backend requests a Supabase recovery email.
2. User opens the recovery link.
3. Frontend callback establishes the Supabase recovery session.
4. Frontend sends the recovery session access token and refresh token to:

   POST /api/v1/auth/reset-password

5. Node validates the authenticated identity and updates the password.

The frontend callback is required to establish the Supabase recovery session.
The backend does not implement a custom password-reset token format.


## Storage contract

Private documents are stored through controlled storage operations.

The API should return metadata and controlled access rather than exposing arbitrary storage paths.

Sensitive verification documents are never part of public profile projections.

## Audit contract

Security-sensitive mutations should generate audit events.

An audit event contains at minimum:

- actor user ID
- organization ID when applicable
- action
- entity type
- entity ID when applicable
- metadata
- timestamp

Audit records are append-oriented and are not used as a replacement for domain history.

## Profile projection

Public-facing profile responses must be projections.

They must explicitly select fields rather than returning complete database rows.

Protected verification fields must never be included accidentally.

## Promotion contract

Promotion operations are separate from verification.

Promotion authorization must evaluate:

- authenticated identity
- organization membership
- role
- visibility
- publishing permission

## Versioning

The API begins at v1.

Future breaking API contracts may be introduced under:

/api/v2

Existing v1 contracts should remain stable once consumed by clients.

## Milestone 2 boundary

This document defines the architecture and contracts.

It does not claim that all business endpoints are implemented.

Milestone 3 implements the concrete authentication, account, verification, and production API behavior.
