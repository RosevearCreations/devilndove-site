# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 56 — Product Photo Guidance and Packaging Onboarding is the last fully verified restart checkpoint:
- `dev` `c2bcfb9e10db8df54286fde3e2c4c39ffaf5cc26`
- tree `bb75eac5302c0acba7fea35d4bbed6c41d5d64ab`
- System Gate `33937292286` SUCCESS
- Current Application Quality `33937292299` SUCCESS
- I.T. Admin Runtime Proof `33937292333` SUCCESS
- Repository Branch Hygiene `33937292280` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 55 — Inventory Intelligence Manufacturer-Link Schema Compatibility is Production GREEN:
- `main` `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477` SUCCESS.

The Production workflow proved the exact fully-green Development tree before Production work, snapshotted and preserved Production business data, proved canonical Production D1 plus foreign-key/isolation integrity, deployed the exact `main` SHA, proved Production bindings, passed public smoke and preserved promotion proof.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. A closure candidate never self-claims proofs that can only exist after its merge commit. The next build ingests the previous final closure before any other source mutation.

Build 57 has ingested the exact Build 56 closure as its first source mutation and is synchronizing current authority/read-only projections. After Build 57 merges, its exact `dev` head must independently pass System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene and exact Preview acceptance. Build 58 must ingest those later results; do not add an evidence-only commit to Build 57 afterward.

## Startup sequence

1. Read `current-development-authority.json`.
2. Confirm Build 56 verified Development SHA/tree/runs above.
3. Fetch current `dev`; it must be at or descended from `c2bcfb9e10db8df54286fde3e2c4c39ffaf5cc26`.
4. If Build 57 is current, verify its exact merged `dev` head externally before starting Build 58.
5. Confirm current Production checkpoint is Build 55 at `ee42e7838a83def94e858b3d0d6c1a23947e2344`, tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`, Production run `33936229477`.
6. Read `release467-build57-current-authority-restart-truth-convergence.json`, then Build 56/55 authorities, handoff, roadmap, sanity and Markdown index.
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

## Build 57 boundary

Build 57 changes authority and read-only operator projections only. It records Build 56 as the latest externally verified Development checkpoint and Build 55 as the current Production checkpoint, converges late proof records, and prevents the current pointer from silently lagging a newer Release 467 authority. It adds no schema migration, business-data mutation, provider execution or Production promotion.
