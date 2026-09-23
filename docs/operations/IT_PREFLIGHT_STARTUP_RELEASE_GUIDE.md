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
## Current Release 467 restart authority — Build 236 candidate

Build 235 **Save Confidence, Unsaved-Work Protection & Safe Batch Review** is the exact verified predecessor:

- Development SHA: `b4c9d47752a146da3bfd3b8047ae5cc941c70d55`
- Shared tree: `6bceeefcab82beb5587fc05b053caf61dc587ef4`
- Development proofs: System `35802372348`, Quality `35802372207`, I.T. `35802372335`, Hygiene `35802372354`
- Production main: `b2fbbcc86d1e3c4925bee7e09287ed32519d7f34`
- Production proofs: Pages `35802505626`, Live Resources `35802559175`, Product Browser `35802559138`, Product Route `35802559194`
- Business exit: `OWNER_AUTHORIZED_REFINEMENT_QUEUE_OPEN`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 235 **Save Confidence, Unsaved-Work Protection & Safe Batch Review** is the active owner-authorized refinement candidate. It converges existing recent work, favourites, Today Needs Attention and universal search through the canonical navigation manifest. It performs no automatic business action or business-data/provider mutation.

Build 235 is exact-tree Production GREEN. Build 236 remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
