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
## Current Release 467 restart authority — Build 253 candidate

Build 252 **Cross-Device Accessibility Acceptance Refresh** is the exact verified predecessor:

- Development SHA: `ec749569908b2ebbf393ca1ec2181e586a10f548`
- Shared Development/Production tree: `bc93b89d4b649d035e4dc5cb0f9deeb9d01399e2`
- Development proofs: System `36042886754`, Quality `36042887036`, I.T. `36042887117`, Hygiene `36042886574`
- Build 252 dedicated Development proof: `36042887105`
- Production main: `3c14d72ed481035d82f3cffa2d16f733f603f1d9`
- Production proofs: Pages `36043164640`, Live Resources `36043274946`, Product Browser `36043274912`, Product Route `36043274915`
- Build 252 Production-specific proof: `36043164318`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 253 **Session & Abuse-Control Runtime Evidence** is the active candidate. It exercises cookie-first session resolution, CSRF/origin guards, authentication throttling, revoke-other-sessions and admin step-up behavior using bounded synthetic in-memory runtime scenarios.

Build 253 changes no authentication policy and uses no real credentials. It adds no schema or request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy or secret capture.

Build 253 remains blocked from Production until its exact candidate tree passes the current System, Quality, I.T., Hygiene and Build 253 checks, is merged to `dev`, and the identical Development tree is promoted to protected `main`.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
