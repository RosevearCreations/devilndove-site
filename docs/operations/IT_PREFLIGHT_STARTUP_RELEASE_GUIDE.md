# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0014`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 214 candidate

Build 213 **Digital Proof & Customer Approval** is the exact fully verified predecessor.

- Development SHA: `3292ac5c20780e23bd9d5ae593368e82b6e4826b`
- Shared tree: `1108fecdeac23c69b8ea4d810c0375a0899ff469`
- System / Quality / I.T. / Hygiene: `35533703475` / `35533703446` / `35533703481` / `35533703474`
- Build 213 Development proof: `35533703458`
- Production main: `92df5745fc2d4311dfacfbd214c1032a34c46bb8`
- Production Pages / Live Resources: `35534081643` / `35534292686`
- Product Browser / Route: `35534292705` / `35534292692`
- Build 213 Production proof: `35534081642`
- Exact Production URL: `https://e8fa1e4b.devilndove-site.pages.dev`

Build 214 **Prototype → Sample → Production Run** is the active candidate. Migration `0014_release467_prototype_sample_production_run.sql` adds explicit manufacturing maturity and append-only transition evidence over existing Creative Process, Custom Work and Build 213 proof authorities.

Approved sample must reference exact evidence. Production authorization is a separate explicit human transition and does not start production, consume Inventory, create Product production-run rows, execute payment/provider work or publish media.

### Restart resolution rule
Resolve live `dev` and `main` first. Build 215 starts only after Build 214 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 212/213 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
