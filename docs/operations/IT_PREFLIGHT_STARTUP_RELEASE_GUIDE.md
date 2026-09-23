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

- Development SHA: `5977a1aa9674eb378d5aede0b31648a73ac770c6`
- Shared tree: `3ea103b093c4dcbf1670346dcce0ec6acf214470`
- Development proofs: System `35883357799`, Quality `35883358653`, I.T. `35883357777`, Hygiene `35883357974`
- Build 240 dedicated proof: `35874693925`
- Retained Build 176 main-thread proof: `35874694016`
- Production main: `ae9ca2b48700f4b48e6eb7e6bb465f0472d5e41f`
- Production proofs: Pages `35883719199`, Live Resources `35883846712`, Product Browser `35883846744`, Product Route `35883846755`
- Build 240 production gate: `35877289310`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 241 **Release, Diagnostics & Evidence Streamlining** is the active owner-authorized refinement candidate. It passes existing identifiers between compatible Admin workspaces, lets destination clients preselect records they already own, and shows same-origin return-to-source links. It does not copy authoritative business records or add a business-write authority.

Build 240 is exact-tree Development + Production GREEN. Build 241 remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
