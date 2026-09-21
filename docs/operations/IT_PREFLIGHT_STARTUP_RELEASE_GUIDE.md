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
## Current Release 467 restart authority — Build 226 candidate

Build 225 **Storefront Launch-Set Remediation Execution II** is the exact fully verified Development and Production predecessor.

- Development SHA: `e759f09d069170fe04092651f87fe727d8ecdc80`
- Shared tree: `ba60ec9147def32da518f1c993f0099244e858f1`
- System Gate: `35647494752`
- Current Application Quality Proof: `35647494738`
- I.T. Admin Runtime Proof: `35647495428`
- Repository Branch Hygiene: `35647494747`
- Build 225 Development proof: `35647494740`
- Exact Development preview: `https://89ec1531.devilndove-site.pages.dev`
- Production main SHA: `82e819c33ef9d90ee440b73cb47ded1450cf9c2e`
- Production Pages Deploy: `35647907774`
- Production Live Resource Integrity: `35648076498`
- Product Browser Proof: `35648079711`
- Product Route Proof: `35648076097`
- Build 225 Production proof: `35647907634`
- Exact Production deployment: `https://2c35ccc8.devilndove-site.pages.dev`

Build 226 **Capability Profile Coverage Closure** closes the measured 21/22 public capability-profile gap through the existing Build 209 authority. The uncovered canonical process is `photography-content`. Migration 0022 is data-only and creates no parallel taxonomy.

Build 227 remains blocked until Build 226 is exact-SHA Production GREEN. The future queue has not run out; Builds 227–232 remain planned.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 224 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
