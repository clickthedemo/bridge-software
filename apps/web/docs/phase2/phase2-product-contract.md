# Bridge Phase 2 Product Contract

**Prepared:** August 4, 2026  
**Feedback source:** Tori prototype review, July 23, 2026, approximately 39 minutes  
**Contract status:** Prototype-complete; stakeholder and technical decisions remain as labeled below  
**Source of interactive review prototype:** https://bridge-connected-signal.netlify.app (actual client-facing static review suite)

## 1. Approved route and screen map

```text
Home
├── Community News
│   ├── Daily Signal
│   ├── News grid / Classic feed comparison
│   └── Create entry
├── Create
│   ├── Content type and message
│   ├── PNG/JPEG/WebP/PDF upload
│   ├── Multi-audience targeting
│   └── Protected-detail guardrail and preview
├── My Profile
│   ├── Public view
│   ├── Verified B2B view
│   ├── Sales and accounting contacts
│   └── First-login / monthly contact confirmation
└── Explore
    ├── Nationwide search and filters
    ├── Favorites
    ├── Consumer dispensary utilities
    ├── Regional market context
    └── Permissioned introduction opportunities
```

Navigation labels are standardized as **Community News**, **Create**, **My Profile**, **Explore**, and **Home**. “Exchange” and “Business” are retired as primary labels because they obscured the product job.

## 2. Role, audience, and visibility matrix

This matrix is the Phase 2 implementation baseline. “Decision” means the visual prototype demonstrates the boundary but the final authorization rule still needs approval.

| Capability or data | Public adult 21+ | Industry member | EIN-verified business | Authorized staff | Bridge admin |
| --- | --- | --- | --- | --- | --- |
| Read public Community News | Yes | Yes | Yes | Yes | Yes |
| Participate in eligible member signal | No | Yes | Yes | Yes | Yes |
| Create public promotion | No | Eligible creator | Yes | By business permission | Yes |
| Create multi-audience post | No | Eligible creator | Yes | By business permission | Yes |
| View public profile fields | Yes | Yes | Yes | Yes | Yes |
| View protected wholesale / relationship fields | No | Decision | Yes, scoped | By business permission | Yes, audited |
| View sales and accounting contacts | No | No by default | Yes, scoped | By business permission | Yes, audited |
| Confirm business contacts | No | No | Business owner/admin | By permission | Yes, audited |
| Search nationwide public records | Yes | Yes | Yes | Yes | Yes |
| Search verified business records | No | Eligible member | Yes | Yes | Yes |
| Request a protected introduction | No | Eligible member | Yes | By business permission | Yes |
| View EIN or verification documents | No | No | Status only | Status only | Verification staff only |
| Moderate content and verification | No | No | No | No | Yes |

### Audience targeting rules

- Creators may select multiple eligible audiences.
- The prototype exposes Adults 21+, Verified retailers, and Industry professionals.
- When protected wholesale or business details are enabled, the public Adult 21+ target is disabled and removed.
- Production must enforce these rules on the server. Disabled controls in the prototype are not a security boundary.
- State, license, role, and organization eligibility must come from verified claims rather than self-declared profile copy.

## 3. Priority journeys and acceptance criteria

### Journey A: first-time product discovery

1. A reviewer opens Home.
2. They understand the Bridge positioning and see visual product moments.
3. They enter one of the four primary product spaces.

**Acceptance:** The four primary spaces are named consistently; one click opens each route; no giant headline hides all product utility on desktop.

### Journey B: compare feed directions

1. A member opens Community News.
2. They scan a staggered visual news grid.
3. They switch to Classic feed without losing content.

**Acceptance:** The selected layout is textually and programmatically indicated; the same feed items are available in both layouts; the layout remains usable on mobile.

### Journey C: create a targeted promotion

1. A creator chooses Promotion.
2. They upload PNG, JPEG, WebP, or PDF up to 25 MB.
3. They select one or more eligible audiences.
4. They mark protected business detail when applicable.
5. The preview states the resulting access level.

**Acceptance:** Unsupported or oversized files are rejected with a message; valid file name and size appear in the preview; protected detail removes public targeting; publish is unavailable when no eligible audience remains.

### Journey D: verify the business home base

1. An authorized business user opens My Profile.
2. They see first-login or recurring contact-review status.
3. They review sales and accounting contacts.
4. They confirm the cycle or update details.
5. They switch to Public view to audit exposure.

