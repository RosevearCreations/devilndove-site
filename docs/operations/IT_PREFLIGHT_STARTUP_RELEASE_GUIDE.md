# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0009`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 209 candidate

Build 208 **Multi-Discipline Public Positioning & Capability Navigation** is the exact fully verified predecessor.

- Development SHA: `cc76ca21585e0b9a38e2b7f481799963943be056`
- Shared tree: `7a3583f0f12275d5316b1fc63a3067bc3dd7d74a`
- System / Quality / I.T. / Hygiene: `35515481692` / `35515481732` / `35515481657` / `35515481717`
- Build 208 Development proof: `35515481737`
- Production main: `2d53ff1f65b0252e4c1812766e61577f530dccaa`
- Production Pages / Live Resources: `35515609351` / `35515652270`
- Product Browser / Route: `35515652261` / `35515652315`
- Build 208 Production proof: `35515609321`
- Exact Production URL: `https://f784f34e.devilndove-site.pages.dev`

Build 209 **Workshop Capability Profiles & Constraints** is the active candidate. Migration `0009_release467_workshop_capability_profiles.sql` adds the reviewed capability-profile layer while `inventory_processes` remains canonical process identity.

The 12 initial profiles keep technical settings/dimensions unknown unless measured or owner-supplied. Mechanical capability remains fabrication/adaptation only and not a general automotive-repair promise.

### Restart resolution rule
Resolve live `dev` and `main` first. Build 210 starts only after Build 209 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 208/209 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
