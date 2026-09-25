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
## Current Release 467 restart authority — Build 262 candidate

Build 261 **Production Proof Dependency Orchestration** is the exact verified predecessor:

- Development SHA: `c4e57f8d4c47a709021fca65037b25f4e74d63e2`
- Shared Development/Production tree: `a442d160e1619e4b362de2bbda509ab25c310290`
- Development proofs: System `36087874819`, Quality `36087874854`, I.T. `36087874772`, Hygiene `36087874784`
- Build 261 dedicated Development proof: `36087874900`
- Production main: `f90944f80ec193610d3b87312487799ec425d983`
- Production proofs: Pages `36088094461`, Live Resources `36088159346`, Product Browser `36088159392`, Product Route `36088159367`
- Build 261 Production-specific proof: `36088094406`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 262 **Operations Today-Tasks Read Fan-Out Review** is the active candidate. The Build 250 exact Development measurement remains the evidence baseline: **13 top-level Today Tasks SELECT statements**, **1,132 provider rows read**, Today Tasks hard ceiling **15,000**, Seller Daily ceiling **10,000**, and aggregate ceiling **25,000**.

The bounded implementation changes only the six latest-action point lookups. The same six task keys and the same `created_at DESC, today_task_action_id DESC LIMIT 1` semantics are composed into one read-only D1 statement. The six task-count queries and runtime-incident detail query are unchanged.

The target is therefore **13 → 8 top-level provider statements**, a reduction of **5**, with no provider ceiling increase. Exact Development provider measurement must prove **8** Today Tasks statement metadata rows and stay under all existing ceilings before Production promotion.

Provider measurement is Development-only against `devilndove-dev`. Production D1 contact is **ZERO**. No schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, branch-protection mutation or secret capture is introduced.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 262, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

Build 262 remains blocked from Production until its exact Development SHA passes the current proof set and Development provider read-budget measurement, is merged to `dev`, and the identical Development tree is promoted to `main`.

The future queue remains open. The next bounded release is **Build 263 — Release Efficiency & Read-Budget Outcome Verification**.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
