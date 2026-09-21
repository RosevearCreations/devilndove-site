# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0018`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 219 candidate

Build 218 **Quote ↔ Production Cost ↔ Margin Guardrails** is the exact fully verified predecessor.

- Development SHA: 068b99a9f4f5e32e4d3547a69a23549d9dcd1c1a
- Shared tree: 0bb22258a030eb529be3a7b5faf9ba12baa66f46
- System / Quality / I.T. / Hygiene: 35556952902 / 35556952735 / 35556952815 / 35556952797
- Build 218 Development proof: 35556952722
- Exact Development URL: https://8d25c91e.devilndove-site.pages.dev
- Production main: 24b59add984ea0be5acc3ebe3bf8ae558db747ee
- Production Pages / Live Resources: 35557094198 / 35557137931
- Product Browser / Route: 35557137831 / 35557137932
- Build 218 Production proof: 35557094182
- Exact Production URL: https://b8567968.devilndove-site.pages.dev
- Deployment ID: b8567968-da64-41b9-b378-965fd942ea6d

Build 219 **Manufacturing Work Order & Job Traveler** is the active candidate. It introduces additive canonical migration 0018 for versioned reviewed traveler evidence. The generated traveler freezes source-authority evidence and detects later source drift by SHA-256; it never becomes a duplicate Product, Inventory, Packaging, CAIP, quote, proof or Finance editor.

### Restart resolution rule
Resolve live dev and main first. Build 220 starts only after Build 219 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 212/213 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
