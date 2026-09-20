# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through `0013`. Request-time DDL and automatic Production promotion remain closed.

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
## Current Release 467 restart authority — Build 213 candidate

Build 212 **Hybrid Creative Project Operations** is the exact fully verified predecessor.

- Development SHA: `7891a869d748072846a1ac9452782e119f01cd53`
- Shared tree: `f972119d10f98ea566173868915463ce31cdf22c`
- System / Quality / I.T. / Hygiene: `35526209718` / `35526209719` / `35526209723` / `35526209630`
- Build 212 Development proof: `35526209730`
- Production main: `9ea6c728a4df978d653be910388ea7081b800de9`
- Production Pages / Live Resources: `35526432043` / `35526530121`
- Product Browser / Route: `35526530105` / `35526530131`
- Build 212 Production proof: `35526432021`
- Exact Production URL: `https://f3bd9a21.devilndove-site.pages.dev`

Build 213 **Digital Proof & Customer Approval** is the active candidate. Migration `0013_release467_digital_proof_customer_approval.sql` adds versioned private proof records and append-only customer/internal approval evidence to the existing Custom Work authority.

Customer approval is never publication approval. Packaging Studio retains layout/version ownership, approved customer-safe media remains media-owned, and raw/private CAIP originals are never exposed through the proof link.

### Restart resolution rule
Resolve live `dev` and `main` first. Build 214 starts only after Build 213 is exact-SHA Production GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 212/213 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
