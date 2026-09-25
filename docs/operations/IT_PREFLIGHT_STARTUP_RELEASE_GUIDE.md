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
## Current Release 467 restart authority — Build 257 candidate

Build 256 **Refinement Outcomes Renewal II** is the exact verified predecessor:

- Development SHA: `601ea5eda5296c189388dc6df595d029687dfa1a`
- Shared Development/Production tree: `f7f8d07bedc07cd6f335fcbb8fb1c2443cee2c06`
- Development proofs: System `36075093498`, Quality `36075093559`, I.T. `36075093555`, Hygiene `36075093385`
- Build 256 dedicated Development proof: `36075093678`
- Production main: `36f48e66ea71b5cf598fb8bb7a9abce10e5ff7b9`
- Production proofs: Pages `36075244119`, Live Resources `36075319609`, Product Browser `36075319580`, Product Route `36075319601`
- Build 256 Production-specific proof: `36075244210`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 257 **Workflow Trigger Inventory & Ownership Map** is the active candidate. Its immutable pre-build baseline contains **146 workflow YAML files**. Trigger search before the Build 257 workflow was added measured **140 unique workflows** across the primary trigger families: **86 pull_request**, **90 push**, **89 workflow_dispatch**, **5 workflow_run**, and **1 issues**; schedule, repository_dispatch, workflow_call and pull_request_target were zero.

Build 257 keeps every pre-existing workflow file and adds only its own evidence workflow. It assigns every retained workflow a current proof owner. Historical Release 467 proof workflows with broad current-branch triggers are review candidates for **Build 258 — Historical Workflow Trigger Scope Tightening**; they are not disabled or deleted here. The five measured workflow_run chains remain separately owned post-deploy/recovery chains rather than being declared duplicates by trigger type alone.

Exact-SHA promotion, identical-tree continuity, the four canonical Development proofs, Production Pages Deploy, Live Resource Integrity, Product Browser and Product Route proofs remain mandatory.

No schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, branch-protection mutation or secret capture is introduced.

Build 257 remains blocked from Production until its exact candidate tree passes the current System, Quality, I.T., Hygiene and Build 257 checks, is merged to `dev`, and the identical Development tree is promoted to `main`.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
