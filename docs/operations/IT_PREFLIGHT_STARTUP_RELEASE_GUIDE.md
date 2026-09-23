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
## Current Release 467 restart authority — Build 241 candidate

Build 240 **API Read Budget, Cache & Batch Streamlining** is the exact verified predecessor:

- Development SHA: `82688fbe6a74e235b85b56bc21f82380131bb3bc`
- Shared tree: `b9d600e5eed18fe6697f42cf1588717437d4f725`
- Development proofs: System `35880685343`, Quality `35880685733`, I.T. `35880685713`, Hygiene `35880685361`
- Build 240 dedicated proof: `35874693925`
- Retained Build 176 main-thread proof: `35874694016`
- Production main: `87778556ac99c1e82217c4d2d45ead5bf1ef1b88`
- Production proofs: Pages `35881116063`, Live Resources `35881253740`, Product Browser `35881253749`, Product Route `35881253783`
- Build 240 production gate: `35877289310`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 241 **Cross-Authority Handoff Simplification** is the active owner-authorized refinement candidate. It passes existing identifiers between compatible Admin workspaces, lets destination clients preselect records they already own, and shows same-origin return-to-source links. It does not copy authoritative business records or add a business-write authority.

Build 240 is exact-tree Development + Production GREEN. Build 241 remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
