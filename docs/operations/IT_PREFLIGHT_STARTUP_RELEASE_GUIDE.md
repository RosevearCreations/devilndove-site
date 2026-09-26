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
## Current Release 467 restart authority — Build 270 candidate

Build 269 **Private Raw Media Intake Integrity** is the exact fully verified Development and Production predecessor.

- Development SHA: `059aa3cf7854d075529ce976bb65ae2c1c6254fc`
- exact Development/Production tree: `65b54187a47834a7a36a3f57b16f985eb5d4cb05`
- Development proofs: System `36180407045`, Quality `36180407199`, I.T. `36180406666`, Hygiene `36180407194`, Build 269 `36180406990`
- Production main SHA: `61cc1346f838a5dd742b0dbaeff345d95447ba6e`
- Production proofs: Pages `36180648384`, Live Resource Integrity `36180717931`, Product Browser `36180718046`, Product Route `36180717954`, Build 269 `36180648437`
- exact predecessor proof remains recoverable through the reusable exact-SHA composition;
- canonical migrations remain **0001–0023**, with 0023 data-only.

Build 270 **Strong-Fingerprint Backfill & Recovery Reconciliation** is the active bounded candidate. The explicit operator action strengthens missing `sample_sha256_v1` fingerprints and reconciles only existing uploaded/private registration state whose R2 object and recovery lineage are sufficiently proven.

Each request is capped at 20 records and defaults to 8. Fingerprint backfill uses exact R2 HEAD-size verification plus bounded range reads. Uploaded/unregistered rows are eligible for private registration repair only when a strong fingerprint exists, the exact R2 size matches, no multipart/size-integrity marker is present, and any `recovery_of_file_id` parent is in the same project under a distinct object key.

Rows that cannot pass those checks remain preserved for review. Build 270 performs no automatic R2 deletion, no duplicate/orphan cleanup, no replacement upload and no public promotion.

The deployed acceptance gaps remain explicit where not already proven: Production private-bucket/non-public proof, real interruption/reconnect/reselection/resume evidence, real R2 multipart survival plus exact HEAD-size evidence, authenticated/privacy/phone-desktop review and Startup/Operational Continuity acceptance. Build 270 does not synthesize any of these.

Uncertain R2 deletion, private-media deletion, automatic Production D1 migration, provider action, Product publication, Inventory movement, Finance posting, Production business-data copy and synthetic acceptance remain unauthorized.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 270, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

The future queue remains open. Next: **Build 271 — Standalone / Social CAIP Project Workflow**.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
