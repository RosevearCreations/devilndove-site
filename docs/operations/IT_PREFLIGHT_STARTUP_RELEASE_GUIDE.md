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
## Current Release 467 restart authority — Build 256 candidate

Build 255 **Production Reliability & Release Efficiency Review** is the exact verified predecessor:

- Development SHA: `6d8d006cad521f2ca9fb83b2d7a1ec62ad9347fb`
- Shared Development/Production tree: `7a6eaaeecdbc7b2bf5f8b015d8186f9ac8d8d398`
- Development proofs: System `36073942618`, Quality `36073942565`, I.T. `36073942615`, Hygiene `36073943552`
- Build 255 dedicated Development proof: `36073942420`
- Production main: `c5ef57106fe84b386230d686b46d11ea30c35576`
- Production proofs: Pages `36074089250`, Live Resources `36074174209`, Product Browser `36074174144`, Product Route `36074174120`
- Build 255 Production-specific proof: `36074089765`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 256 **Refinement Outcomes Renewal II** is the active candidate. It re-measures Builds 249–255. Their accepted Development/Production heads account for **870** workflow runs: **863** success, **7** historical failures, **0** skipped and **0** rerun attempts. Build 255 itself is clean at **70/70 Development + 64/64 Production**.

The renewal does not invent route friction: Build 254 still has no real browser-local session evidence justifying route-specific remediation. The evidence-backed residuals are high release-proof fan-out and the Build 250 `operations-today-tasks-read` hotspot, measured at **2,178 / 25,000 rows read** with **13 SELECT statements**.

Build 256 therefore authorizes the bounded successor roadmap **Builds 257–264**, beginning with **Build 257 — Workflow Trigger Inventory & Ownership Map**. Exact-SHA promotion, identical-tree continuity and named Production resource proofs remain mandatory.

No schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, personal-data capture or secret capture is introduced.

Build 256 remains blocked from Production until its exact candidate tree passes the current System, Quality, I.T., Hygiene and Build 256 checks, is merged to `dev`, and the identical Development tree is promoted to `main`.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
