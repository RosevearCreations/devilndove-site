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
## Current Release 467 restart authority — Build 252 candidate

Build 251 **CSP Style Injection-Surface Hardening** is the exact verified predecessor:

- Development SHA: `4d0c1c54c407393db5de3b6e3a519ddd7b1ce4dd`
- Shared Development/Production tree: `2d6d06e321693779cee55ed2dd892bff3b364a36`
- Development proofs: System `36031272271`, Quality `36031272780`, I.T. `36031272416`, Hygiene `36031272718`
- Build 251 dedicated Development proof: `36031272407`
- Production main: `f8e15d07e97e9a4e2953a65d09b494c73a36192a`
- Production proofs: Pages `36031593630`, Live Resources `36031748408`, Product Browser `36031748531`, Product Route `36031748437`
- Build 251 Production-specific proof: `36031593481`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 252 **Cross-Device Accessibility Acceptance Refresh** is the active candidate. It re-proves the existing phone/tablet/desktop layout boundaries, keyboard flow, focus visibility, coarse-pointer targets, dense Admin workspace behavior, local horizontal scrolling and reduced-motion behavior while retaining Build 251 CSP nonce protections.

Build 252 changes presentation acceptance only. It adds no schema or request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy or secret capture.

Build 252 remains blocked from Production until its exact candidate tree passes the current System, Quality, I.T., Hygiene and Build 252 checks, is merged to `dev`, and the identical Development tree is promoted to protected `main`.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
