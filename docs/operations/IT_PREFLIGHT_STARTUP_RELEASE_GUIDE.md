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
## Current Release 467 restart authority — Build 238 candidate

Build 237 **Mobile, Touch, Keyboard & Dense-Workspace Ergonomics** is the exact verified predecessor:

- Development SHA: `06cb191758b204fbbc3912ae533bec6c6fd227ad`
- Shared tree: `51fc6b9a4c0910f42bbbee9bf7d7a8aa756220b5`
- Development proofs: System `35858747170`, Quality `35858747245`, I.T. `35858747280`, Hygiene `35858746503`
- Production main: `53c0d8e4ed7cb9ea1691198e25a51f556a2ce0b3`
- Production proofs: Pages `35858981317`, Live Resources `35859107887`, Product Browser `35859108079`, Product Route `35859107986`
- Business exit: `OWNER_AUTHORIZED_REFINEMENT_QUEUE_OPEN`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 238 **Attention, Notifications & Operator Signal Cleanup** is the active owner-authorized refinement candidate. Existing Runtime Incidents, Notification Queue and Today Needs Attention remain authoritative; Build 238 only converges ranking, ownership cues and visual priority.

Build 237 is exact-tree Production GREEN. Build 238 remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
