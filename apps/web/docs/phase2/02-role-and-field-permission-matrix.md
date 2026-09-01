# Bridge Phase 2 — Role and Field-Permission Contract

**Status:** Working baseline for Tori + Miraj + legal review · 2026-08-06

## Roles

| Role | Meaning |
|------|---------|
| Public adult 21+ | Age-eligible public visitor |
| Industry member | Eligible member participant |
| EIN-verified business | Organization with verification state |
| Authorized staff | Delegated org staff |
| Bridge admin | Platform administration |

## Capability matrix

| Capability / data | Public 21+ | Industry member | EIN-verified business | Authorized staff | Admin |
|-------------------|------------|-----------------|----------------------|------------------|-------|
| Read public Community News | Yes | Yes | Yes | Yes | Yes |
| Participate in eligible member signal | No | Yes | Yes | Yes | Yes |
| Create public promotion | No | Eligible creator | Yes | By permission | Yes |
| Create multi-audience post | No | Eligible creator | Yes | By permission | Yes |
| View public profile fields | Yes | Yes | Yes | Yes | Yes |
| View protected wholesale / relationship fields | No | Decision | Yes, scoped | By permission | Yes, audited |
| View sales and accounting contacts | No | No by default | Yes, scoped | By permission | Yes, audited |
| Confirm business contacts | No | No | Owner/admin | By permission | Yes, audited |
| Search nationwide public records | Yes | Yes | Yes | Yes | Yes |
| Search verified business records | No | Eligible member | Yes | Yes | Yes |
| Request protected introduction | No | Eligible member | Yes | By permission | Yes |
| View EIN / verification documents | No | No | Status only | Status only | Verification staff |
| Moderate content / verification | No | No | No | No | Yes |

## Audience targeting rules

1. Creators may select multiple eligible audiences.
2. Prototype exposes: Adults 21+, Verified retailers, Industry professionals.
3. When protected wholesale/business detail is enabled, public Adult 21+ is disabled and removed.
4. Production must enforce rules **server-side**. Disabled UI controls are not a security boundary.
5. State, license, role, and organization eligibility must come from verified claims.

## Locked Dillon recommendations

- Vendor-to-vendor protected visibility: **deny by default**; grant by explicit org role + relationship.
- Default Community News layout: **News grid** (Classic retained as comparison).
- Pricing: **out of product UI**.
- HR concept: **out of Phase 2/3 MVP**.
