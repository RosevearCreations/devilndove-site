# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, through canonical migration `0006`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 205 candidate

Build 204 **Storefront Launch Set & Autonomous Closure** is the last fully verified application build.

The later Builds 205–224 roadmap promotion was documentation-only and became the canonical Build 204 restart source boundary:

- Last fully verified Development SHA: `48307e67978dee5ef4481ccfe2739a5d3df79b18`
- Current Production main SHA: `09253dbe5b43c4308d1ff671bb71df80bf0592d9`
- Exact shared tree: `4a63209efc54bc641ba0484c4954ac1cb35acc2e`
- Development System Gate: `35483005170`
- Development Current Application Quality: `35483005094`
- Development I.T. Admin Runtime: `35483005097`
- Development Repository Branch Hygiene: `35483005113`
- Original Build 204 Development proof: `35478691738`
- Production Pages Deploy: `35483092965`
- Production remote D1 queries: `0`
- Exact Production URL: `https://cd226d56.devilndove-site.pages.dev`

Original Build 204 runtime closure remains preserved separately:

- runtime Development: `50098122e88548ad5e94835d5ef69a5e738aed88`
- runtime Production: `d88789ee563e700e8847f7b47f156964024a3b45`
- runtime tree: `90018f79ee469420e9f3c16504bdf4a73c0dfd0f`
- Development proof: `35478691738`
- Production proof: `35478779057`
- Production Pages: `35478779248`
- runtime Production URL: `https://72602315.devilndove-site.pages.dev`

Build 205 **Current Authority & Manufacturing-Era Roadmap Convergence** is the active Development closure candidate. It converges `current-development-authority.json`, I.T. control tower, Deployment Preflight, Reliability, this guide, `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md` and `MARKDOWN_INDEX.md` on the exact boundary above.

Build 205 changes release/restart truth only. It performs no Product/Inventory/Custom Request/Creative Project mutation, no schema change, no D1/R2 business-data work and no provider/payment/publication execution.

Build 205 acceptance requires its dedicated source proof plus System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene on one exact final `dev` SHA. Only that exact GREEN tree may be promoted through protected `main`, followed by exact Production deployment/runtime proof.

### Restart resolution rule

The Build 205 candidate never self-claims its not-yet-created final SHA. At every restart resolve live `dev` and `main` first. Once Build 205 is Production GREEN, Build 206 must ingest the exact Build 205 closure.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 204/205 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
