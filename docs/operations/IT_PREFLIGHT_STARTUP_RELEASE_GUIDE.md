# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 142 — Storefront Continuity & Offline Foundation**.

Last fully verified Build 141:
- SHA `72e270e4c27bd666afcb4d5befc3462dd757a1d1`
- tree `d4a6bfe0327d8de641d3ea1910dcd8c6bc67e14b`
- System `34763039974`
- Quality `34763039975`
- I.T. `34763040049`
- Hygiene `34763039996`
- Production Pages `34763165246`
- Production Live Resources `34763209880`

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Release sequence

1. Verify the previous exact SHA/tree and all six external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene, canonical D1/bindings and Preview acceptance.
4. Non-force promote the identical SHA/tree to `main` only after Development is GREEN.
5. Require Production Pages Deploy and Production Live Resource Integrity.

Build 142 begins the buyer/seller UX roadmap with public Storefront continuity. A shopper's previously saved public Shop snapshot can remain browseable when live Product data is unavailable, but cached price/stock are labelled last verified and cached Add to Cart is disabled until live revalidation. The shared PWA client reports offline/reconnect state and exposes retry; the service worker precaches the public Shop shell while `/api/` remains outside cache authority and returns a no-store offline response when unreachable.

Build 137–141 read-only closure evidence remains available: Markdown/JSON exports, stable evidence ID, SHA-256 fingerprint, verification-manifest export, independent browser digest verification and closure-JSON-versus-manifest consistency checks.

Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures still fail closed. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.
