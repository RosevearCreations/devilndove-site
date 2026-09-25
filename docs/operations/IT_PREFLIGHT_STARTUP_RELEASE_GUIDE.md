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
## Current Release 467 restart authority — Build 261 candidate

Build 260 **Pull-Request Matrix Fan-Out Reduction** is the exact verified predecessor:

- Development SHA: `28b6f64d43f05e6c00a1cec579fa51f6a8797c0d`
- Shared Development/Production tree: `bde6ee54115f549d47f9d1fcf1f59b016f099a79`
- Development proofs: System `36084629755`, Quality `36084629532`, I.T. `36084629588`, Hygiene `36084629993`
- Build 260 dedicated Development proof: `36084629902`
- Production main: `2f227d8ceb2239b5dc95b6f7a730c755a338d6f2`
- Production proofs: Pages `36084774858`, Live Resources `36084851964`, Product Browser `36084851996`, Product Route `36084851949`
- Build 260 Production-specific proof: `36084775035`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 261 **Production Proof Dependency Orchestration** is the active candidate. It removes only the Production `main` branch from the push filters of exactly **39** historical release-proof workflows: Builds **206–241 plus 258–260**. Development `dev` push evidence and `workflow_dispatch` manual evidence remain available, and no workflow or gate script is deleted.

The canonical Production dependency is unchanged and remains independently visible:

1. **Production Pages Deploy** on exact `main`.
2. **Production Live Resource Integrity Proof** after successful Production Pages.
3. **Release 467 Build 155 Products Production Browser Proof** after successful Production Pages.
4. **Release 467 Build 154 Products Route Production Proof** after successful Production Pages.

All **5** repository `workflow_run` chains remain. Build 261 does not collapse separately owned post-deploy proofs merely to reduce workflow count.

With the Build 261 proof workflow included, the candidate inventory is **151 workflow files / 37 pull-request / 125 push / 133 manual-dispatch / 5 workflow-run**. The material Production reduction is **39 historical main-push subscriptions removed**.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 261, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

No workflow or gate script deletion, schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, branch-protection mutation or secret capture is introduced.

Build 261 remains blocked from Production until its exact candidate passes the current System, Quality, I.T., Hygiene and Build 261 checks, is merged to `dev`, and the identical Development tree is promoted to `main`.

The future queue remains open. The next bounded release is **Build 262 — Operations Today-Tasks Read Fan-Out Review**.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
