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
## Current Release 467 restart authority — Build 217 candidate

Build 216 **Customer-Supplied Item Intake & Suitability Review** is the exact fully verified predecessor.

- Development SHA: 2f9b0187110ffa0bd754eba1087f6ce56c23a0e4
- Shared tree: 5bc30361efc9166f90aa8a7a4761646389325625
- System / Quality / I.T. / Hygiene: 35552576564 / 35552576510 / 35552576480 / 35552576583
- Build 216 Development proof: 35552576627
- Production main: 0e6312ed188c3423fdf32b18c892ff4d17c387bc
- Production Pages / Live Resources: 35552841763 / 35552906462
- Product Browser / Route: 35552906457 / 35552906453
- Build 216 Production proof: 35552841726
- Exact Production URL: https://401aaffc.devilndove-site.pages.dev

Build 217 **Production Cost Evidence v2** is the active candidate. Migration `0017_release467_production_cost_evidence_v2.sql` adds nullable Creative Project manufacturing source evidence for setup, machine and hands-on labour time; consumables, finishing, prototype waste/rework and outside-service cost; failed prototype count; and produced/accepted quantity.

Inventory remains the material-use/cost authority. Finance/Accounting remains the profitability/posting authority. Blank cost fields remain unknown rather than silently becoming zero.

### Restart resolution rule
Resolve live dev and main first. Build 218 starts only after Build 217 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 212/213 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
