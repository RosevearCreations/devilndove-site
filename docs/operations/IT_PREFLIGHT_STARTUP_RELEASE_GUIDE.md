# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 141 — Closure Evidence Cross-Artifact Consistency Verification**.

Last fully verified Build 140:
- SHA `901d349760f9631cdbf989b549fcdac140d6569e`
- tree `365e6c630e6e7b82eaadfaf85a82d9806cdc948f`
- System `34762269626`
- Quality `34762269665`
- I.T. `34762269664`
- Hygiene `34762269682`
- Production Pages `34762361931`
- Production Live Resources `34762417112`

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

Build 141 retains the read-only I.T. Markdown and JSON closure evidence exports, stable evidence ID, SHA-256 fingerprint, verification-manifest export and independent browser digest verification. It adds a cross-artifact verifier that fetches closure JSON and the verification manifest independently, requires evidence ID, recursively key-sorted canonical payload and canonical byte length to agree, then recomputes SHA-256 using Web Crypto. Any mismatch fails evidence interpretation closed without persistence, repair or mutation. Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures still fail closed. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.
