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
## Current Release 467 restart authority — Build 269 candidate

Build 268 **CAIP Private-Media Recovery Hardening Closure** is the exact fully verified Development and Production predecessor.

- Development SHA: `139310232fb103cb2c843dc4d409ecdb7d4bb701`
- exact Development/Production tree: `86f0a6c3e378944f0f97cbd32ff416d4abbe3767`
- Development proofs: System `36176223381`, Quality `36176223395`, I.T. `36176223268`, Hygiene `36176223158`, Build 268 `36176223314`
- Production main SHA: `44da8087958eb0c64df3de892ca8628293a96231`
- Production proofs: Pages `36176423497`, Live Resource Integrity `36176498083`, Product Browser `36176498119`, Product Route `36176498113`, Build 268 `36176423468`
- exact predecessor proof remains recoverable through the reusable exact-SHA composition;
- canonical migrations remain **0001–0023**, with 0023 data-only.

Build 269 **Private Raw Media Intake Integrity** is the active bounded candidate. It aligns the standalone Build 269 migration artifact with the aggregate schema and existing runtime, retains bounded `sample_sha256_v1` content fingerprinting, renamed-file duplicate prevention, server-side same-project classification, clean recovery lineage through `recovery_of_file_id`, exact multipart part/byte/ETag completion checks and exact R2 HEAD-size verification.

Build 269 remains fail closed before binary transfer unless the Build 241 private-media tables, Build 269 duplicate-safe columns and `CAIP_PRIVATE_MEDIA_BUCKET` binding are proven. Missing prerequisites remain operator/configuration states, not upload success.

The deployed acceptance gaps remain explicit: Production private-bucket/non-public proof, real interruption/reconnect/reselection/resume evidence, real R2 multipart survival plus exact HEAD-size evidence, authenticated/privacy/phone-desktop review and Startup/Operational Continuity acceptance. Build 269 does not synthesize any of these.

Uncertain R2 deletion, duplicate/orphan cleanup execution, private-media deletion, automatic Production D1 migration, provider action, Product publication, Inventory movement, Finance posting, Production business-data copy and synthetic acceptance remain unauthorized.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 269, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

The future queue remains open. Next: **Build 270 — Strong-Fingerprint Backfill & Recovery Reconciliation**.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
