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
## Current Release 467 restart authority — Build 272 candidate

Build 271 **Standalone / Social CAIP Project Workflow** is the exact fully verified Development and Production predecessor.

- Development SHA: `af45e733b673af8e8d7e9acb7e55e35f525bebec`
- exact Development/Production tree: `f0da384a9d0be6f54d5e0b441f7aa333c158e69f`
- Development proofs: System `36208079958`, Quality `36208080087`, I.T. `36208080075`, Hygiene `36208080004`, Build 271 `36208079968`
- Production main SHA: `fce84316c0b5b22781b2ee30d35b205d96b39c09`
- Production proofs: Pages `36208228266`, Live Resource Integrity `36208267834`, Product Browser `36208267848`, Product Route `36208267804`, Build 271 `36208228296`
- canonical migrations remain **0001–0023**, with 0023 data-only.

Build 272 **Upload Prerequisite & Operator Readiness** is the active bounded candidate.

Before the browser asks the operator to choose or drop a local file, CAIP must prove the Build 241 private-media tables, the Build 269 duplicate-safe columns and the private `CAIP_PRIVATE_MEDIA_BUCKET` binding. The same readiness contract is enforced again at the control plane, direct upload endpoint and multipart part endpoint.

Missing prerequisites are explicit operator/configuration states. They return `CAIP_UPLOAD_PREREQUISITE_BLOCKED` with `transfer_started: false`; they do not create transfer-failure evidence and do not trigger automatic schema or binding repair.

Build 272 adds no migration, no request-time DDL, no automatic bucket/binding mutation, no R2 deletion, no public promotion, no Inventory/Finance movement and no provider execution.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 272, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

The future queue remains open. Next: **Build 273 — Content Studio Standalone-Project Bridge**.
## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
