# I.T. Preflight, Startup & Release Guide

## Current release baseline

**Release 467 Build 153 — Layout Observer Performance Hotfix** is the exact Development + Production release boundary.

- Development SHA `b8323b4e13ae08a8126da761106367de75f7cd40`
- Production main SHA `ba8b3c2406335391334b2a74a89e5819236c770b`
- identical tree `a3d0225c579953d5572dc99313661c2981c42510`
- System `34863777573`
- Quality `34863777529`
- I.T. `34863777559`
- Hygiene `34863777543`
- Production Pages `34864015766`
- Production Live Resources `34864113781`

A later route-specific incident at `2026-09-14T15:48:10Z` returned HTTP 503 / Cloudflare Error 1102 (`Worker exceeded resource limits`) for `/admin/products/`. Build 154 is the active repair. The Build 153 proof bundle remains historically exact, but Production is not considered fully healthy for Products until Build 154's direct route proof passes.

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and all six external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene, canonical D1/bindings and Preview acceptance.
4. For a route/resource incident, directly request the affected Development route after exact Preview deployment.
5. Non-force promote the identical tree to `main` only after Development is GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity.
7. Require the incident-specific post-deployment route proof when one exists.
8. Only then call the incident fixed and `main` / Production healthy.

## Build 154 restart

Build 154 — **Products Worker Resource Hotfix** — is authorized from the exact Build 153 checkpoint above.

The Products route already passes through session resolution and application-module authorization before page rendering. Those security checks remain unchanged. The expensive stage is downstream: the large Products admin document enters the shared request-time `HTMLRewriter`, which injects common platform assets and previously revised every Product script URL.

Build 154 gives `/admin/products/` a bounded renderer after authorization. The renderer reads the static HTML once, applies one Product-script cache-revision pass, injects the same responsive/PWA/layout/cold-start assets before `</head>`, marks the response `Cache-Control: no-store`, and emits `X-DND-Products-Render-Path: static-fast-path`. Other pages keep the existing shared `HTMLRewriter` path.

The Product cache token becomes `467-b154-products-worker-fast-path`. The Build 153 layout-observer repair remains `467-b153-layout-observer`.

A new post-Production workflow directly probes `https://devilndove.com/admin/products/`. It follows Build 135 transport resilience: no more than three attempts, retrying only transient HTTP classes. Success requires HTTP 200, the fast-path header, module-guard headers, Products page HTML, the Build 154 cache token, and absence of `Error 1102` / `Worker exceeded resource limits`.

Build 154 remains schema-free. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.

Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures fail closed. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.
