# BRIDGE Access Model — Milestone 2

## Purpose

This document defines the technical access model for BRIDGE.
It is the foundation for Supabase RLS and the Node.js authorization layer.

## Product roles

The initial product roles are:

- brand
- retailer
- dispensary
- sales_rep
- admin

Authentication identity is provided by Supabase Auth.
Application membership and role information are stored in the BRIDGE database.

## Authorization principles

1. Authentication answers: "Who is this?"
2. Authorization answers: "What may this identity do?"
3. Organization membership determines tenant access.
4. Role determines permitted operations within the tenant.
5. Sensitive verification information is never treated as public profile data.
6. RLS remains a database-level security boundary.
7. Node.js authorization provides the application/API-level security boundary.
8. The frontend is never trusted to enforce authorization.

## Role baseline

| Role | Organization data | Business/profile | Verification | Documents | Administration |
|---|---|---|---|---|---|
| brand | own organization | own organization | own cases | own documents | limited |
| retailer | own organization | own organization | own cases | own documents | limited |
| dispensary | own organization | own organization | own cases | own documents | limited |
| sales_rep | assigned/authorized data | assigned/authorized data | no unrestricted access | no unrestricted access | no |
| admin | authorized organizations | authorized data | full operational access | full operational access | yes |

The exact role matrix remains subject to the stakeholder role/audience matrix.
This document defines the technical baseline and must not be interpreted as final product policy where stakeholder decisions are still pending.

## Protected data

The following are treated as protected by default:

- EIN-related verification information
- verification provider responses
- verification decisions
- verification documents
- internal review notes
- audit metadata
- private organization information

These fields must not be exposed through public profile projections.

## Visibility levels

The application should distinguish:

- public
- organization
- assigned
- protected
- admin

Visibility is enforced by backend authorization and database RLS where applicable.

## Vendor-to-vendor access

Vendor organizations must not automatically receive unrestricted access to another vendor's private organization or verification data.

Cross-organization access requires an explicit authorization rule or future sharing relationship.

## RLS

Supabase RLS remains enabled on private domain tables.

The Node API must never rely on frontend filtering as an authorization mechanism.

## Milestone 2 status

The technical access model is defined sufficiently to begin API architecture and Milestone 3 implementation.

Stakeholder-dependent items remain explicitly marked rather than silently assumed.
