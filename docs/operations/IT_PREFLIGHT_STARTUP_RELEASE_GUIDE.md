# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0010`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 210 candidate

Build 209 **Workshop Capability Profiles & Constraints** is the exact fully verified predecessor.

- Development SHA: `9b6b22291bd98bdd2d57c8793a0c892f937b4287`
- Shared tree: `36bed0abebbb47b375277562355c3517d171b629`
- System / Quality / I.T. / Hygiene: `35517349532` / `35517349713` / `35517349672` / `35517349600`
- Build 209 Development proof: `35517349698`
- Production main: `9a1bd2b3d99edf69651a17e790866d3b8fa744d4`
- Production Pages / Live Resources: `35517517613` / `35517574976`
- Product Browser / Route: `35517574870` / `35517574790`
- Build 209 Production proof: `35517517656`
- Exact Production URL: `https://d8ed45c4.devilndove-site.pages.dev`

Build 210 **Custom Work Intake 2.0** is the active candidate. Migration `0010_release467_custom_work_intake_2.sql` adds 12 structured manufacturing-intent fields to the existing `custom_requests` table.

The customer may express a reviewed capability preference or explicitly ask for help deciding. Neither path is a feasibility or manufacturing-route promise. Build 211 owns staff triage.

### Restart resolution rule
Resolve live `dev` and `main` first. Build 211 starts only after Build 210 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 209/210 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
