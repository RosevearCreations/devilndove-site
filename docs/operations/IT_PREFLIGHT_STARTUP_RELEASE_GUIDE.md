# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 58 — Account Administration JSON Response Hardening is the last fully verified restart checkpoint:
- `dev` `91106c2156e209045ed49cfd48220550c7afca57`
- tree `ab8d5dae6bba682dad438937ca63c38955e0ff8a`
- System Gate `33968914405` SUCCESS
- Current Application Quality `33968914416` SUCCESS
- I.T. Admin Runtime Proof `33968914417` SUCCESS
- Repository Branch Hygiene `33968914412` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 55 — Inventory Intelligence Manufacturer-Link Schema Compatibility is the current proven Production source/deployment checkpoint:
- `main` `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477` SUCCESS.

The Build 55 Production workflow proved the exact fully-green Development tree before Production work, snapshotted and preserved Production business data, proved canonical Production D1 plus foreign-key/isolation integrity, deployed the exact `main` SHA, proved Production bindings, passed public smoke and preserved promotion proof. A later live Storefront runtime incident is being handled by Build 59 and does not rewrite that historical proof.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. A closure candidate never self-claims proofs that can only exist after its merge commit. The next build ingests the previous final closure before any other source mutation.

Build 59 ingested the exact Build 58 closure in its first source mutation and is the active **Storefront Media Availability & Merchandising Recovery** candidate. After Build 59 merges, its exact `dev` head must independently pass System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene and exact Preview acceptance. Build 60 must ingest those later results; do not add an evidence-only commit to Build 59 afterward.

## Current Build 59 incident boundary

- Live Production `GET /api/storefront-merchandising` returned HTTP 500.
- Product images requested from `https://assets.devilndove.com/products/...` failed with `NS_ERROR_DOM_NETWORK_ERR` and Store product photography disappeared.
- Build 59 makes the merchandising Product read schema-compatible instead of depending on one fixed optional-column set.
- Build 59 adds `/api/product-media`, a same-origin read-only R2 fallback restricted to validated `products/*` keys.
- Shop installs the media fallback before both Product renderers; failed public custom-host images retry the exact R2 object through the same-origin route.
- No R2 list/put/delete/multipart mutation is added.

Build 58’s account-writing hardening is Development GREEN. The separate `business-administration` module-runtime suppression warning remains a legacy module mapping issue and is not the source of either the Create User HTTP 500 or the Product-media network outage.

## Startup sequence

1. Read `current-development-authority.json`.
2. Confirm Build 58 verified Development SHA/tree/runs above.
3. Fetch current `dev`; it must be at or descended from `91106c2156e209045ed49cfd48220550c7afca57`.
4. If Build 59 is current, verify its exact merged `dev` head externally before starting Build 60 or claiming it GREEN.
5. Confirm current Production checkpoint is Build 55 at `ee42e7838a83def94e858b3d0d6c1a23947e2344`, tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`, Production run `33936229477`.
6. Read `release467-build59-storefront-media-availability-merchandising-recovery.json`, then Build 58/57/56/55 authorities, handoff, roadmap, sanity and Markdown index.
7. Confirm `/admin/it/`, `/admin/deployment-preflight/` and `/admin/reliability/` remain read-only projections.
8. Development remains `dev` Preview on Pages project `devilndove-site`; Production remains `main` Production.
9. Development D1 remains `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
10. Development Product R2 remains `devilndove-toolshed-images-dev`; CAIP private R2 remains `devilndove-caip-media-dev`.
11. Canonical migrations remain exactly `0001`–`0004` under `migrations/canonical`, applied only through `scripts/d1_migrate.py`.
12. Never overwrite Production business data from Development.
13. Verify Application Modules and root administrator full-manage authority before release claims.
14. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain independent HOLD/evidence-dependent lanes.
15. Renderer/provider execution, publication, social handoff and R2 mutation remain closed unless separately authorized.
16. Confirm the current pointer build equals the newest `release467-buildNN-*.json` authority before calling restart truth current.

## Build 59 boundary

Build 59 changes Storefront read/runtime availability behavior and current read-only authority projections only. It adds no schema migration, D1 business-data migration, R2 mutation, provider execution or automatic Production promotion. Any later Production repair must originate from the exact fully-green Build 59 Development tree and pass the normal Production preservation/D1/FK/bindings/public-smoke proof chain.
