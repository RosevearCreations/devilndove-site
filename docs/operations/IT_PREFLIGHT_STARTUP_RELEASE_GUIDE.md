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
## Current Release 467 restart authority — Build 278 candidate

Build 277 **Private Bucket Binding & Non-Public Exposure Evidence** is the exact fully verified Development and Production predecessor.

- Development SHA: `8ebe7a3a0c3460d35fbf2e1509bdb728b82db927`
- exact Development/Production tree: `3451ae4990328425ef6929643f1c04efe03d9f37`
- Development proofs: System `36241260475`, Quality `36241260391`, I.T. `36241260501`, Hygiene `36241260461`, Build 277 `36241260291`
- Production main SHA: `552fe0fb1b192c7fd123c9a7369eea9f352f639e`
- Production proofs: Pages `36241384277`, Live Resource Integrity `36241428433`, Product Browser `36241428444`, Product Route `36241428506`, Build 277 `36241384223`
- canonical migrations remain **0001–0023**, with 0023 data-only.

Build 278 **Authenticated Private Review & Range-Streaming Acceptance Refresh** is the active bounded candidate.

Its dedicated Development proof waits for the exact System Gate deployment, uses one existing private Development CAIP asset, creates the normal 5-minute/one-access administrator-bound secure review grant, requests `Range: bytes=0-0`, requires HTTP `206` plus all private/no-store/same-origin protections, and confirms a fresh `review_proxy_served` audit with `ranged_streaming=true`, `no_copy=true`, and `no_cache=true`. Raw session/review tokens and R2 object keys are excluded from evidence.

An existing active administrator session is preferred. If none is available, one bounded Development-only session may be created and must be deleted by the same workflow. No Production business-data mutation, Production media copy, R2 mutation, provider execution/publication, Product publication, Inventory/Finance movement or synthetic media is authorized.

A GREEN Build 278 runtime proof moves current-release CAIP acceptance from **1/3 to 2/3**. The overall lane remains `EVIDENCE_DEPENDENT` until the multipart interruption/reconnect/reselection/resume dimension is proven.

The future queue remains open. Next: **Build 279 — Multipart Interruption & Resume Acceptance Drill**.
## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
