# Before the Tori meeting

Target: enter the meeting with a coherent point of view while keeping all client-dependent decisions reversible.

## Completed in this package

- [x] Cross-reference proposal, agreement, Gmail, Drive, and Slack history
- [x] Confirm the working front-end direction: Next.js + React + TypeScript
- [x] Separate Momentum proposal styling from unapproved Bridge branding
- [x] Create provisional brand kit and three visual directions
- [x] Build clickable core-flow prototype
- [x] Create reusable UI tokens and component examples
- [x] Map roles, screens, MVP scope, and acceptance intent
- [x] Document Claude's role and human approval gates

## Internal team work before Monday

- [ ] Dillon: run through every prototype route on desktop and mobile and log defects
- [ ] Dillon: prepare a five-minute narrative—problem, user roles, primary loop, verification, admin control
- [ ] Miraj: review role model, data entities, verification evidence, and contact-request state machine
- [ ] Miraj: identify technical contradictions between Supabase responsibilities and AWS hosting language
- [ ] Melissa: consolidate domain, master brand name, social handle, audience, SEO, and launch-content questions
- [ ] Mac: confirm contract/MVP boundaries and who can approve scope changes
- [ ] Team: choose one person to facilitate, one to take decisions, and one to drive the prototype
- [ ] Team: agree that no visual direction is called “final” in the meeting

## Ask Tori to bring or show

- Her original Claude prototype in a live NDA-safe walkthrough
- Any logo, palette, fonts, design references, or The Trap relationship she wants preserved
- Examples of three products/sites she likes and three she dislikes, with reasons
- Her priority first user and first successful connection scenario
- Required verification evidence by role and any compliance counsel guidance
- Desired visibility rules for profiles and contact details
- The five filters she expects professionals to use most
- Domain/social-handle status and public naming preference

## 60-minute agenda

1. **5 min — Outcome:** confirm what must be decided today.
2. **10 min — Tori walkthrough:** Tori shows her Claude prototype; team listens and captures intent before critiquing.
3. **10 min — Product model:** confirm roles, first user, first successful connection, and retailer/dispensary distinction.
4. **12 min — Prototype flow:** directory → profile → contact request → dashboard → admin review.
5. **10 min — Visual direction:** react to attributes and three directions; do not debate isolated colors first.
6. **8 min — MVP boundary:** confirm in/out items and anything that changes contract/timeline.
7. **5 min — Commitments:** owners, deliverables, next review, and approval method.

## Decisions that must leave the room

- Preferred brand attributes and visual direction
- Whether an existing Tori asset replaces the provisional kit
- Master user-role model
- First launch market/audience priority
- Required public/private fields
- Definition and evidence behind verification
- Core profile filters
- MVP boundaries and any change requests
- Content/asset owners and due dates
- Next prototype/design review date

## Demo sequence

1. Start on `/directions` and explain that all three are provisional.
2. Switch to the preferred direction and open `/`.
3. Browse `/directory`, filter to verified brands, and open Cascade Canna.
4. Show the structured contact request on `/profile/cascade-canna`.
5. Show member value on `/dashboard`.
6. Show operational responsibility on `/admin/verification`.
7. Use `/design-system` only if the conversation moves into consistency or implementation.

## Meeting discipline

- Record decisions as `approved`, `preferred pending revision`, `rejected`, or `open`.
- Separate a usability issue from a visual preference.
- When new functionality appears, classify it as existing scope, clarification, or change request.
- Do not promise automated legal/licensing verification until sources and review responsibility are defined.
- End with a read-back of decisions and owners.

## Decision capture log

Fill this live during the meeting — one row per decision that leaves the room. Copy `approved`/`rejected` rows into `docs/decision-log.md` afterward, and use `docs/tori-prototype-difference-checklist.md` for the walkthrough reconciliation itself.

| Decision | Status (approved / preferred pending revision / rejected / open) | Owner | Date | Rationale | Affected routes | Follow-up acceptance criteria |
|---|---|---|---|---|---|---|
| Visual direction (D-01) | | | | | `/directions`, all routes via tokens | |
| Retailer vs dispensary account types (D-02) | | | | | `/join`, `/directory`, data model | |
| Verification evidence by role (D-03) | | | | | `/join`, `/admin/verification` | |
| Meaning of the public "Verified" label (D-04) | | | | | `/directory`, `/profile/[slug]` | |
| Public / member-only / private fields (D-05) | | | | | `/profile/[slug]`, `/dashboard` | |
| First market and priority role (D-07) | | | | | onboarding copy, launch plan | |
| Between-session approval owner (D-08) | | | | | process | |
| MVP boundary confirmations / change requests | | | | | scope | |
| Asset owners and due dates | | | | | brand assets | |
| Next review date | | | | | process | |
