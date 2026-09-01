# Claude execution specification: Bridge MVP

> Historical product-build specification. For current Greencubes integration work, `docs/INTEGRATION-PIPELINE.md`, `docs/INTEGRATION-API-CONTRACT.md`, and `CONTRIBUTING.md` are authoritative when this file conflicts with them.

This document converts the four status screenshots into an executable build plan. The screenshots are **not four UI mockups**. They describe the current Bridge prototype, the remaining product work, ownership boundaries, and the required quality bar.

## 1. Confirm the project before doing anything

- Repository: `dillonmohr8777/bridge-software-frontend`
- Branch: create feature branches from `development`; promote reviewed work to `production`
- Product: Tori's cannabis-industry directory and professional network
- Front end: Next.js App Router, React, strict TypeScript, semantic CSS tokens
- Current data: fictional mock data only
- Future backend owner: Miraj
- Future backend direction: Supabase/PostgreSQL/auth/storage, after contracts are approved

This is not Bridge of Hope OTC, an SEO project, or a generic marketing engagement. Do not use unrelated memory to redefine the project. Do not rebuild the repository from scratch.

## 2. Authority and approval boundaries

| Area | Owner | Claude's authority |
| --- | --- | --- |
| Product intent, brand approval, scope | Tori | Prepare options and implement approved decisions; never approve for her |
| UX interpretation, front-end implementation, acceptance evidence | Dillon | Implement and document; surface material assumptions to Dillon |
| Backend, auth, database, RLS, storage, security integration | Miraj | Define typed front-end boundaries and mocks; do not invent production behavior |
| Delivery coordination and scope/commercial questions | Mac/team leads | Report blockers and change requests; do not silently expand scope |

Claude must not independently approve branding, redefine MVP scope, determine legal or compliance requirements, authorize production access, merge security-sensitive code, or describe Bridge verification as a legal guarantee.

## 3. Existing baseline to preserve

The following routes and behaviors already exist and must be inspected before editing:

| Route | Existing intent | Required end state |
| --- | --- | --- |
| `/` | Landing/value proposition | Clear audience, trust model, calls to browse and join, responsive navigation |
| `/directory` | Search and filters | Search plus role and verification filters, result count, clear/reset, empty state, keyboard-accessible controls |
| `/join` | Role-based onboarding direction | Role selection, role-specific requirements, progress, validation, save/resume boundary |
| `/profile/cascade-canna` | Member profile and contact request | Visibility rules, verification explanation, structured request, pending/success/error states |
| `/dashboard` | Member workspace | Profile/verification status, saved members, requests, announcements, next actions |
| `/admin/verification` | Admin review direction | Responsive queue/detail review, evidence, permissions, approve/request-changes/reject with confirmation |
| `/directions` | Three visual directions | Switchable comparison used for Tori's decision; no direction is treated as approved |
| `/design-system` | Provisional tokens/components | Colors, typography, spacing, controls, cards, badges, tables, state patterns |

Also preserve and update the product map, role matrix, screen inventory, MVP boundaries, acceptance intent, decision register, source audit, provisional brand kit, and meeting package already under `docs/`, `brand/`, and `.agents/`.

## 4. Operating workflow

Work sequentially. Do not ask the team to select unrelated deliverables. At the start of every slice:

1. Read `CLAUDE.md`, this file, and the required context files.
2. Inspect the existing implementation and current Git diff.
3. State the user story, affected roles/routes/states, acceptance criteria, and any human decision gate.
4. Implement the smallest complete vertical slice using existing patterns.
5. Validate behavior, accessibility, responsiveness, types, lint, and build.
6. Update the decision log and traceability documents when behavior or assumptions change.
7. Report changed behavior, files, evidence, open risks, and the next safe slice.

Do not continue through an approval gate by guessing. When blocked by Tori or Miraj, leave a typed mock or documented interface and move to another approved, independent slice.

## 5. Build phases

### Phase 0: verify and inventory

Before changing code:

- Confirm the repository, branch, latest commit, and clean/dirty status.
- Inspect `package.json`, every route under `app/`, shared components, `lib/data.ts`, CSS tokens, and all required context files.
- Run `npm install`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- Open every route at phone and desktop widths and check the browser console.
- Produce a short baseline report: working behavior, defects, unimplemented states, contradictions, and approval-dependent items.

If the baseline is healthy, preserve it. Do not rewrite working components merely to create activity.

### Phase 1: make the discovery prototype meeting-ready

This phase can proceed before Tori's meeting:

- Verify all eight routes and repair genuine responsive, interaction, accessibility, or console defects.
- Ensure all controls have labels, focus treatment, keyboard behavior, and meaningful disabled states.
- Ensure no route has horizontal overflow at 390, 768, or 1440 CSS pixels.
- Make the three directions easy to compare without claiming approval.
- Keep all data visibly fictional/provisional where a user could mistake it for production.
- Add a concise difference checklist for reconciling Tori's original prototype during the NDA-safe walkthrough.
- Make the Monday agenda capture decisions, owner, date, rationale, affected routes, and follow-up acceptance criteria.

### Human gate A: Tori product and brand walkthrough

Capture, do not infer:

- Primary audience and role priority
- Approved MVP screens and navigation
- Contact model and privacy expectations
- Verification meaning, evidence, review process, expiration, and appeal expectations
- Required profile fields and visibility by role
- Approved visual direction, logo/wordmark status, colors, typography, imagery, and tone
- Explicit exclusions and success criteria for the first release

