# Bridge Phase 2 — Phased Backlog and Open Decisions

## Phase 2 (this package)
- Route map, matrix, journeys, review prototype surfaces — **packaged here**
- Tori written accept/revise — **open**
- Default feed confirmation — **recommended News grid**

## Phase 3 (front-end foundation + Miraj contracts) — opened 2026-08-19
- Design-system tokens/components production rules — **documented in `docs/phase3/01-design-system-production-rules.md`**
- Auth claims, upload intent, multi-audience persistence, profile projections — **typed in `lib/phase3/`**
- One vertical slice: **Promotion creation + protected profile projection** — **wired on `/create` and `/my-profile`**
- Automated tests once APIs exist — **contract tests live against the mock adapter; live API tests wait on staging**

## Later
- Nationwide live data providers
- Menu/order integrations
- Marketplace seeding / pilot launch
- Pricing packaging (commercial)
- HR concept (separate legal charter only)

## Open decisions

| ID | Decision | Owner | Status |
|----|----------|-------|--------|
| D-FEED | Default feed layout | Tori | Recommended: News grid |
| D-FIELD | Final field set | Tori + Miraj + legal | Baseline matrix shipped |
| D-V2V | Vendor-to-vendor visibility | Tori + Miraj + legal | Recommend deny-by-default |
| D-SLICE | Vertical slice | Dillon + Miraj | Recommended: Promotion + protected profile |
| D-PRICE | Subscription packaging | Melissa / Mac / Tori | Commercial only |
| D-HR | HR support | Legal | Deferred |
