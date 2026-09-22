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
## Current Release 467 restart authority — Build 228 candidate

Build 227 **Manufacturing Adoption Command Centre** is the exact fully verified Development and Production predecessor.

- Development SHA: `86a599178cfe473afc4dba15890d47db66f015ea`
- Shared tree: `5694ea94c097505cc8db6795e839073fb210f746`
- System Gate: `35671994146`
- Current Application Quality Proof: `35671994173`
- I.T. Admin Runtime Proof: `35671994145`
- Repository Branch Hygiene: `35671994205`
- Build 227 Development proof: `35671994164`
- Production main SHA: `2fbbb950b2598a518d14078b0252a8159472fbb7`
- Production Pages Deploy: `35672279658`
- Production Live Resource Integrity: `35672342976`
- Product Browser Production Proof: `35672342991`
- Product Route Production Proof: `35672343003`
- Build 227 Production proof: `35672279694`

Build 228 **First Real Custom Work Route-to-Proof Pilot** is a GET-only pilot over the existing Build 210/211/213/215 Custom Work authorities. It uses legitimate operator-entered work only. When no legitimate request exists, `HOLD_NO_REAL_REQUEST` is a valid bounded exit; no synthetic customer, route, quote, proof or approval record may be created.

Build 229 remains blocked until Build 228 is exact-SHA Production GREEN. The future queue has not run out; Builds 229–232 remain planned.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
