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
## Current Release 467 restart authority — Build 255 candidate

Build 254 **Operator Journey Friction Review** is the exact verified predecessor:

- Development SHA: `95ad971789a7f207c1bc64103e68cd28204a3e50`
- Shared Development/Production tree: `7da896d6d154460950844b44bc179a8354b836f2`
- Development proofs: System `36070577487`, Quality `36070577680`, I.T. `36070577821`, Hygiene `36070578110`
- Build 254 dedicated Development proof: `36070577943`
- Production main: `46224bcfebbf12bec95383a03e188e00674d3326`
- Production proofs: Pages `36071988396`, Live Resources `36072048200`, Product Browser `36072048278`, Product Route `36072048280`
- Build 254 Production-specific proof: `36071988190`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 255 **Production Reliability & Release Efficiency Review** is the active candidate. The bounded GitHub Actions review covers accepted `dev` and `main` heads for Builds 242–254: **1,551** workflow runs, **1,519** success, **19** failure, **13** skipped and **0** rerun attempts on those accepted heads. Build 254 itself is the clean current baseline at **70/70 Development + 64/64 Production** successful runs.

Build 255 preserves exact-SHA promotion and identical-tree continuity. It reuses the I.T., Reliability and Deployment Preflight surfaces instead of adding a parallel release dashboard. No workflow consolidation is applied unless equivalent exact-SHA proof coverage can be maintained.

No schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, personal-data capture or secret capture is introduced.

Build 255 remains blocked from Production until its exact candidate tree passes the current System, Quality, I.T., Hygiene and Build 255 checks, is merged to `dev`, and the identical Development tree is promoted to `main`.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
