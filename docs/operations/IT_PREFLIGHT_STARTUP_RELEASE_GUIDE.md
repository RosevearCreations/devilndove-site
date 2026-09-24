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
## Current Release 467 restart authority — Build 249 candidate

Build 248 **Refinement Outcomes Review & Roadmap Renewal** is the exact verified predecessor:

- Development SHA: `2f46181a3c92568c2b192a83929a85f72a2b4374`
- Shared tree: `2db3a312cd0e7a6e24b07de4495d1d97898c7028`
- Development proofs: System `35942841810`, Quality `35942841817`, I.T. `35942841820`, Hygiene `35942841826`
- Build 248 dedicated proof: `35942841818`
- Production main: `e6ed352b5fe9f32b2cd6d049b00239fd643ebbc6`
- Production proofs: Pages `35943937792`, Live Resources `35944021002`, Product Browser `35944020958`, Product Route `35944020834`
- Build 248 Production-specific proof: `35943937473`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 249 **Refinement Runtime Measurement & Outcome Baseline** is the active candidate. It adds browser-local, session-only measurement for Admin route transitions, bounded startup request counts, Build 240 cache hits/misses and duplicate-read suppression without capturing query values, payloads, headers, secrets or remote telemetry.

Build 248 is exact-tree Development + Production GREEN. Build 249 remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
