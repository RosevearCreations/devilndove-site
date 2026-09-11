# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 97 — Product Readiness Work Queue & Blocker Navigation is the last fully verified checkpoint:
- `dev` `eef3c48a287cc919b1f4d964e8b504d4611e671e`
- tree `d2714d4e74fd7f85c9ca7efa0b63a366be1c4f63`
- System Gate `34548442379` SUCCESS
- Current Application Quality `34548442377` SUCCESS
- I.T. Admin Runtime Proof `34548442359` SUCCESS
- Repository Branch Hygiene `34548442374` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 97 is the current Production checkpoint:
- `main` `eef3c48a287cc919b1f4d964e8b504d4611e671e`
- tree `d2714d4e74fd7f85c9ca7efa0b63a366be1c4f63`
- Production Pages Deploy `34548574039` SUCCESS
- Production Live Resource Integrity `34548646961` SUCCESS.

## Build 98 operational boundary

Build 98 — **Product Readiness Triage & Blocker Groups** is the active Development closure candidate. It consumes Build 97's exact external closure and continues Products & Inventory usability without changing Product authority.

The current Product readiness rules are:
- readiness data and first-blocker help are reused from the primary Products loader;
- Build 98 adds no second Product API/database read and no second readiness API/database read;
- blocker groups are browser-local workflow helpers: Media, SEO, Commerce, Copy / story and Other;
- group counts and the selected group do not create new business truth;
- the readiness work queue remains lowest readiness score first inside the selected group;
- **Open next blocker** delegates to the existing Product-row blocker action;
- **Show next Product** locates the selected queue's first Product only after an explicit operator click;
- readiness-unavailable Products are never silently classified as ready;
- Build 97 readiness navigation, Build 96 Product search/focus, Build 95 current Product/table ergonomics, Build 94 readable 3/2/1 workspace navigation and Build 93 centered-shell/right-side reachability remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 98 ingests exact Build 97 Development and Production closure. Build 98 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 99 must ingest Build 98's final external closure.

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
