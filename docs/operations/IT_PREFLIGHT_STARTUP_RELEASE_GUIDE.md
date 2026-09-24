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
## Current Release 467 restart authority — Build 254 candidate

Build 253 **Session & Abuse-Control Runtime Evidence** is the exact verified predecessor:

- Development SHA: `42ad585550cbf76b39ab28d30ed345e177b8fb86`
- Shared Development/Production tree: `deeca5e877175af1c7c804b09bfbb14a9daa7df8`
- Development proofs: System `36066344734`, Quality `36066344961`, I.T. `36066344950`, Hygiene `36066346173`
- Build 253 dedicated Development proof: `36066344836`
- Production main: `ec4e665c34af6e6fbc1dc440411b8b7795deaeb5`
- Production proofs: Pages `36066849392`, Live Resources `36067030179`, Product Browser `36067030078`, Product Route `36067030066`
- Build 253 Production-specific proof: `36066849362`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 254 **Operator Journey Friction Review** is the active candidate. It uses the browser-local, pathname-only Build 249 route evidence and reports only threshold-backed repeated-navigation candidates. If the session has insufficient evidence, it records that fact rather than inventing friction.

Build 254 adds no parallel navigation layer and performs no automatic navigation rewrite. Build 239 exact-link consolidation remains the preferred remediation baseline. No schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, personal-data capture or secret capture is introduced.

Build 254 remains blocked from Production until its exact candidate tree passes the current System, Quality, I.T., Hygiene and Build 254 checks, is merged to `dev`, and the identical Development tree is promoted to protected `main`.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
