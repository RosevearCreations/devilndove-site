# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0019`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 220 candidate

Build 219 **Manufacturing Work Order & Job Traveler** is the exact fully verified predecessor.

- Development SHA: d05924a6c395b9ff2d6cd667d335d690de995805
- Shared tree: c41a2fd13e69a517d258a2b7e8a5c6af47706e1b
- System / Quality / I.T. / Hygiene: 35559932353 / 35559932262 / 35559932380 / 35559932232
- Build 219 Development proof: 35559932358
- Exact Development URL: https://51612e13.devilndove-site.pages.dev
- Development deploy proof artifact: 10621358188
- Development regression artifact: 10622191261
- Production main: 6442fc479a61ff1083567a40a46a2987aba12844
- Production Pages / Live Resources: 35560514490 / 35560585150
- Product Browser / Route: 35560585205 / 35560585179
- Build 219 Production proof: 35560514532
- Exact Production URL: https://6e81f92e.devilndove-site.pages.dev
- Deployment ID: 6e81f92e-ce58-426e-b0e5-568504efe009
- Production promotion artifact: 10621673570

Build 220 **Production Run, QA, Rework & Scrap Evidence** is the active candidate. It introduces additive canonical migration 0019 for immutable reviewed run packets linked to the exact reviewed Build 219 traveler. Inventory-owned material postings and existing order/handoff records are referenced, not rewritten; Finance/Accounting posting remains closed.

### Restart resolution rule
Resolve live dev and main first. Build 221 starts only after Build 220 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 212/213 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
