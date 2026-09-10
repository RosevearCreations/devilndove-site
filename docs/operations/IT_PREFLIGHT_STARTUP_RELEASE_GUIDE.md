# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 92 — Prelaunch Action Queue Completeness & Ownership is the last fully verified checkpoint:
- `dev` `67bca9198c0973ffe2b39818c3b933ec2737cc00`
- tree `f3fa062060cd53eb5e4b7dab42b2ba6d1fae0450`
- System Gate `34506095955` SUCCESS
- Current Application Quality `34506095848` SUCCESS
- I.T. Admin Runtime Proof `34506095837` SUCCESS
- Repository Branch Hygiene `34506095835` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 92 is the current Production checkpoint:
- `main` `67bca9198c0973ffe2b39818c3b933ec2737cc00`
- tree `f3fa062060cd53eb5e4b7dab42b2ba6d1fae0450`
- Production Pages Deploy `34506354596` SUCCESS
- Production Live Resource Integrity `34506453451` SUCCESS.

## Build 93 operational boundary

Build 93 — **Centered Application Shell & Overflow Accessibility** is the active Development closure candidate. It consumes Build 92's exact external closure and repairs a shared presentation defect where root horizontal clipping plus hidden container overflow could leave important right-side data unreachable.

The current layout rules are:
- public and admin `.container` / `.admin-shell` surfaces remain centered with viewport-bounded width;
- root horizontal clipping is forbidden; unknown legacy overflow stays recoverable rather than disappearing;
- known table/data wrappers own local horizontal scrolling;
- dynamic table wrappers are keyboard focusable and accessibility-labeled;
- grid/card/form children use minimum-width and maximum-width safeguards so a wide child cannot push the entire application off-center;
- long identifiers and other tokens wrap where possible instead of creating invisible right-side content;
- phone, tablet, desktop/application and wide-web layouts retain responsive gutters;
- the layout guard does not alter H1 hierarchy, business data or launch/provider state.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 93 ingests the exact Build 92 Development and Production closure. Build 93 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

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
