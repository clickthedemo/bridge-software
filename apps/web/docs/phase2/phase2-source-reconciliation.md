# Phase 2 Source Reconciliation

**Date:** 2026-08-06

## Provenance

| Source | What was taken |
|--------|----------------|
| Tori July 23 feedback (~39 min) | Dark purple direction, reduced hero, feed comparison, upload types, multi-audience, contacts, Public/B2B, nationwide filters |
| Canonical Trusted Current prototype | Next.js App Router stack, direction-lock staging, BrandMark, directory/profile patterns, provisional identity tokens |
| `latest-signal-app` (Kimi exploration repo) | Product contract, journeys, checklist, live route identities (community/studio/business/signal), completion PDF evidence |
| Aug 1 Phase 2 plan PDF | Five outputs, exit standard, Dillon lane, Phase 3 boundary |

## Canonical ownership

- **Canonical product/front-end source:** `dillonmohr8777/bridge-discovery-prototype`
- **Exploration / static suite evidence:** `dillonmohr8777/bridge-discovery-prototype-kimi-design` → `latest-signal-app/`
- **Trusted Current deploy target:** https://bridge-preview-current.netlify.app
- **Kimi live suite (non-canonical):** https://bridge-connected-signal.netlify.app — do not treat as final product source

## Route mapping (exploration → canonical)

| Exploration | Canonical Next.js |
|-------------|-------------------|
| `/` | `/` |
| `/community/` | `/community` |
| `/studio/` | `/create` |
| `/business/` | `/my-profile` |
| `/signal/` | `/explore` |

## Status

Phase 2 interactions ported into canonical Next.js on branch `phase2-reconcile-2026-08-06`. Formal close still requires Tori accept/revise and Miraj contract confirmation. Live Trusted Current site must be redeployed from this branch before it serves Phase 2 routes.
