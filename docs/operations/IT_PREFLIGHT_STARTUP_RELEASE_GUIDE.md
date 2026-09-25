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
## Current Release 467 restart authority — Build 258 candidate

Build 257 **Workflow Trigger Inventory & Ownership Map** is the exact verified predecessor:

- Development SHA: `5e6fa8772be5946a0cd53eadbd4b3daa36fce253`
- Shared Development/Production tree: `df03a29c947144f298f0908abf53ca3cdda1c159`
- Development proofs: System `36077891398`, Quality `36077890063`, I.T. `36077891374`, Hygiene `36077890258`
- Build 257 dedicated Development proof: `36077890220`
- Production main: `9e95bca825599dea1459838e10812c74d799c976`
- Production proofs: Pages `36078157785`, Live Resources `36078244247`, Product Browser `36078244252`, Product Route `36078244289`
- Build 257 Production-specific proof: `36078158019`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 258 **Historical Workflow Trigger Scope Tightening** is the active candidate. It converts exactly **16** historical Release 467 proof workflows, Builds **242–257**, to **manual-only provenance** through `workflow_dispatch`. Every workflow file and historical Python gate script is retained.

The Build 257 candidate baseline measured 147 workflow files, 87 pull-request, 91 push, 90 manual-dispatch and 5 workflow-run triggers. With the Build 258 workflow added, the expected candidate is 148 workflow files, **72 pull-request**, **76 push**, **106 manual-dispatch** and the same **5 workflow-run** chains. This removes 15 automatic PR and 15 automatic push runs net while the System Gate continues executing the retained historical gate contracts directly.

Exact-SHA promotion, identical-tree continuity, the four canonical Development proofs, Production Pages Deploy, Live Resource Integrity, Product Browser and Product Route proofs remain mandatory.

No schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, branch-protection mutation or secret capture is introduced.

Build 258 remains blocked from Production until its exact candidate tree passes the current System, Quality, I.T., Hygiene and Build 258 checks, is merged to `dev`, and the identical Development tree is promoted to `main`.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
