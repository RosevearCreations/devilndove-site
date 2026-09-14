# I.T. Preflight, Startup & Release Guide

## Current release baseline

**Release 467 Build 152 — Site-wide Image Quality Scoring & Media QA** is fully Development + Production GREEN.

- Development SHA `1d01cbed98b78543b75dab808a30fb76c20d6060`
- Production main SHA `2f22e280426968a9ff229a0cee9ee62a69dc9d75`
- identical tree `9cf8b0ac918ce567c51536f05d4c89b6f6294765`
- System `34860514075`
- Quality `34860514137`
- I.T. `34860514304`
- Hygiene `34860514150`
- Production Pages `34860809983`
- Production Live Resources `34860922626`

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and all six external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene, canonical D1/bindings and Preview acceptance.
4. Non-force promote the identical tree to `main` only after Development is GREEN.
5. Require Production Pages Deploy and Production Live Resource Integrity.
6. Only then call `main` / Production GREEN.

## Build 153 restart

Build 153 — **Layout Observer Performance Hotfix** — is authorized from the exact Build 152 checkpoint above.

The Production symptom was Firefox reporting `Script terminated by timeout` at the `MutationObserver` callback in `public/js/layout-overflow-guard.js`. The prior observer synchronously rescanned each added subtree. A large admin render could therefore perform repeated overlapping selector scans in one callback, and table wrapping itself generated more observed `childList` changes.

The hotfix filters additions that contain no `table`, `.container` or `.admin-shell`, batches relevant roots to one animation-frame flush, deduplicates descendant roots when an ancestor is already queued, and disconnects the observer while applying its own table-wrapper changes. Existing centering, keyboard-reachable horizontal table scrolling and one-H1 behavior remain intact.

The Products route injects the guard with cache token `467-b153-layout-observer`, replacing the stale `467-products-b98-readiness-triage` guard URL reported in Production. Other Product assets keep their existing cache revision.

Build 153 remains schema-free. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.

Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures fail closed. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.
