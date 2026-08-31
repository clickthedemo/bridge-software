# BRIDGE Access Model — Milestone 3

## Purpose

This document defines the technical authorization baseline for Supabase RLS and the Node.js API. Authentication identifies a Supabase user; application identity then resolves independent organization, membership, account, and platform dimensions.

## Independent access dimensions

### Organization type

An organization is classified as `brand`, `retailer`, or `dispensary`. Organization type describes the organization and does not grant a membership role or platform capability.

The first schema rollout leaves existing organizations unclassified (`NULL`). They must be classified through an explicit reviewed backfill before a future `NOT NULL` constraint is considered.

### Organization membership role

An active membership grants organization-scoped permissions through one of these roles:

- `owner`
- `admin`
- `reviewer`
- `member`

An organization `admin` is not a platform administrator. Permissions in one organization never imply access to another organization.

### User account type

Account type describes a user capability category:

- `standard`
- `sales_rep`

A sales representative receives no cross-organization access from account type alone. Organization access still requires an active membership or a future explicit assignment relationship.

### Platform role

Platform roles are stored separately from organization memberships. The initial platform role is `admin`.

Platform administrators receive only explicit platform permissions. They are not automatically organization members and are never represented as `organization_members.role = 'admin'` unless they independently hold that membership.

Platform-admin permissions do not themselves bypass tenant RLS. Cross-organization admin verification data access will be implemented through an explicit trusted backend/RLS path as part of the admin verification queue, rather than by weakening normal organization RLS.

## Authorization principles

1. Authentication answers who the user is.

2. Application identity resolves account, platform-role, and active membership context.

3. Membership role determines permitted operations within a specific organization.

4. Platform permissions are evaluated independently of organization permissions.

5. RLS remains the database security boundary; Node authorization remains the API security boundary.

6. The frontend is never trusted to enforce authorization.

7. Sensitive verification information is never public profile data.

## Membership permission baseline

| Permission | owner | admin | reviewer | member |
|---|---:|---:|---:|---:|
| `organization:read` | yes | yes | yes | yes |
| `organization:update` | yes | yes | no | no |
| `organization:members_manage` | yes | yes | no | no |
| `business:read` | yes | yes | yes | yes |
| `business:update` | yes | yes | no | no |
| `verification:read` | yes | yes | yes | yes |
| `verification:submit` | yes | yes | no | yes |
| `verification:review` | yes | yes | yes | no |
| `document:read` | yes | yes | yes | yes |
| `document:upload` | yes | yes | no | yes |
| `document:review` | yes | yes | yes | no |
| `audit:read` | yes | yes | no | no |

Owner and admin currently share the same technical baseline. Ownership-transfer or ownership-removal semantics are not defined by this milestone.

## Platform permission baseline

| Platform role | `admin:verification_queue` | `admin:verification_review` |
|---|---:|---:|
| `admin` | yes | yes |

Platform roles do not bypass organization-scoped checks for organization, business, document, verification, or audit permissions.

The exact role matrix remains subject to the stakeholder role/audience matrix.
This document defines the technical baseline and must not be interpreted as final product policy where stakeholder decisions are still pending.

## Protected data

Protected data includes EIN-related information, provider responses, verification decisions and documents, internal review notes, audit metadata, and private organization information. These fields must not be exposed through public profile projections.

## Cross-organization access

Organizations and sales representatives do not automatically receive access to unrelated organizations. Cross-organization access requires an explicit future authorization or assignment relationship.

## RLS

Supabase RLS remains enabled on private domain tables. Normal authenticated users cannot assign platform roles. Users may read only their own platform-role assignments for identity resolution.
