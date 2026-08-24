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
- promotion:create
- promotion:publish
- audit:read

Authorization failures return HTTP 403.

Authentication failures return HTTP 401.


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
