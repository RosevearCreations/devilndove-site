# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 59 — Storefront Media Availability & Merchandising Recovery is the last fully verified restart checkpoint:
- `dev` `44483117210e93ce7126cd19510b090d88f663a7`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- System Gate `33969967713` SUCCESS
- Current Application Quality `33969967734` SUCCESS
- I.T. Admin Runtime Proof `33969967704` SUCCESS
- Repository Branch Hygiene `33969967656` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 59 is the current proven Production source/deployment checkpoint:
- `main` `9411c0968d2f0cae57f25d36f0664729cd81c61f`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- Production Pages Deploy `33970506769` SUCCESS.

The Build 59 Production workflow proved the exact fully-green Development tree before Production work, snapshotted and preserved Production business data, proved canonical Production D1 plus isolation/foreign-key integrity, deployed the exact `main` SHA, proved Production bindings, passed public smoke and preserved promotion proof. A later live account/media report proves that the previous public smoke did not test a real Product R2 object or an authenticated account-admin write.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. A closure candidate never self-claims proofs that can only exist after its merge commit. The next build ingests the previous final closure before any other source mutation.

Build 60 ingested the exact Build 59 Development and Production closure in its first source mutation and is the active **Production Resource Binding & Account/Auth Recovery** candidate. After Build 60 merges, its exact `dev` head must independently pass System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene and exact Preview acceptance before the explicitly authorized Production hotfix is promoted.

## Current Build 60 incident boundary

- Product images remain unavailable across live public site surfaces after Build 59 Production.
- Authenticated `POST /api/admin/create-user` returns HTTP 503 with `ADMIN_CREATE_USER_FAILED`.
- The Production deploy workflow is configured for live resources: D1 `devilndove-prod-r462` / `f34a741b-0000-45b0-9a96-6be08754d563`, Product R2 `devilndove-toolshed-images`, CAIP R2 `devilndove-caip-media`.
- Build 60 account routes inspect the actual live `users`/`sessions` columns read-only and dynamically select the supported session token/user timestamp fields. No request-time DDL or blind migration is allowed.
- Build 60 `/api/product-media` remains GET-only and supports both current `products/` and approved legacy public prefixes including `Itemsforsale/`, `Toolshed/`, `Tools/` and `Supplies/`, with historical case compatibility.
- Shared HTML middleware injects the recovery client on every HTML page.
- Production acceptance must now prove the live account schema contract and fetch a real known public R2 object before the incident is called closed.

The separate `business-administration` module-runtime suppression warning remains a legacy module mapping issue and is not the structured Create User 503 source.

## Startup sequence

1. Read `current-development-authority.json`.
2. Confirm Build 59 verified Development SHA/tree/runs above.
3. Fetch current `dev`; it must be at or descended from `44483117210e93ce7126cd19510b090d88f663a7`.
4. If Build 60 is current, verify its exact feature head and later merged `dev` head externally before claiming it GREEN.
5. Confirm current Production checkpoint is Build 59 at `9411c0968d2f0cae57f25d36f0664729cd81c61f`, tree `3523119d31bbde05ba98faa530acc3dae88920d2`, Production run `33970506769`.
6. Read `release467-build60-production-resource-binding-auth-recovery.json`, then Build 59/58/57/56 authorities, handoff, roadmap, sanity and Markdown index.
7. Confirm `/admin/it/`, `/admin/deployment-preflight/` and `/admin/reliability/` remain read-only projections.
8. Development remains `dev` Preview on Pages project `devilndove-site`; Production remains `main` Production.
9. Development D1 remains `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
10. Development Product R2 remains `devilndove-toolshed-images-dev`; CAIP private R2 remains `devilndove-caip-media-dev`.
11. Production D1 remains `devilndove-prod-r462` / `f34a741b-0000-45b0-9a96-6be08754d563`; Product R2 remains `devilndove-toolshed-images`.
12. Canonical migrations remain exactly `0001`–`0004` under `migrations/canonical`, applied only through `scripts/d1_migrate.py`.
13. Never overwrite Production business data from Development.
14. Verify Application Modules and root administrator full-manage authority before release claims.
15. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain independent HOLD/evidence-dependent lanes.
16. Renderer/provider execution, publication, social handoff and R2 mutation remain closed unless separately authorized.
17. Confirm the current pointer build equals the newest `release467-buildNN-*.json` authority before calling restart truth current.

## Build 60 boundary

Build 60 changes account-schema compatibility, public media read recovery and release proof coverage only. It adds no schema migration, D1 business-data migration, R2 mutation, provider execution or automatic Production promotion. The user has explicitly authorized this incident correction to be promoted to `main` after exact Development acceptance passes.
