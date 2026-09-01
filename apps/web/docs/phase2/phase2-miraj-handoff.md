# Bridge Phase 2 → Phase 3 — Miraj Engineering Handoff

**Date:** 2026-08-06  
**From:** Dillon (product / UX / front-end)  
**To:** Miraj (backend / platform)  
**Canonical app:** `dillonmohr8777/bridge-discovery-prototype` branch `phase2-reconcile-2026-08-06`  
**Exploration evidence:** `bridge-discovery-prototype-kimi-design` → `latest-signal-app/` (not canonical production source)

## Identity and claims

Required claims on every protected request:

- User ID
- Age eligibility (21+)
- Membership status
- Organization ID
- Organization verification state
- Role
- Delegated permissions
- State / license eligibility
- Admin scope

## Core entities

`User`, `Organization`, `Membership`, `RoleGrant`, `Verification`, `ProfileField`, `ResponsibleContact`,  
`Post`, `Asset`, `Audience`, `PostAudience`, `ModerationState`,  
`ExploreRecord`, `Location`, `Category`, `Product`, `Brand`, `Strain`, `Favorite`,  
`Signal`, `Cohort`, `SignalResponse`, `Opportunity`, `IntroductionRequest`

## Server-side rules

- Authorization for every protected record, upload, audience, profile projection, and introduction
- **Never** rely on disabled client controls as a security boundary
- Multi-audience posts with protected detail must reject Adults 21+ targeting server-side

## Audit events

Role change · verification change · protected-field view · contact edit · contact confirmation · audience publication · introduction approval · moderation action

## Required API behaviors (vertical slice)

1. Current-user claims  
2. Audience-safe Community News retrieval + stable cursor pagination  
3. Upload intent → type/size validation → scan → processing state  
4. Post persistence with multiple audiences  
5. Public and B2B profile projections  
6. Contact-confirmation event + next-due date  
7. Explore search with composable filters + favorite state  
8. Permissioned introduction request (no protected contact disclosure)

## Recommended first vertical slice

**Targeted Promotion creation + protected profile projection**

Proves: claims, upload/storage, multi-audience, protected-detail enforcement, public vs B2B projection, contact confirmation, audit events.

**Exclude from slice:** nationwide marketplace, live menu/order, production EIN verification, algorithmic feed, full auth UI, billing, HR.

## Ask

1. Confirm or revise claims + API behaviors  
2. Lock vertical slice + staging date  
3. Publish auth claims list you will enforce  
