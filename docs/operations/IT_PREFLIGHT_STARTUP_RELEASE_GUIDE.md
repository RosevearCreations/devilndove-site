# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 98 — Product Readiness Triage & Blocker Groups is the last fully verified checkpoint:
- `dev` `81d6ed5cdd55c959611f538de8c90bcf21f5b302`
- tree `d19224681ade25301c07d96854c0b6c7a6abd762`
- System Gate `34550999431` SUCCESS
- Current Application Quality `34550999419` SUCCESS
- I.T. Admin Runtime Proof `34550999479` SUCCESS
- Repository Branch Hygiene `34550999409` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 98 is the current Production checkpoint:
- `main` `81d6ed5cdd55c959611f538de8c90bcf21f5b302`
- tree `d19224681ade25301c07d96854c0b6c7a6abd762`
- Production Pages Deploy `34551114694` SUCCESS
- Production Live Resource Integrity `34551173009` SUCCESS.

## Build 99 operational boundary

Build 99 — **Product Work Views & Browser Sort** is the active Development closure candidate. It consumes Build 98's exact external closure and continues Products & Inventory usability without changing Product authority.

The current Product browser rules are:
- saved work views remain browser-local and capture only search, focus, readiness triage, visible-column preferences and row sort;
- up to eight named views can be saved, updated, applied or deleted in the current browser;
- row sorting supports original order, Product/System number, name, readiness, inventory quantity and recently updated time;
- Build 99 reuses the shared Product snapshot and readiness already rendered by the primary Products loader;
- Build 99 adds no second Product API/database read and no second readiness API/database read;
- applying a saved view restores existing Build 98/96/95 controls rather than creating a new Product authority;
- Build 98 readiness triage, Build 97 readiness navigation, Build 96 Product search/focus, Build 95 current Product/table ergonomics, Build 94 readable 3/2/1 workspace navigation and Build 93 centered-shell/right-side reachability remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 99 ingests exact Build 98 Development and Production closure. Build 99 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 100 must ingest Build 99's final external closure.

The runtime I.T., preflight and reliability pages cannot self-attest GitHub/Cloudflare workflow status. A local GREEN diagnostic never substitutes for exact external release proof.

## Recovery discipline

- Record a current D1 recovery point before a real schema change.
- Rehearse restore only in a test/copied environment; never overwrite live Production business data as a diagnostic action.
- Verify representative users, Products, Inventory, Orders, Packaging and readiness records after an isolated D1 restore.
- Verify R2 inventory/re-link a safe test object without deleting live media.
- Rehearse Pages rollback and return to the current deployment with smoke evidence.
- Keep required binding/variable names documented without secret values.

## Environment boundaries

- Canonical Cloudflare Pages project: `devilndove-site`
- Development branch / Preview: `dev` / `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Development Product R2: `devilndove-toolshed-images-dev`
- Development CAIP R2: `devilndove-caip-media-dev`
- Production branch / site: `main` / `https://devilndove.com`
- Production D1: `devilndove-prod-r462` / `f34a741b-0000-45b0-9a96-6be08754d563`
- Production Product R2: `devilndove-toolshed-images`
- Production CAIP R2: `devilndove-caip-media`
- Canonical migrations: exactly `0001`–`0004` via `scripts/d1_migrate.py`.

Never overwrite Production business data from Development. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain independent `HOLD_EXTERNAL` lanes; CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.
