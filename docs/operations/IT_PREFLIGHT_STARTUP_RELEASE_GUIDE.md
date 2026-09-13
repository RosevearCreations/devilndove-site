# I.T. Preflight, Startup & Release Guide

## Current release

**Release 467 Build 135 — Production Live-Resource Proof Transport Resilience**.

Last fully verified Build 134:
- SHA `fa53527989dfb9583969d752c1e237dfc35e25ec`
- tree `a8fcb858178dc95b8648927c6f979996ef229857`
- System `34733563985`
- Quality `34733563987`
- I.T. `34733564024`
- Hygiene `34733563990`
- Production Pages `34733635050`
- Production Live Resources `34733673164` (attempt 2)

## Release sequence

1. Verify the previous exact SHA/tree and all six external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene, canonical D1/bindings and Preview acceptance.
4. Non-force promote the identical SHA/tree to `main` only after Development is GREEN.
5. Require Production Pages Deploy and Production Live Resource Integrity.

Build 135 retries only transient transport errors in the live-resource proof, with a maximum of three attempts. Real API, R2, photography and D1 failures still fail closed. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.
