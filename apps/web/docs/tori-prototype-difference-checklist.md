# Tori prototype difference checklist

Purpose: reconcile Tori's original Claude-built prototype with this build during the NDA-safe live walkthrough. Capture what her prototype shows for each item, how this build differs, and the decision that leaves the room. Do not screenshot or copy her prototype without her explicit permission — record observations as notes.

How to use: one facilitator drives her walkthrough; one recorder fills the table live. Record decisions as `approved`, `preferred pending revision`, `rejected`, or `open`.

## Reconciliation table

| # | Area | Her prototype shows | This build shows | Same / different | Decision | Owner | Date |
|---|---|---|---|---|---|---|---|
| 1 | Screens present (list every screen she shows) | | Landing, directory, join, member profile, dashboard, admin verification, directions, design system | | | | |
| 2 | Screens she has that we lack | | — | | | | |
| 3 | Screens we have that she lacks | | — | | | | |
| 4 | User roles and names | | Brand, Dispensary, Retailer, Sales rep, Admin | | | | |
| 5 | Retailer vs dispensary: one type or two (D-02) | | Two separate roles | | | | |
| 6 | Navigation structure and labels | | Directory, Dashboard, Design, Join | | | | |
| 7 | First-visit experience / value proposition | | Hero + trust stats + featured members | | | | |
| 8 | Directory: search and filter set | | Text search, member type, verified-only | | | | |
| 9 | Profile fields shown publicly | | Role, name, location, serving area, about, specialties, looking-for, verification badge, announcement | | | | |
| 10 | Contact model | | Structured request (reason + note), details private until accepted | | | | |
| 11 | Direct messaging present? (out of MVP scope unless changed) | | No | | | | |
| 12 | Verification meaning, evidence, and states | | Pending / verified / needs-attention labels; evidence undefined (D-03/D-04) | | | | |
| 13 | Onboarding steps and required fields | | Role selection step with provisional role requirements | | | | |
| 14 | Dashboard contents | | Metrics, contact requests, profile strength checklist | | | | |
| 15 | Admin capabilities shown | | Verification queue with sort; other areas marked post-decision | | | | |
| 16 | Visual identity: logo/wordmark | | Provisional bridge mark placeholder | | | | |
| 17 | Visual identity: color and typography | | Trusted Current default + two alternates (all provisional) | | | | |
| 18 | Tone of copy | | Direct, credible, industry-aware | | | | |
| 19 | Anything she calls a must-keep | | — | | | | |
| 20 | Anything she explicitly rejects | | — | | | | |

## After the walkthrough

- Convert every `approved` / `rejected` row into a dated entry in `docs/decision-log.md` with the evidence "Tori walkthrough (date)".
- Convert every `preferred pending revision` row into a user story with acceptance criteria before implementation.
- List any feature from her prototype that is outside the MVP boundary as a change request for Mac/Tori — do not silently absorb it into scope.
- Ask whether any private assets exist (logo files, fonts, palettes) that replace the provisional kit; update `docs/source-and-asset-audit.md` with what is received.
