# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. The canonical Cloudflare Pages project is `devilndove-site`. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through data-only `0022`. Request-time DDL and automatic Production promotion remain closed.

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. Execute only bounded current-architecture runtime proof.
5. Promote the identical Development tree to protected `main` only after Development is GREEN.
6. Require exact Production Pages deployment and applicable runtime/resource acceptance.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 233 candidate

Build 232 **Manufacturing Outcomes Review & Roadmap Renewal** is the exact verified predecessor:

- Development SHA: `f0067f89f94a9bb7ef7ad14510ec1cfb023d8cb8`
- Shared tree: `3fcfd435a8618dc64244f53d0ceca1379878dcdd`
- Development proofs: System `35739960877`, Quality `35739960401`, I.T. `35739960703`, Hygiene `35739960845`, Build proof `35739960789`
- Production main: `d5e9922b629f99c5653f5b884861a2c18358b44f`
- Production proofs: Pages `35740221037`, Live Resources `35740304575`, Product Browser `35740304505`, Product Route `35740304478`, Build proof `35740221128`
- Business exit: `HOLD_NO_PUBLISHABLE_EVIDENCE`
- Canonical migrations remain **0001–0022**.

Build 233 **Universal Help & Quality-of-Life Coverage** is the active owner-authorized refinement candidate. It extends the existing shared ⓘ runtime, separates Customer Help from Creator & Operations Help, and performs no business-data/provider mutation.

Build 232 is exact-SHA Production GREEN and closed the prior roadmap. Build 233 begins the owner-authorized Builds 233–248 refinement roadmap and remains blocked from Production until its exact Development head is fully GREEN.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
