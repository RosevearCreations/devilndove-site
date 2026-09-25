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
## Current Release 467 restart authority — Build 267 candidate

Build 266 **CAIP Multipart Recovery Integrity Review** is the exact Production predecessor:

- Development SHA: `c2f4a123b029853438260f06f0582a3902adf0c4`
- exact Development/Production tree: `6986989e2aa860a639ed8d6748a0c3143b32054d`
- Development proofs: System `36156294854`, Quality `36156294795`, I.T. `36156294784`, Hygiene `36156294718`, Build 266 `36156294779`
- Production main SHA: `1d4a1c204d19c4ecca16dd8dd6952b5107327db8`
- Production proofs: Pages `36156595435`, Live Resource Integrity `36156682258`, Product Browser `36156682086`, Product Route `36156682143`, Build 266 `36156595028`
- exact predecessor proof remains recoverable through the reusable exact-SHA composition;
- canonical migrations remain **0001–0023**, with 0023 data-only.

Build 267 **CAIP Duplicate & Orphan Recovery Classification** is the active read-only candidate.

Current classification rules:
- uploaded registered raw originals are canonical and immutable;
- same-project strong content fingerprint + exact size is a duplicate candidate, not automatic delete proof;
- legacy metadata fingerprint + exact size is weaker compatibility evidence;
- equal verified checksums, zero asset/processing/promotion references, distinct object identity and exact R2 HEAD size are required before the existing explicit reviewed cleanup authority can even consider physical duplicate deletion;
- Build 267 itself executes no duplicate cleanup and no orphan cleanup;
- uploaded D1 rows without a Creative Asset are `D1_COMPLETED_UNREGISTERED_BINARY_REVIEW`, not safe orphans;
- R2 raw objects without corresponding D1 identity are only `OBJECT_ONLY_ORPHAN_CANDIDATE` pending bounded reconciliation;
- D1/asset identity whose referenced R2 object is proven missing becomes `D1_ONLY_MISSING_OBJECT_RECOVERY`; metadata/history stay preserved;
- integrity-failed finalized binaries remain preserved and clean recovery uses a new identity;
- `recovery_of_file_id` lineage remains intact;
- uncertain R2 deletion remains unauthorized.

The deployed Startup boundary remains evidence-dependent. Live Production interruption/reconnect/reselection/resume, private `CAIP_PRIVATE_MEDIA_BUCKET` binding, non-public exposure, and real object/D1 reconciliation still require operator/environment evidence before Production private-media acceptance can be declared.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 267, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

No schema/request-time DDL, D1/R2 business or media mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, Production business-data copy, duplicate/orphan cleanup execution, uncertain R2 delete, branch-protection mutation or secret capture is introduced.

The future queue remains open. The next bounded release is **Build 268 — CAIP Private-Media Recovery Hardening Closure**.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
