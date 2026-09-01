# What Claude can handle in the Bridge process

Claude can be a high-leverage implementation and analysis partner, but not an autonomous source of product truth. It should work from Tori-approved decisions, repository context, API contracts, and acceptance criteria.

## 1. Before and during discovery

Claude can:

- Convert Tori's walkthrough transcript into user journeys, screen inventory, entities, assumptions, and open questions.
- Compare her original prototype with this prototype and produce a traceable difference report.
- Turn meeting notes into a decision log with owners and due dates.
- Draft role-specific interview questions and edge-case scenarios.
- Generate multiple copy or layout options after the team defines the decision to test.

Human gate: Tori approves intent, users, priorities, brand direction, and scope. Claude cannot infer approval from a prototype or rewrite the contract.

## 2. Product specification

Claude can:

- Draft user stories and Given/When/Then acceptance criteria.
- Build a role-permission matrix and CRUD/state-transition map.
- Propose database entities and TypeScript types for Miraj to review.
- Define loading, empty, error, offline, permission, and rejection states for every screen.
- Maintain a requirements-to-screen-to-test traceability table.

Human gate: Dillon owns UX/product interpretation; Miraj owns backend/security feasibility; Mac/Tori own scope decisions.

## 3. Brand and UI design

Claude can:

- Generate structured visual directions from approved attributes.
- Apply tokens consistently across components and screens.
- Produce responsive variants, content-density options, and accessibility checks.
- Audit component states and flag inconsistent spacing, copy, or interaction patterns.
- Help translate approved layouts into React components.

Claude should not “design everything and export it into React” as a blind one-click process. The best workflow is iterative: generate alternatives, review with Tori, approve a system, then implement clean reusable components. AI output is a starting point; the production React code must be reviewed, tested, and integrated deliberately.

## 4. Front-end implementation

Claude can:

- Scaffold and refactor Next.js/React/TypeScript routes and components.
- Connect approved Supabase queries/auth flows once Miraj defines contracts.
- Generate forms, validation, loading/error states, and role guards.
- Write unit, component, and end-to-end tests.
- Review accessibility, performance, dependency, and security risks.
- Prepare pull-request summaries and release checklists.

Human gate: no production merge without code review, test evidence, secrets review, and UI acceptance.

## 5. Backend collaboration

Claude can:

- Review Supabase schema, RLS policy intent, migrations, and API contracts.
- Generate typed clients from agreed schemas.
- Create seed data and test fixtures that contain no real personal or regulated data.
- Identify mismatches between front-end assumptions and backend constraints.

Human gate: Miraj owns database, authentication, authorization, storage, migrations, and production data. Security/RLS output must be reviewed by a qualified human.

## 6. QA and launch readiness

Claude can:

- Produce test matrices by role, device, state, and browser.
- Automate smoke tests for directory, onboarding, contact requests, and admin review.
- Audit keyboard navigation, semantics, color contrast, and responsive breakpoints.
- Generate release notes, runbooks, rollback steps, and support documentation.
- Analyze anonymized defects and cluster them by root cause.

Human gate: launch approval, legal/compliance claims, accessibility sign-off, and go-live changes remain human decisions.

## Recommended operating loop

```text
Tori intent and evidence
        ↓
Human-approved decision / acceptance criteria
        ↓
Claude generates options, specs, code, and tests
        ↓
Dillon UX/front-end review + Miraj backend/security review
        ↓
Automated checks and human acceptance
        ↓
Merge, deploy, observe, and feed verified learning into the next loop
```

## Inputs Claude needs to “handle everything” well

- Repository access and an agreed branching/review process
- The final product/brand context file
- Tori's approved decisions and prototype evidence
- Miraj's schema/API/auth contracts
- Reusable design tokens and component standards
- Explicit acceptance criteria and test accounts
- A safe secrets workflow; credentials never pasted into prompts or committed
- Clear production permissions and mandatory human gates

## Prompt package for the next build cycle

Use a task brief with:

1. Goal and user role
2. Approved screen/reference
3. In-scope and out-of-scope behavior
4. API/data contract
5. Required states and accessibility behavior
6. Acceptance criteria
7. Files allowed to change
8. Tests to run
9. Reviewer/approval owner

This lets Claude do most of the mechanical and analytical work while preserving product ownership and safe delivery.
