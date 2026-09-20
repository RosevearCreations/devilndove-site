# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0011`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 211 candidate

Build 210 **Custom Work Intake 2.0** is the exact fully verified predecessor.

- Development SHA: `228d50a0a71d8b99e24f888b8bcd25b9c839a396`
- Shared tree: `f8e85d5e91a9eee5a9c64901865efe24be1ad34e`
- System / Quality / I.T. / Hygiene: `35519319569` / `35519319561` / `35519319637` / `35519319612`
- Build 210 Development proof: `35519319562`
- Production main: `6e81942e7fd54157698b640252eed256b0411752`
- Production Pages / Live Resources: `35519559453` / `35519611667`
- Product Browser / Route: `35519611679` / `35519611767`
- Build 210 Production proof: `35519559362`
- Exact Production URL: `https://cae32d7d.devilndove-site.pages.dev`

Build 211 **Manufacturing Triage & Route Proposal** is the active candidate. Migration `0011_release467_manufacturing_triage_route.sql` adds reviewed triage and candidate-process route evidence linked to the existing `custom_requests` and canonical `inventory_processes` authorities.

Customer requirements remain requirements. Candidate processes, feasibility state, specialist review, proof/sample requirements, material unknowns, supplied-item review and clarification questions require explicit staff review; no quote/order/stock/provider action is automatic.

### Restart resolution rule
Resolve live `dev` and `main` first. Build 212 starts only after Build 211 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 210/211 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
