# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0012`. Request-time DDL and automatic Production promotion remain closed.

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. Execute only bounded current-architecture runtime proof.
5. Promote the identical Development tree to protected `main` only after Development is GREEN.
6. Require exact Production Pages deployment and applicable runtime/resource acceptance.
7. Avoid unnecessary Production D1 reads for code/docs-only promotions.
8. Only then call `main` / Production GREEN.

Stripe Development, PayPal sandbox and Social/OAuth remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 212 candidate

Build 211 **Manufacturing Triage & Route Proposal** is the exact fully verified predecessor.

- Development SHA: `a7f07b18a4a3b24db1a148ec287cbf446041f573`
- Shared tree: `b80ccbfb772ccc4384e6fc0a2c53a62341e4caf7`
- System / Quality / I.T. / Hygiene: `35524455791` / `35524455693` / `35524455845` / `35524455852`
- Build 211 Development proof: `35524455858` (attempt 2)
- Production main: `41bf65727771c7c302c022d0944945a0802a909d`
- Production Pages / Live Resources: `35524655164` / `35524741052`
- Product Browser / Route: `35524741050` / `35524741073`
- Build 211 Production proof: `35524655209`
- Exact Production URL: `https://1d28f0f1.devilndove-site.pages.dev`

Build 212 **Hybrid Creative Project Operations** is the active candidate. Migration `0012_release467_hybrid_creative_project_operations.sql` adds ordered operation plans, predecessor dependencies and planning-only Inventory references to the existing Creative Process project authority.

Creative Process remains the project/event authority. `inventory_processes` remains canonical process identity. Inventory remains stock/usage authority, CAIP remains media/evidence authority and Finance remains financial authority.

### Restart resolution rule
Resolve live `dev` and `main` first. Build 213 starts only after Build 212 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 211/212 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
