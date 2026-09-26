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
## Current Release 467 restart authority — Build 277 candidate

Build 276 **CAIP Acceptance Evidence Freshness Baseline** is the exact fully verified Development and Production predecessor.

- Development SHA: `073ee3cacb7e7b7cac70e0e23db9ebebf386099f`
- exact Development/Production tree: `baed3242d5757a83832ab8526f940c971983bd73`
- Development proofs: System `36214675702`, Quality `36214675663`, I.T. `36214675743`, Hygiene `36214675846`, Build 276 `36214675710`
- Production main SHA: `1bfcb248a8baf8cea42467a75c0dac53884ec5c3`
- Production proofs: Pages `36214858334`, Live Resource Integrity `36214894567`, Product Browser `36214894586`, Product Route `36214894631`, Build 276 `36214858270`
- canonical migrations remain **0001–0023**, with 0023 data-only.

Build 277 **Private Bucket Binding & Non-Public Exposure Evidence** is the active bounded candidate.

Its dedicated workflow must prove the deployed Production `CAIP_PRIVATE_MEDIA_BUCKET` binding, denial of an unauthenticated HEAD-only request to the direct R2 S3 bucket endpoint, and HTTP `401` for unauthenticated secure-review access. The R2 public-domain configuration API returns `403` with the current CI tokens, so that permission result is not interpreted as either public or private. Only sanitized booleans/counts and boundary status are retained: no object list/download, no bucket ID/domain names, no secret values, no D1 business query and no mutation.

A GREEN Build 277 runtime proof satisfies this dimension as **1/3** fresh current-release CAIP acceptance dimensions. Authenticated review/range-streaming and interruption/reconnect/reselection/resume remain separate. Overall CAIP remains `EVIDENCE_DEPENDENT`.

The future queue remains open. Next: **Build 278 — Authenticated Private Review & Range-Streaming Acceptance Refresh**.
## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
