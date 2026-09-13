# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 136 — Production Proof Retry Telemetry & Closure Visibility**.

Last fully verified Build 135:
- SHA `e48f2bab89cfcb67cc24eec7fab3296aa1ed3750`
- tree `a1eff3544b4ecddb07d539de52eab71f3b81c9a3`
- System `34735075779`
- Quality `34735075777`
- I.T. `34735075772`
- Hygiene `34735075770`
- Production Pages `34735145318`
- Production Live Resources `34735184613`

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

Build 136 exposes the Build 135 six-proof closure plus its live-resource transport policy in the read-only I.T., Reliability and Deployment Preflight surfaces. The transport policy permits at most three attempts for transient `urllib.error.URLError`, `ConnectionResetError`, `TimeoutError`, and HTTP `408`, `425`, `429`, `500`, `502`, `503`, `504`. Permanent 4xx responses and real Product API, R2 media, usable photography, merchandising API and Production D1 failures still fail closed.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`. No schema, D1 business-data, R2, binding, payment/provider or Production business-data mutation is authorized.
