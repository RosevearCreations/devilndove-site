# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 53 — Generated Deliverable Review-State Convergence is the last fully verified restart checkpoint:
- `dev` `9cb10fb3361455b33e7907c187de4d9432588705`
- tree `71a28e315628aed4f8a8610be9b3c5eed7d6ea4a`
- System Gate `33934329508` SUCCESS
- Current Application Quality `33934329486` SUCCESS
- I.T. Admin Runtime Proof `33934329585` SUCCESS
- Repository Branch Hygiene `33934329539` SUCCESS
- exact Preview acceptance: SUCCESS.

## Verified Production

Build 53 is Production GREEN:
- `main` `da365adb82860551d9a7bf4ca4d7463efa2642c6`
- tree `71a28e315628aed4f8a8610be9b3c5eed7d6ea4a`
- Production Pages Deploy `33934583466` SUCCESS.

The Production workflow proved exact fully-green Development-tree parity before Production work, snapshotted and preserved Production business counts, proved canonical Production D1 migrations and foreign keys, deployed the exact `main` SHA, proved Production D1/R2 bindings, passed live public smoke and preserved the promotion proof artifact.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. A closure candidate never self-claims proofs that can only exist after that commit. The next build ingests the previous final closure before source mutation. Build 54 has done so for Build 53. After Build 54 merges, its exact `dev` head must independently pass System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene and exact Preview acceptance. Build 55 must ingest those later results; do not add an evidence-only commit.

## Startup sequence

1. Read `current-development-authority.json`.
2. Confirm Build 53 verified Development SHA/tree/runs above.
3. Fetch current `dev`; it must be at or descended from `9cb10fb3361455b33e7907c187de4d9432588705`.
4. If Build 54 is current, verify its exact merged `dev` head externally before starting Build 55.
5. Confirm current Production checkpoint is Build 53 at `da365adb82860551d9a7bf4ca4d7463efa2642c6`, Production run `33934583466`.
6. Read `release467-build54-production-authority-synchronization.json`, then the handoff, roadmap, sanity and Markdown index.
7. Confirm `/admin/it/`, `/admin/deployment-preflight/` and `/admin/reliability/` remain read-only projections.
8. Development remains `dev` Preview on Pages project `devilndove-site`; Production remains `main` Production.
9. Development D1 remains `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
10. Development R2 remains `devilndove-toolshed-images-dev` and `devilndove-caip-media-dev`.
11. Canonical migrations remain exactly `0001`–`0004` under `migrations/canonical`, applied only through `scripts/d1_migrate.py`.
12. Never overwrite Production business data from Development.
13. Verify Application Modules and root administrator full-manage authority before release claims.
14. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain independent HOLD/evidence-dependent lanes.
15. Renderer/provider execution, publication, social handoff and R2 mutation remain closed unless separately authorized.

## Build 54 boundary

Build 54 changes authority/read-only projections only. It records Build 53 Development and Production GREEN and replaces the stale fixed Build 32 restart check with release-neutral exact Production SHA/tree/run validation. It adds no schema migration, application runtime change, provider execution or business-data mutation.
