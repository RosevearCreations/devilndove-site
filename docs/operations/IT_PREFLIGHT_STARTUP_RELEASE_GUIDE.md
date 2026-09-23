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
## Current Release 467 restart authority — Build 235 candidate

Build 234 **Workflow Help, Empty States & Recovery Guidance** is the exact verified predecessor:

- Development SHA: `b2ea3fdc6277751483d95dfc4700a85a7898b6b6`
- Shared tree: `a5cbb736ebf496bf1be3fbcce902cd50c6d8b1de`
- Development proofs: System `35798441644`, Quality `35798441665`, I.T. `35798441497`, Hygiene `35798441629`
- Production main: `5d7e86d25eb114ddfd2a0ede877a0dcf5a866507`
- Production proofs: Pages `35798690001`, Live Resources `35798742625`, Product Browser `35798742655`, Product Route `35798742683`
- Business exit: `OWNER_AUTHORIZED_REFINEMENT_QUEUE_OPEN`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 235 **Resume Work & Cross-Workspace Handoff** is the active owner-authorized refinement candidate. It converges existing recent work, favourites, Today Needs Attention and universal search through the canonical navigation manifest. It performs no automatic business action or business-data/provider mutation.

Build 234 is exact-tree Production GREEN. Build 235 remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
