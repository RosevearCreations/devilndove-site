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
## Current Release 467 restart authority — Build 227 candidate

Build 226 **Capability Profile Coverage Closure** is the exact fully verified Development and Production predecessor.

- Development SHA: `a3f220deb8c4cef7a2143ab1960c2ea33454ad6d`
- Shared tree: `c21821ae1ac1ba931b1f38e8fb3b9641bd3b4b3f`
- System Gate: `35667972994`
- Current Application Quality Proof: `35667973054`
- I.T. Admin Runtime Proof: `35667973089`
- Repository Branch Hygiene: `35667973130`
- Build 226 Development proof: `35667972987`
- Exact Development preview: `https://d041c726.devilndove-site.pages.dev`
- Production main SHA: `8a4adf0a9108f482edd7aaa0c2f7e27d843a9d2e`
- Production Pages Deploy: `35668227904`
- Production Live Resource Integrity: `35668338010`
- Product Browser Proof: `35668337892`
- Product Route Proof: `35668337966`
- Build 226 Production proof: `35668227824`
- Exact Production deployment: `https://eb805f65.devilndove-site.pages.dev`

Build 227 **Manufacturing Adoption Command Centre** is a GET-only operator adoption/readiness layer over the existing Build 210–220 authorities. It distinguishes `NO_REAL_WORK_YET` from `BROKEN_EXISTING_AUTHORITY`, exposes missing prerequisites and next valid existing workflow actions, and creates no synthetic Production business records. Build 227 adds no schema migration; the canonical stream remains 0001–0022.

Build 228 remains blocked until Build 227 is exact-SHA Production GREEN. The future queue has not run out; Builds 228–232 remain planned.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
