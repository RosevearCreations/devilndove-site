# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. The canonical Cloudflare Pages project is `devilndove-site`. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through data-only `0023`. Request-time DDL and automatic Production promotion remain closed.

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. Execute only bounded current-architecture runtime proof.
5. Promote the identical Development tree to protected `main` only after Development is GREEN.
6. Require exact Production Pages deployment and applicable runtime/resource acceptance.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 240 candidate

Build 239 **Admin Surface & Navigation Consolidation** is the exact verified predecessor:

- Development SHA: `f3594106fd74956e0aae524df7f75e53c84b9916`
- Shared tree: `3a4b02a5fcebb70475ea12698486fbea3775675a`
- Development proofs: System `35862488377`, Quality `35862487494`, I.T. `35862488308`, Hygiene `35862488113`
- Development preview: `https://d1934014.devilndove-site.pages.dev`
- Production main: `ca2f822ac5811f55abb8385d7e548b61097f24e8`
- Production proofs: Pages `35862809663`, Live Resources `35862907582`, Product Browser `35862907503`, Product Route `35862907598`
- Build 239 production gate: `35862809510`
- Exact Production URL: `https://7ac27371.devilndove-site.pages.dev`
- Business exit: `OWNER_AUTHORIZED_REFINEMENT_QUEUE_OPEN`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 240 **API Read Budget, Cache & Batch Streamlining** is the active owner-authorized refinement candidate. It also contains the reported Admin-home Firefox lockup by removing the Save Confidence MutationObserver feedback loop and bounding/coalescing the two existing read-only startup GETs.

Build 239 is exact-tree Development + Production GREEN. Build 240 remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
