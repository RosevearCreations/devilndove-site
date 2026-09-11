# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 96 — Product Browser Search & Focus Filters is the last fully verified checkpoint:
- `dev` `ba0e2f633d823b90fdcc2cbbbe6be4c50c79b284`
- tree `76f01771b844f6f610a621cd969d033cfa3d7c9c`
- System Gate `34546959255` SUCCESS
- Current Application Quality `34546959190` SUCCESS
- I.T. Admin Runtime Proof `34546959188` SUCCESS
- Repository Branch Hygiene `34546959296` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 96 is the current Production checkpoint:
- `main` `ba0e2f633d823b90fdcc2cbbbe6be4c50c79b284`
- tree `76f01771b844f6f610a621cd969d033cfa3d7c9c`
- Production Pages Deploy `34547083100` SUCCESS
- Production Live Resource Integrity `34547157869` SUCCESS.

## Build 97 operational boundary

Build 97 — **Product Readiness Work Queue & Blocker Navigation** is the active Development closure candidate. It consumes Build 96's exact external closure and continues Products & Inventory usability without changing Product authority.

The current Product readiness rules are:
- readiness data is reused from the readiness badges already rendered by the primary Products loader;
- Build 97 adds no second Product API/database read and no second readiness API/database read;
- the readiness work queue lists blocked Products by lowest readiness score first;
- queue cards show Product identity, score, first blocker and help;
- **Open blocker** delegates to the existing Product-row blocker action so the existing media / SEO / price / description / readiness routing remains authoritative;
- **Show Product row** clears browser filters and locates the row only after an explicit operator click;
- **Readiness blocked** and **Ready** extend Build 96 browser-local search/focus views;
- readiness-unavailable Products are never silently classified as ready;
- Build 96 Product search/focus, Build 95 current Product/table ergonomics, Build 94 readable 3/2/1 workspace navigation and Build 93 centered-shell/right-side reachability remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 97 ingests exact Build 96 Development and Production closure. Build 97 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

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
