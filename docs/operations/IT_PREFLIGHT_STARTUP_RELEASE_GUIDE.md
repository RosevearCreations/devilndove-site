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
## Current Release 467 restart authority — Build 264 candidate

Build 263 **Release Efficiency & Read-Budget Outcome Verification** is the exact verified predecessor:

- Development SHA: `ea930cd5c52e0d4f1d55fd9645fc24f5865900f2`
- Shared Development/Production tree: `e536e198fdb5f44b4430ae2d503e15731f2c9109`
- Development proofs: System `36136926977`, Quality `36136927022`, I.T. `36136927013`, Hygiene `36136926926`
- Build 263 dedicated Development proof: `36136927079`
- Production main: `7ee1ac700f451d35a20ff3d667c405086c5512ef`
- Production proofs: Pages `36137622970`, Live Resources `36138023445`, Product Browser `36138023151`, Product Route `36138023256`
- Build 263 Production-specific proof: `36137622753`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 264 **Refinement Outcomes Renewal III** is the active candidate. It reviews Builds 257–263, preserves the measured release-efficiency/read-budget gains, and renews the queue from repository-resident CAIP recovery evidence.

Measured closure retained:
- Build 256 baseline: **62.14 runs/head**
- Build 263 remeasurement: **48.67 runs/head**, a **21.69%** normalized reduction
- Build 255 closure **134 runs** → Build 262 closure **68 runs**, a **49.25%** reduction
- closure-scoped sample: **584/584 GREEN**
- Today Tasks: **13 → 8 statements**
- Development provider rows: **2,179 / 25,000 aggregate ceiling**
- Production D1 contact: **ZERO**
- 10 later noncanonical Browser Proof failures remain outside recorded closure windows; Build 264 does not authorize another broad trigger rewrite from that signal alone.

The repository already documents Build 269 as using the Build 241 foundation plus **Builds 265–268 recovery hardening**, and retains explicit Build 271, 272, 273 and 274 CAIP/Creative Process operating boundaries. Build 264 therefore authorizes `docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md`.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 264, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

No schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, uncertain R2 delete, branch-protection mutation or secret capture is introduced.

The future queue remains open. The next bounded release is **Build 265 — CAIP Private-Media Prerequisite Inventory**.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
