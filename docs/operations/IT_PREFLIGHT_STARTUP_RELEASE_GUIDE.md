# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0017`. Request-time DDL and automatic Production promotion remain closed.

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. Execute only bounded current-architecture runtime proof.
5. Promote the identical Development tree to protected `main` only after Development is GREEN.
6. Require exact Production Pages deployment and applicable runtime/resource acceptance.
7. Avoid unnecessary Production D1 reads for code/docs-only promotions.
8. Only then call `main` / Production GREEN.

Stripe Development, PayPal sandbox and Social/OAuth remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 218 candidate

Build 217 **Production Cost Evidence v2** is the exact fully verified predecessor.

- Development SHA: 17d606f63d91ec178668c215caf263b95e3bd580
- Shared tree: cffc68c278b69f389372e4d43c022a9f0140a9d1
- System / Quality / I.T. / Hygiene: 35553944193 / 35553944303 / 35553944241 / 35553944239
- Build 217 Development proof: 35553944296
- Production main: 94a977f0732cc649037423a415dfba60417d4a47
- Production Pages / Live Resources: 35554258043 / 35554327033
- Product Browser / Route: 35554326994 / 35554327019
- Build 217 Production proof: 35554258012
- Exact Production URL: https://5cebd07d.devilndove-site.pages.dev

Build 218 **Quote ↔ Production Cost ↔ Margin Guardrails** is the active schema-neutral candidate. It reuses existing Custom Work quote/revision authority, the Build 217 production-cost evidence, Product linked-resource margin evidence and Finance profitability. Human review may append a quote-revision snapshot, but quote prices are never rewritten automatically.

Inventory remains the material-use/cost authority. Finance/Accounting remains the profitability/posting authority. Blank cost fields remain unknown rather than silently becoming zero. Canonical migrations remain `0001`–`0017`.

### Restart resolution rule
Resolve live dev and main first. Build 219 starts only after Build 218 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 212/213 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
