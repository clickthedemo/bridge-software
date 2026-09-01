# Bridge MVP product definition

Status: synthesized from the signed proposal, agreement, Slack/Gmail decisions, and discovery work. Confirm with Tori and Miraj before treating as implementation-ready.

## Product map

```text
Public
├─ Landing / value proposition
├─ Directory
│  ├─ Search and filters
│  └─ Member profile
├─ Join / sign in
└─ Role-based onboarding

Member workspace
├─ Dashboard
├─ Profile editor
├─ Saved profiles
├─ Contact requests
├─ Announcements
└─ Notifications

Administration
├─ Verification queue
├─ Member management
├─ Reported profiles
├─ Content moderation
└─ Audit trail
```

## Role matrix

| Capability | Brand | Dispensary/Retailer | Sales rep | Admin |
|---|---:|---:|---:|---:|
| Create and edit own profile | Yes | Yes | Yes | Support/override |
| Browse and filter directory | Yes | Yes | Yes | Yes |
| Save profiles | Yes | Yes | Yes | Optional |
| Send/receive contact request | Yes | Yes | Yes | Moderate |
| Publish basic announcement | Yes | Yes | Yes | Moderate |
| Submit business/license evidence | Yes | Yes | As required | Review |
| Approve or reject verification | No | No | No | Yes |
| Suspend/report/moderate | Report | Report | Report | Yes |

Open question: the proposal names both retailer and dispensary. Tori must decide whether these are separate account types or one organization type with subcategories.

## Screen inventory and acceptance intent

1. Landing: visitor understands who Bridge is for and can enter the directory or onboarding.
2. Directory: user can search and filter by role, market/specialty, and verification state; zero-results guidance is visible.
3. Member profile: user sees business identity, role, location, specialties, verification state, partnership intent, and basic announcements.
4. Contact request: member chooses a reason and sends a concise permission-based introduction; private contact data is not exposed before acceptance.
5. Role onboarding: member selects a role and receives role-specific fields and verification requirements.
6. Member dashboard: member sees profile health, discovery metrics, contact requests, saved activity, and relevant actions.
7. Admin verification: reviewer sees submitted evidence, status, age, review action, reason, and audit history.
8. Saved profiles: member can add/remove profiles and return to them.
9. Notifications: member receives understandable events for verification and contact request state changes.
10. Announcement composer/list: approved roles can publish and manage basic updates within MVP limits.

## MVP in scope

- Browser-based responsive web application
- Member authentication and role-based authorization
- Public or approved-visibility directory and profiles
- Search and practical filters
- Structured contact requests
- Business identity/license verification workflow
- Saved profiles
- Basic announcements/posts
- Notifications
- Admin approval and moderation

## Explicitly out of scope for Phase 1

- Full social feed
- Real-time direct messaging
- Subscriptions and recurring billing
- Marketplace or transaction processing
- Native iOS/Android applications
- Advanced recommendations or matching AI
- Advanced analytics beyond useful operational summaries

## Data and compliance questions

- Which roles require EIN, license, government ID, or proof of authorization?
- Who performs verification and what sources are authoritative by state?
- What does the “Verified” label legally mean, and when does it expire?
- Which profile fields are public, member-only, or private?
- How long are rejected documents retained, and who can access them?
- What is the appeals/re-review flow?
- What minimum age and jurisdiction terms apply?
- What audit logs are required for administrative decisions?

## Technical contract boundary

The front-end prototype is Next.js/React/TypeScript. Backend remains Miraj's Supabase/PostgreSQL/auth/storage responsibility. Before integration, agree on database entities, API/query shapes, role claims, validation rules, file-upload constraints, error states, seed data, environment ownership, and deployment responsibilities.
