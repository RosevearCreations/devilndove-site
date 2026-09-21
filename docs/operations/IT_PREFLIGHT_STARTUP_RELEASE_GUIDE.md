# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0016`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 216 candidate

Build 215 **Small-Batch, Corporate & Event Quoting** is the exact fully verified predecessor.

- Development SHA: 825814b09a7c3f05c6fddc223ec8876ade0bbc35
- Shared tree: f1facb7a27e22f3a129654713cc6dd109e3b6b16
- System / Quality / I.T. / Hygiene: 35548513112 / 35548513093 / 35548513139 / 35548513160
- Build 215 Development proof: 35548513080
- Production main: c8366bde7fb2e7c673be656ff85265058a407c4a
- Production Pages / Live Resources: 35548670491 / 35548742503
- Product Browser / Route: 35548742488 / 35548742478
- Build 215 Production proof: 35548670519
- Exact Production URL: https://cec5e207.devilndove-site.pages.dev

Build 216 **Customer-Supplied Item Intake & Suitability Review** is the active candidate. Migration 0016_release467_customer_supplied_item_suitability_review.sql adds item-specific intake, append-only review, evidence-link and acknowledgement records over existing Custom Work, Build 211 triage and media authorities.

Unknown compatibility/material/safety facts remain explicit; evidence is link-only; automatic production, Inventory, payment/provider and publication action remain closed.

### Restart resolution rule
Resolve live dev and main first. Build 217 starts only after Build 216 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 212/213 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
