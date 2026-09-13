# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 139 — Closure Evidence Integrity Fingerprint & Verification Manifest**.

Last fully verified Build 138:
- SHA `5f3f0d39cdcf1ce743c9a17c40691f58fb342e8b`
- tree `76e77253294ea84ea4a77f28ab684ffe3f07dd34`
- System `34760742040`
- Quality `34760741973`
- I.T. `34760741960`
- Hygiene `34760741974`
- Production Pages `34760868140`
- Production Live Resources `34760912351`

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

Build 139 retains the read-only I.T. Markdown and JSON closure evidence exports plus stable evidence ID. It adds a SHA-256 integrity fingerprint over a recursively key-sorted canonical closure payload and a verification-manifest export carrying the digest metadata and canonical payload for independent handoff checking. Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures still fail closed. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.