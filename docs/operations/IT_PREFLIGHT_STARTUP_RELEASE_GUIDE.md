# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0008`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 207 candidate

Build 206 **Launch-Set Remediation Campaign** is the exact fully verified predecessor.

- Development SHA: `ee62ddd837d2ecbb8f0695fa7efb19e9dffb8b98`
- Shared tree: `4c71f152a75c401d3dfd2a5b83852a821dc82cb3`
- System / Quality / I.T. / Hygiene: `35486635313` / `35486635381` / `35486635362` / `35486635293`
- Build 206 Development proof: `35486635345`
- Production main: `16689f6eb5982bb72253aba677cfadf636c89ec9`
- Production Pages / Live Resources: `35486756097` / `35486808590`
- Product Browser / Route: `35486808652` / `35486808582`
- Build 206 Production proof: `35486756132`
- Exact Production URL: `https://065082cf.devilndove-site.pages.dev`

Build 207 **Workshop Capability & Process Taxonomy Expansion** is the active candidate. It extends the existing Build 156 `inventory_processes` authority through `0008_release467_workshop_process_taxonomy.sql`, preserving existing process keys and reviewed Tool/Supply assignments.

No parallel process dictionary is introduced. No existing Tool/Supply item is assigned automatically. Product, Inventory quantity/cost, Creative Project, Custom Work, Packaging, Media/CAIP, Finance and external provider/payment/publication authorities remain unchanged.

### Restart resolution rule
Resolve live `dev` and `main` first. Build 208 starts only after Build 207 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 206/207 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
