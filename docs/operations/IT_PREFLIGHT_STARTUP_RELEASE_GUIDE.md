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
## Current Release 467 restart authority — Build 259 candidate

Build 258 **Historical Workflow Trigger Scope Tightening** is the exact verified predecessor:

- Development SHA: `3675554c0c2ce64923ec3e1763a243e03d103f1a`
- Shared Development/Production tree: `64dab693be764fb11a3cb9c36d06352a2f02eb1a`
- Development proofs: System `36081394811`, Quality `36081394936`, I.T. `36081394824`, Hygiene `36081394851`
- Build 258 dedicated Development proof: `36081394877`
- Production main: `436c4e724efc736492f9772ffea7d5141feb3416`
- Production proofs: Pages `36081526239`, Live Resources `36081651628`, Product Browser `36081651602`, Product Route `36081651629`
- Build 258 Production-specific proof: `36081526248`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 259 **Reusable Exact-SHA Proof Composition** is the active candidate. It introduces one read-only reusable GitHub composite action backed by a Python verifier. The component requires exact Development and Production SHAs and independently preserves the named System, Quality, I.T., Hygiene, Pages, Live Resource, Product Browser, Product Route and build-specific requirements.

Build 258's active proof workflow is refactored to use the reusable composition; Build 259 uses the same component against the exact Build 258 closure. Historical manual-only Build 242–257 workflows are intentionally not rewritten.

The Build 258 full-scanner baseline is 148 workflow files / 72 pull-request / 122 push / 123 manual-dispatch / 5 workflow-run. Build 259 adds only its active proof workflow, for an expected 149 workflow files / **73 pull-request** / **123 push** / **124 manual-dispatch** / **5 workflow-run**.

Exact-SHA promotion, identical-tree continuity, the four canonical Development proofs, Production Pages Deploy, Live Resource Integrity, Product Browser and Product Route proofs remain mandatory.

No schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, branch-protection mutation or secret capture is introduced.

Build 259 remains blocked from Production until its exact candidate tree passes the current System, Quality, I.T., Hygiene and Build 259 checks, is merged to `dev`, and the identical Development tree is promoted to `main`.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
