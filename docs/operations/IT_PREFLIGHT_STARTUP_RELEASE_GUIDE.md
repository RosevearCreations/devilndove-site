# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 137 — Release Closure Evidence Pack & Operator Export**.

Last fully verified Build 136:
- SHA `577db0056cc169656d7d582c9f03d8a3d3058de9`
- tree `c3ec59aec9767a4ff7590d8ab3b3e7516397a2d4`
- System `34758452361`
- Quality `34758452368`
- I.T. `34758452390`
- Hygiene `34758452385`
- Production Pages `34758525107`
- Production Live Resources `34758561922`

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

Build 137 adds only a read-only I.T. Markdown closure evidence pack. Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures still fail closed. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.
