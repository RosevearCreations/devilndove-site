# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 140 — Closure Evidence Integrity Self-Verification & Tamper Detection**.

Last fully verified Build 139:
- SHA `3cb401b8cbf9c5c37e9b734497984cd9f4a385e5`
- tree `5c6adcd9702348532e0c0807b3ea634c2604d7f7`
- System `34761418389`
- Quality `34761418405`
- I.T. `34761418383`
- Hygiene `34761418425`
- Production Pages `34761544388`
- Production Live Resources `34761591278`

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

Build 140 retains the read-only I.T. Markdown and JSON closure evidence exports, stable evidence ID, SHA-256 fingerprint and verification-manifest export. It adds an independent browser verifier that canonicalizes the exported payload, recomputes SHA-256 using Web Crypto and compares the result to the manifest digest; mismatches fail evidence interpretation closed without persistence or mutation. Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures still fail closed. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.