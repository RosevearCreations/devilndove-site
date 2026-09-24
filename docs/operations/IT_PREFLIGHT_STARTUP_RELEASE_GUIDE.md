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
## Current Release 467 restart authority — Build 248 candidate

Build 247 **Non-Product Visual Coverage & Media Placement Closure** is the exact verified predecessor:

- Development SHA: `6b201a410636d3e861e7a1e554c04afd16e81ce3`
- Shared tree: `a581c34f7ad45f9a7fd75411f917df8f8f1f5a46`
- Development proofs: System `35940527918`, Quality `35940528047`, I.T. `35940528277`, Hygiene `35940527817`
- Build 247 dedicated proof: `35940528485`
- Production main: `7a51ae487552d3b2d7bdf4a048ef33380ccaa917`
- Production proofs: Pages `35940742900`, Live Resources `35940804209`, Product Browser `35940804268`, Product Route `35940804298`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 248 **Refinement Outcomes Review & Roadmap Renewal** is the active candidate. It records measured refinement outcomes, keeps unmeasured runtime/provider deltas explicit, and renews the evidence-driven queue through Build 256.

Build 247 is exact-tree Development + Production GREEN. Build 248 remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
