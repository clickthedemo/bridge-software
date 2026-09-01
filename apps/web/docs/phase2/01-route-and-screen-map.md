# Bridge Phase 2 — Route and Screen Map

**Status:** Phase 2 review package · 2026-08-06  
**Stack:** `bridge-discovery-prototype` (Trusted Current direction)  
**Live preview target:** https://bridge-preview-current.netlify.app

## Primary routes

| Route | Label | Job to be done |
|-------|--------|----------------|
| `/` | Home | Understand Bridge; enter one of four product spaces without a dominating hero |
| `/community` | Community News | Scan stories/promotions/signals; compare News grid vs Classic feed |
| `/create` | Create | Build Promotion; upload PNG/JPEG/WebP/PDF; multi-audience; protected-detail guard |
| `/my-profile` | My Profile | Business home base; Public vs B2B; sales/accounting contacts; required monthly confirm |
| `/explore` | Explore | Nationwide state filters; category/search; favorites; honest coverage language |

## Secondary / retained routes

| Route | Role |
|-------|------|
| `/directory` | Legacy discovery entry; treated as Explore-adjacent in nav matching |
| `/profile/[slug]` | Public profile detail for illustrative members |
| `/join` | Onboarding direction (pre-Phase 2) |
| `/dashboard` | Brand dashboard direction (pre-Phase 2) |
| `/admin/verification` | Admin verification queue direction |
| `/directions` | Visual direction comparison |
| `/design-system` | Token/component reference |

## Navigation contract

Primary labels: **Home · Community News · Create · My Profile · Explore**.  
“Exchange” and “Business” are retired as primary labels.

## Provisional labeling

Staging builds set `NEXT_PUBLIC_DIRECTION_LOCK=current`, show **Provisional preview · Trusted Current**, and `noindex`.
