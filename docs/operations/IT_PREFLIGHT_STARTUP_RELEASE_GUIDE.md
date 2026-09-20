# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0008`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 208 candidate

Build 207 **Workshop Capability & Process Taxonomy Expansion** is the exact fully verified predecessor.

- Development SHA: `ead5fcb06f9b0e849736a66d5032274ca99de830`
- Shared tree: `22a246a035f421856a705643c59ccb4171854d71`
- System / Quality / I.T. / Hygiene: `35514290109` / `35514290237` / `35514290207` / `35514290217`
- Build 207 Development proof: `35514290132`
- Production main: `0937de81d2610788db5315b675d92c055c9db549`
- Production Pages / Live Resources: `35514481645` / `35514524661`
- Product Browser / Route: `35514524666` / `35514524708`
- Build 207 Production proof: `35514481601`
- Exact Production URL: `https://37b30f80.devilndove-site.pages.dev`

Build 208 **Multi-Discipline Public Positioning & Capability Navigation** is the active candidate. It reorganizes existing Home, shared navigation, Shop and Custom Work discovery around five public dimensions without creating a second Product catalog, process taxonomy, capability database or Custom Work system.

Canonical migrations remain `0001–0008`. Build 208 introduces no schema or D1 business-data mutation. Canada-first commerce and the U.S.-sales/shipping pause remain visible.

### Restart resolution rule
Resolve live `dev` and `main` first. Build 209 starts only after Build 208 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 207/208 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
