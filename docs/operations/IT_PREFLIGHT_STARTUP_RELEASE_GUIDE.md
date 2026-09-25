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
## Current Release 467 restart authority — Build 266 candidate

Build 265 **CAIP Private-Media Prerequisite Inventory** is the exact Production predecessor:

- Development SHA: `1ac2f5f55228b3c8fbd86ea1e3d07cfb35edaa33`
- exact Development/Production tree: `d4f1da2902442d02e23becd06b5f05af30a86ac4`
- Development System Gate: `36151831375`
- Development Current Application Quality Proof: `36151831443`
- Development I.T. Admin Runtime Proof: `36151831358`
- Development Repository Branch Hygiene: `36151831299`
- Build 265 dedicated Development proof: `36151831255`
- Production main SHA: `28181d75fe8425244848ae5a06c86f54a446eb1b`
- Production Pages Deploy: `36152347971`
- Production Live Resource Integrity: `36152439772`
- Product Browser proof: `36152439922`
- Product Route proof: `36152439676`
- Build 265 Production proof: `36152348667`
- exact predecessor proof remains recoverable through the reusable exact-SHA composition;
- canonical migrations remain **0001–0023**, with 0023 data-only.

Build 266 **CAIP Multipart Recovery Integrity Review** is the active read-only candidate. It verifies the repository-resident interruption/resume, completed-part/ETag continuity, immutable-source identity and exact-size completion contracts without uploading or mutating Production media.

Current integrity review:
- already-uploaded D1 parts with retained R2 ETags are short-circuited server-side;
- browser recovery queues only parts not already marked uploaded;
- persisted byte ranges are used to slice the selected local file;
- current Worker-streamed multipart concurrency remains **2 parts**;
- each Worker-streamed part must exactly match the persisted part size;
- completion requires every expected part, every retained ETag, distinct part numbering from 1 through `expected_parts`, and an exact uploaded-byte sum;
- incomplete D1 evidence writes `[CAIP_MULTIPART_INCOMPLETE]` and blocks R2 `complete()`;
- successful multipart finalization must pass R2 `HEAD` with exact object size before registration;
- a finalized size mismatch writes `[CAIP_R2_SIZE_MISMATCH]`, remains unregistered, and preserves the binary for review;
- completed raw originals remain immutable through the intake control;
- integrity-failed recovery uses a new object identity rather than overwriting the uncertain prior R2 object;
- uncertain R2 deletion remains unauthorized;
- future `direct_s3_presigned_multipart` remains **not live**.

The deployed Startup boundary remains evidence-dependent. Live Production interruption/reconnect/reselection/resume, the private `CAIP_PRIVATE_MEDIA_BUCKET` binding, non-public bucket exposure and device/network recovery still require real operator/environment proof before Production CAIP private-media acceptance can be declared.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 266, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

No schema/request-time DDL, D1/R2 business or media mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, uncertain R2 delete, branch-protection mutation or secret capture is introduced.

The future queue remains open. The next bounded release is **Build 267 — CAIP Duplicate & Orphan Recovery Classification**.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
