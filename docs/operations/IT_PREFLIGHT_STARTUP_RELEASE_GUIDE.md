# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 143 — Adaptive Mobile/Desktop/Web Application Shell**.

Last fully verified Build 142:
- SHA `0b022c355217c00a7313aa2cb3e4b37a2b9a2b45`
- tree `acf47b86db2cd170dc1fadd2a9e827e485e7c908`
- System `34765428970`
- Quality `34765428976`
- I.T. `34765428961`
- Hygiene `34765428957`
- Production Pages `34765518900`
- Production Live Resources `34765564112`

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

Build 143 continues the buyer/seller UX roadmap with a shared adaptive application shell. Phone, tablet and desktop/web receive deliberate layouts instead of a single shrinking desktop navigation. Buyer destinations are Shop, Search, device-local Saved, Cart and Account. Seller destinations are Home, Orders, Products, Create and More. Existing routes remain the business authority; the shell only improves access and context.

The shell exposes global online/offline status through an accessible live region, preserves useful scroll position through Back/Forward navigation, focuses the existing Shop search and Product creation form when those destinations are selected, and prevents an offline Account tap from forcing a broken login route. Device-local Saved products remain a browsing convenience only: they do not reserve stock, synchronize accounts or make saved prices authoritative.

The Release 450 installable-client contract must remain unchanged: `devilndove-shell-r450`, `const RELEASE = 450;`, site-wide standalone manifest behavior, notification handlers and admin/API cache bypass all remain required. The safe public adaptive shell and Saved page may be cached, while `/api/`, account/admin/auth-sensitive authority remains live-only.

Build 137–142 read-only closure evidence remains available: Markdown/JSON exports, stable evidence ID, SHA-256 fingerprint, verification-manifest export, independent browser digest verification and closure-JSON-versus-manifest consistency checks.

Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures still fail closed. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.
