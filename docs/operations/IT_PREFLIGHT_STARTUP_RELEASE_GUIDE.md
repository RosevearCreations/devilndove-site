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
## Current Release 467 restart authority — Build 273 candidate

Build 272 **Upload Prerequisite & Operator Readiness** is the exact fully verified Development and Production predecessor.

- Development SHA: `7cf4f6858c664a444499245a6b878491dceecb5f`
- exact Development/Production tree: `875f5cf60dd1118036f6bf5a18c0748e6e9b8d71`
- Development proofs: System `36209187858`, Quality `36209187822`, I.T. `36209187867`, Hygiene `36209187908`, Build 272 `36209187949`
- Production main SHA: `e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f`
- Production proofs: Pages `36209298966`, Live Resource Integrity `36209339128`, Product Browser `36209339067`, Product Route `36209339102`, Build 272 `36209299044`
- canonical migrations remain **0001–0023**, with 0023 data-only.

Build 273 **Content Studio Standalone-Project Bridge** is the active bounded candidate.

Content Studio may create or refresh exactly one package for an existing Creative Process project only when exactly one non-archived CAIP workspace matches the same `creative_work_project_id`. Missing, duplicate or conflicting CAIP identity fails closed.

A missing Content Studio package is not treated as a missing Creative Process or CAIP project. Build 273 creates only the package row under the existing unique source identity and reuses that same package on refresh.

Build 273 adds no migration, request-time schema repair, Creative Process project creation, CAIP project creation, fake Product, R2 deletion, public promotion, Inventory/Finance movement or provider execution.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 273, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

The future queue remains open. Next: **Build 274 — Creative Process Planned-vs-Actual Inventory Lifecycle**.
## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