**Acceptance:** First login and monthly confirmation are mandatory; confirmation provides a clear state change; protected contacts disappear in Public view; EIN and source documents never appear publicly.

### Journey E: nationwide discovery and favorites

1. A member opens Explore.
2. They filter by state, category, product, brand, strain, or service.
3. They save useful records and can isolate favorites.
4. They request an introduction or use eligible public consumer utilities.

**Acceptance:** The state selector includes all 50 states and D.C.; search and filters update the result count; no-result states distinguish complete geographic coverage from the four-state illustrative record set; the corridor overview and four state-specific 3D scenes stay synchronized with supported state filters and remain labeled as illustrative; favorites expose saved state; protected contact exchange is represented as a request, not automatic disclosure.

## 4. Backend and integration contract for Miraj

### Identity and authorization

- Required claims: user ID, age eligibility, membership status, organization ID, organization verification state, role, delegated permissions, state/license eligibility, and admin scope.
- Authorization must be evaluated server-side for every protected record, upload, audience, and introduction.
- Audit events: role change, verification change, protected-field view, contact edit/confirmation, audience publication, and introduction approval.

### Core entities

- `User`, `Organization`, `Membership`, `RoleGrant`, `Verification`, `ProfileField`, `ResponsibleContact`.
- `Post`, `Asset`, `Audience`, `PostAudience`, `ModerationState`.
- `ExploreRecord`, `Location`, `Category`, `Product`, `Brand`, `Strain`, `Favorite`.
- `Signal`, `Cohort`, `SignalResponse`, `Opportunity`, `IntroductionRequest`.

### API behaviors needed for the selected vertical slice

1. Return the current user and verified authorization claims.
2. Return Community News items using stable cursor pagination and an audience-safe projection.
3. Create an upload intent, validate file type/size, scan the stored asset, and return processing state.
4. Validate and persist a post with one or more audiences.
5. Return public or protected profile projections based on authorization.
6. Record responsible-contact confirmation with actor, time, and next-due date.
7. Search Explore records with composable filters and favorite state.
8. Create a permissioned introduction request without revealing protected contact data.

### External integrations to evaluate, not assume

- Live dispensary menu and order provider.
- Apple Maps place/deep-link strategy.
- Instagram, Facebook, LinkedIn, and Leafly profile linking.
- Email provider for first-login and recurring contact reminders.
- Verification provider or manual workflow for EIN and license evidence.
- Object storage, malware scanning, media transformation, and PDF preview.

## 5. Decision record

| Decision | Prototype recommendation | Owner | Status |
| --- | --- | --- | --- |
| Default Community News layout | News grid; retain Classic feed as comparison until Tori signs off | Tori + Dillon | Approval needed |
| Vendor-to-vendor protected visibility | Deny by default; grant by explicit organization role and relationship | Tori + Miraj + legal | Unresolved |
| Exact public/member/business field set | Use the matrix above as working baseline | Tori + Miraj | Field-level approval needed |
| Phase 2 vertical slice | Create targeted promotion plus protected profile projection | Dillon + Miraj | Recommended; written technical lock still needed |
| Nationwide data coverage | Keep the current sample records explicitly labeled; expanded live directories require approved providers, market rules, and a written change order | Miraj + product | Future scope unless approved otherwise |
| Subscription pricing | Keep $349-$350 discussion out of product UI until packaging research is complete | Dillon + business | Not final |
| HR concept | Separate future discovery with employment/privacy counsel | Dillon + legal | Outside Phase 2 MVP |

## 6. Phase 2 exit gate

Phase 2 is ready to enter production implementation when:

- Tori approves the route map and default feed direction.
- Tori, Miraj, and legal approve field-level role and visibility rules.
- Dillon and Miraj select one vertical slice and its production data fixtures.
- Miraj confirms authentication, authorization, upload, search, and reminder contracts.
- Acceptance criteria are converted to automated tests against real APIs.
- Final Bridge imagery and copy are approved for any screen leaving prototype status.

The current prototype and local Next.js feature-branch implementation complete the reviewable interaction layer and the contracts needed to make those decisions. They do not convert the unresolved decisions into false certainty or prove a production backend.

---

*Imported into the canonical Trusted Current repo 2026-08-06. The five-route Next.js reconciliation is implemented and verified locally, while the actual client-facing review UI remains the static suite at bridge-connected-signal.netlify.app.*
