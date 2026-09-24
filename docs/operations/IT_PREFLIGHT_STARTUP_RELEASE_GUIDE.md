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
## Current Release 467 restart authority — Build 251 candidate

Build 250 **Startup & Provider Read-Budget Verification** is the exact verified predecessor:

- Development SHA: `f2eb36f2cae76e44a7e225c38fb4102cf1f9a84d`
- Shared tree: `41409f1d0a50793d9dda1f1184a2b8dcc8a2fda1`
- Development proofs: System `35999263313`, Quality `35999263281`, I.T. `35999263373`, Hygiene `35999263534`
- Build 250 dedicated proof: `35999263213`
- Production main: `4bbd5ffdd7063bdc7bb864c416b8a6f08cf2582e`
- Production proofs: Pages `35999481927`, Live Resources `35999606857`, Product Browser `35999606928`, Product Route `35999606852`
- Build 250 Production-specific proof: `35999481765`
- Build 250 Development provider evidence: Today Tasks `1,132`, Seller Daily `1,046`, aggregate `2,178` rows_read.
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 251 **CSP Style Injection-Surface Hardening** is the active candidate. Modern style elements are nonce-bound, dynamic `createElement('style')` paths inherit the response nonce, Packaging print styles are explicitly nonced, and Reliability's inline style block is moved to a same-origin stylesheet. Legacy `style=""` attributes remain explicitly compatible for this bounded release.

Build 250 is exact-tree Development + Production GREEN. Build 251 remains blocked from Production until its exact Development head and required release/security gates are GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
