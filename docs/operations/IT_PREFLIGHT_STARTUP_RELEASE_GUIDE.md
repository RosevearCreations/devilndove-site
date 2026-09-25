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
## Current Release 467 restart authority — Build 260 candidate

Build 259 **Reusable Exact-SHA Proof Composition** is the exact verified predecessor:

- Development SHA: `270eea921559b2439459180998cc367b6fe7c9bb`
- Shared Development/Production tree: `e81b613e5a4b491927ab89c89800345025853b99`
- Development proofs: System `36082784059`, Quality `36082784168`, I.T. `36082783908`, Hygiene `36082784042`
- Build 259 dedicated Development proof: `36082783905`
- Production main: `af294ad20ec26222ec0f7ccdb856f39de9fbbd2e`
- Production proofs: Pages `36082913970`, Live Resources `36082967263`, Product Browser `36082967302`, Product Route `36082967286`
- Build 259 Production-specific proof: `36082914063`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 260 **Pull-Request Matrix Fan-Out Reduction** is the active candidate. It removes only the `pull_request` trigger from exactly **38** historical release workflows: Builds **206–241 plus 258–259**. Every existing push evidence path remains, all 38 targets are manually dispatchable, every workflow file and historical gate script remains, and the canonical System Gate continues to execute the same gate contracts.

Build 256 full-scanner PR baseline: **87**. Build 259 full-scanner candidate: **149 workflow files / 73 pull-request / 123 push / 124 manual-dispatch / 5 workflow-run**; its exact final PR head ran **72** workflows.

With Build 260's active proof workflow added, the expected candidate is **150 workflow files / 36 pull-request / 124 push / 132 manual-dispatch / 5 workflow-run**, with **35 expected actual PR runs**.

The reusable exact-SHA composition remains required for Build 260. System, Quality, I.T., Hygiene, Build 260, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

No workflow or gate script deletion, schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, branch-protection mutation or secret capture is introduced.

Build 260 remains blocked from Production until its exact candidate passes the current System, Quality, I.T., Hygiene and Build 260 checks, is merged to `dev`, and the identical Development tree is promoted to `main`.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
