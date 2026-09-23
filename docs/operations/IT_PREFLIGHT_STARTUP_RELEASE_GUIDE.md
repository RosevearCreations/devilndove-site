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
## Current Release 467 restart authority — Build 237 candidate

Build 236 **Save Confidence, Unsaved-Work Protection & Safe Batch Review** is the exact verified predecessor:

- Development SHA: `6385d67a726c82a049569d20537a55a9e727a19a`
- Shared tree: `616274b2701b2b071eb033a785371607aa13b97d`
- Development proofs: System `35857576835`, Quality `35857576801`, I.T. `35857576924`, Hygiene `35857576861`
- Production main: `07a1b3b115dbff380e6645837a610879c4f8eda7`
- Production proofs: Pages `35857748748`, Live Resources `35857829165`, Product Browser `35857829164`, Product Route `35857829198`
- Business exit: `OWNER_AUTHORIZED_REFINEMENT_QUEUE_OPEN`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 237 **Mobile, Touch, Keyboard & Dense-Workspace Ergonomics** is the active owner-authorized refinement candidate. It is presentation-only: sticky local actions, touch/focus improvements, narrow table/card presentation switching, and overflow/keyboard refinements.

Build 236 is exact-tree Production GREEN. Build 237 remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