Convert the meeting into dated decisions, user stories, acceptance criteria, and a prototype difference report. Never overwrite the provisional direction until approval is recorded.

### Phase 2: implement the approved UX system

After gate A:

- Promote the approved tokens into the shared design system.
- Refactor reusable primitives only where the approved direction requires it.
- Apply the system consistently to navigation, cards, filters, forms, badges, tables, dialogs, notices, and state views.
- Preserve semantic HTML and responsive behavior.
- Record rejected directions and the approval source in `docs/decision-log.md`.

### Phase 3: productionize the front-end flows

Implement complete user journeys with typed view models and mock adapters:

1. **Discover:** browse, search, filter, clear filters, open a profile, handle no results.
2. **Join:** choose a role, enter role-specific details, validate, review, submit, see pending status.
3. **Connect:** check permission, compose structured contact request, submit, see pending/accepted/declined outcomes.
4. **Manage membership:** view profile completeness, verification status, saved members, requests, announcements, and notifications.
5. **Review verification:** authorized admin opens submission, reviews evidence, records reason, and approves, requests changes, or rejects.

Use server components by default and client components only where state or browser APIs require them. Keep domain states separate from presentation. Do not hard-code authorization decisions into UI copy.

### Human gate B: Miraj backend contract

Before installing or connecting Supabase, obtain and document:

- Auth provider and session contract
- User-to-profile and user-to-organization relationships
- Tables/views, identifiers, enums, timestamps, and nullability
- Row-level-security intent for every read/write path
- Storage buckets, file types, size limits, signed URL behavior, and retention
- Server actions/API/RPC boundaries and error shapes
- Audit-event requirements and admin-role assignment
- Local, preview, and production environment-variable strategy

Claude may propose a contract for review but must not present it as approved or connect production services before this gate.

### Phase 4: Supabase integration

After gate B, replace mock adapters one bounded flow at a time. Candidate domain entities are:

- users and memberships
- organizations and locations
- member profiles and role-specific attributes
- licenses and verification submissions/reviews
- contact requests
- saved profiles
- announcements and notifications
- moderation reports and audit events

Recommended state machines:

- Verification: `draft -> submitted -> in_review -> approved | changes_requested | rejected`, with an explicit expired/reverification path if Tori requires it.
- Contact request: `draft -> sent -> accepted | declined | withdrawn`, with expiration only if approved.
- Profile: `draft -> pending_review -> published`, with visibility/suspension controlled by the approved policy.

For every mutation, enforce authorization on the server/database boundary—not only by hiding a button. Map backend errors to safe user-facing messages without exposing internals.

### Phase 5: required states and resilience

Every data-dependent route or action must deliberately support the applicable states:

- initial/loading and refresh/loading
- populated and empty
- inline validation and submission blocked
- permission denied/unauthenticated
- network/server error with safe retry
- pending/in review
- changes requested/rejected with an understandable reason and next action
- success confirmation without duplicate submission
- stale or conflicting data when relevant

Do not use permanent spinners, ambiguous blank screens, color-only status, or optimistic success for security-sensitive actions.

### Phase 6: test and audit

Maintain these checks for every slice:

```bash
npm run typecheck
npm run lint
npm run build
npm audit
```

Before production readiness, add and maintain:

- unit tests for filters, validation, state transitions, and permission rendering
- component tests for forms, dialogs, tables, and state views
- end-to-end tests for Discover, Join, Connect, Dashboard, and Admin Review journeys
- automated accessibility checks plus manual keyboard and screen-reader spot checks
- responsive visual checks at representative phone, tablet, and desktop widths
- browser-console checks for errors and hydration warnings

Target WCAG 2.2 AA behavior. Respect reduced motion, visible focus, touch target size, meaningful headings, form error association, contrast, and table semantics. Avoid unnecessary client JavaScript and unoptimized media. Never commit secrets, real member data, client documents, or production records.

### Phase 7: release and traceability

For every approved release candidate, maintain:

- user story and acceptance criteria
- decision IDs and source/approver
- affected roles, routes, components, states, and data contract
- test evidence and known limitations
- release notes
- setup/deployment/rollback runbook
- QA results and unresolved risks

## 6. Definition of done for a slice

A slice is done only when:

- The approved acceptance criteria are satisfied in observable behavior.
- Loading, empty, error, permission, pending, rejection, and success states relevant to the slice are covered.
- Phone and desktop layouts work without horizontal overflow.
- Keyboard operation, focus, labels, headings, contrast, and error announcements are checked.
- TypeScript, ESLint, production build, relevant tests, and browser-console checks pass.
- No credentials, personal data, or production data were added.
- Material assumptions and decisions are recorded.
- Claude reports evidence, remaining risks, and the next safe step without claiming unperformed checks.

## 7. Claude's immediate task

Begin with Phase 0. If the baseline checks pass, complete only Phase 1 work that is objectively required and does not pre-approve Tori's product or brand choices. Then return a meeting-ready report containing:

1. What is already working
2. Defects fixed, with verification evidence
3. The prototype difference checklist for Tori
4. Decisions required from Tori
5. Contracts required from Miraj
6. The ordered implementation backlog after those decisions
7. Exact commands and checks run

Do not ask what kind of SEO report, strategy deck, vault, or marketing deliverable is wanted. Those belong to a different project.
