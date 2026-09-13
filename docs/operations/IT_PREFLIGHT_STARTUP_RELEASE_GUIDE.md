# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 138 — Closure Evidence JSON & Operator Reference ID**.

Last fully verified Build 137:
- SHA `51799af100e036667d7ed2e01a1b84edea141eb7`
- tree `744c235c6d1e3bbffa5824dba1e710d65c522147`
- System `34759975105`
- Quality `34759975110`
- I.T. `34759975114`
- Hygiene `34759975131`
- Production Pages `34760063777`
- Production Live Resources `34760104667`

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

Build 138 retains the read-only I.T. Markdown closure evidence pack and adds a dedicated JSON artifact plus stable operator evidence ID. Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures still fail closed. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.
