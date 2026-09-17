# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as the current Production source and `dev` as the Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0005`. Request-time DDL and automatic Production promotion remain closed.

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. For browser/runtime incidents, execute only the current bounded workflow for the affected architecture; retired browser probes must not be run against successor Product architectures.
5. Non-force promote the identical Development commit to `main` only after Development is GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity.
7. Execute current architecture-specific Production proof without unnecessary Production D1 reads.
8. Only then call `main` / Production GREEN.

Production live-resource retries remain capped at three transient attempts; permanent 4xx and genuine resource failures fail closed. Stripe Development, PayPal sandbox and Social/OAuth remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 166 candidate

Build 165 **Product Editing Stabilization** is the last fully verified Development and current Production baseline.

- Last fully verified Development SHA: `20961a195ccab0594ca47ee051de45aa9168bda4`
- Current Production main SHA: `20961a195ccab0594ca47ee051de45aa9168bda4`
- Exact shared tree: `1adc33d1280b55f62f4dc21c7c87ac334fee303e`
- Development System Gate: `35229694257`
- Development Current Application Quality: `35229694220`
- Development I.T. Admin Runtime: `35229694225`
- Development Repository Branch Hygiene: `35229694190`
- Production Pages Deploy: `35230536365`
- Production Live Resource Integrity: `35230633169`

Build 166 **Product Editing & Image Stabilization** is the active Development candidate. It keeps `/admin/products/` compact at eight rows by default, routes existing Product images through the canonical same-origin `/api/product-media` R2 reader, retains `/media/product` only as a zero-D1 compatibility alias, and replaces the public Product detail loader with one bounded Product/gallery endpoint plus an eight-second fail-fast browser timeout.

The Product rewrite does not list R2, does not perform request-time DDL, does not scan the Product catalog automatically, and does not introduce payment/provider/accounting mutation. Historical Build 157/Build 163 browser probes are successor-aware and must not be used as authority for the Build 166 Product architecture.

Build 166 acceptance requires its dedicated source proof plus System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene on one exact final `dev` SHA. Only that exact GREEN commit may be non-force promoted to `main`, followed by Production Pages Deploy, Production Live Resource Integrity, and current Product architecture proof.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
