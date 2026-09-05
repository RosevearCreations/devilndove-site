# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 57 — Current Authority / Restart Truth Convergence is the last fully verified restart checkpoint:
- `dev` `8dc267594534bc51797f5cf4e59fc6dec6e8d9b6`
- tree `c2f31450d59477fc313c9c0b25637f7bc9bc35e0`
- System Gate `33967307608` SUCCESS
- Current Application Quality `33967307714` SUCCESS
- I.T. Admin Runtime Proof `33967307740` SUCCESS
- Repository Branch Hygiene `33967307653` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 55 — Inventory Intelligence Manufacturer-Link Schema Compatibility is Production GREEN:
- `main` `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477` SUCCESS.

The Production workflow proved the exact fully-green Development tree before Production work, snapshotted and preserved Production business data, proved canonical Production D1 plus foreign-key/isolation integrity, deployed the exact `main` SHA, proved Production bindings, passed public smoke and preserved promotion proof.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. A closure candidate never self-claims proofs that can only exist after its merge commit. The next build ingests the previous final closure before any other source mutation.

Build 58 ingested the exact Build 57 closure in its first source mutation and is the active **Account Administration JSON Response Hardening** candidate. After Build 58 merges, its exact `dev` head must independently pass System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene and exact Preview acceptance. Build 59 must ingest those later results; do not add an evidence-only commit to Build 58 afterward.

## Current Build 58 incident boundary

- Live Production `/api/admin/create-user` returned HTTP 500.
- Create User and password administration exposed `JSON.parse: unexpected character at line 1 column 1` when a non-JSON platform/runtime response was parsed directly.
- Build 58 uses the shared safe response parser and structured unexpected-error responses for account-writing endpoints.
- Wrong-current-password is treated as validation rather than session-invalidating authentication failure.
- The separate `business-administration` module-runtime suppression warning is a legacy module mapping issue, not the Create User server failure.

## Startup sequence

1. Read `current-development-authority.json`.
2. Confirm Build 57 verified Development SHA/tree/runs above.
3. Fetch current `dev`; it must be at or descended from `8dc267594534bc51797f5cf4e59fc6dec6e8d9b6`.
4. If Build 58 is current, verify its exact merged `dev` head externally before starting Build 59 or claiming it GREEN.
5. Confirm current Production checkpoint is Build 55 at `ee42e7838a83def94e858b3d0d6c1a23947e2344`, tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`, Production run `33936229477`.
6. Read `release467-build58-account-administration-json-response-hardening.json`, then Build 57/56/55 authorities, handoff, roadmap, sanity and Markdown index.
7. Confirm `/admin/it/`, `/admin/deployment-preflight/` and `/admin/reliability/` remain read-only projections.
8. Development remains `dev` Preview on Pages project `devilndove-site`; Production remains `main` Production.
9. Development D1 remains `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
10. Development R2 remains `devilndove-toolshed-images-dev` and `devilndove-caip-media-dev`.
11. Canonical migrations remain exactly `0001`–`0004` under `migrations/canonical`, applied only through `scripts/d1_migrate.py`.
12. Never overwrite Production business data from Development.
13. Verify Application Modules and root administrator full-manage authority before release claims.
14. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain independent HOLD/evidence-dependent lanes.
15. Renderer/provider execution, publication, social handoff and R2 mutation remain closed unless separately authorized.
16. Confirm the current pointer build equals the newest `release467-buildNN-*.json` authority before calling restart truth current.

## Build 58 boundary

Build 58 changes account-admin runtime error handling and current read-only authority projections only. It adds no schema migration, D1 business-data migration, R2/provider execution or automatic Production promotion. A later live hotfix promotion, if performed, must originate from the exact fully-green Build 58 Development tree and pass the normal Production preservation/D1/bindings/public-smoke proof chain.
