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
## Current Release 467 restart authority — Build 250 candidate

Build 249 **Refinement Runtime Measurement & Outcome Baseline** is the exact verified predecessor:

- Development SHA: `fe7ac18156f2cbe83c67536be27b77756d29c696`
- Shared tree: `bec700bf173ef7cc07b74aafdde4db6d362faad1`
- Development proofs: System `35945324462`, Quality `35945324867`, I.T. `35945324872`, Hygiene `35945324865`
- Build 249 dedicated proof: `35945324387`
- Production main: `94e4561f6b47337538a23ef2404f456237961ca3`
- Production proofs: Pages `35945579057`, Live Resources `35945652794`, Product Browser `35945652743`, Product Route `35945652805`
- Build 249 Production-specific proof: `35945579187`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 250 **Startup & Provider Read-Budget Verification** is the active candidate. It enforces browser-local Admin startup ceilings and runs SELECT-only provider rows_read probes against canonical Development D1 only. Production D1 contact/business-data copy, D1/R2 mutation, provider execution/publication, Inventory movement and Finance posting remain closed.

Build 249 is exact-tree Development + Production GREEN. Build 250 remains blocked from Production until its exact Development head, provider budget proof and required release gates are GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
