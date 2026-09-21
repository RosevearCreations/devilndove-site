# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0015`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 215 candidate

Build 214 **Prototype → Sample → Production Run** is the exact fully verified predecessor.

- Development SHA: `45a6bbb5ea01fa8b79ea9df331d87086ca5c7657`
- Shared tree: `6792f4ed926e3c52b197dfe8f3cc68e074b92d62`
- System / Quality / I.T. / Hygiene: `35544979662` / `35544979675` / `35544979731` / `35544979736`
- Build 214 Development proof: `35544979792`
- Production main: `6e3e8f04578998e16e1e8b8d27daad28b2332603`
- Production Pages / Live Resources: `35545124565` / `35545169766`
- Product Browser / Route: `35545169753` / `35545169742`
- Build 214 Production proof: `35545124482`
- Exact Production URL: `https://e817e044.devilndove-site.pages.dev`

Build 215 **Small-Batch, Corporate & Event Quoting** is the active candidate. Migration `0015_release467_small_batch_corporate_event_quoting.sql` adds structured quote terms and quantity tiers over the existing Custom Work quote draft/revision/line-item authority.

Build 215 does not create a second quote/payment/order engine. Unknown production cost remains unknown or partial until reviewed; payment/provider execution and real-order creation remain closed.

### Restart resolution rule
Resolve live `dev` and `main` first. Build 216 starts only after Build 215 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 212/213 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
