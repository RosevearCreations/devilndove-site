# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 99 — Product Work Views & Browser Sort is the last fully verified checkpoint:
- `dev` `5cb212feda63ce198a12b9fb6ae8ac5cc3e926a2`
- tree `4a3a6f6e1c187531c254187a08edd4bd4723a937`
- System Gate `34553759863` SUCCESS
- Current Application Quality `34553759843` SUCCESS
- I.T. Admin Runtime Proof `34553759876` SUCCESS
- Repository Branch Hygiene `34553759871` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 99 is the current Production checkpoint:
- `main` `5cb212feda63ce198a12b9fb6ae8ac5cc3e926a2`
- tree `4a3a6f6e1c187531c254187a08edd4bd4723a937`
- Production Pages Deploy `34553869891` SUCCESS
- Production Live Resource Integrity `34553931594` SUCCESS.

## Build 100 operational boundary

Build 100 — **Product Work Session & Progress** is the active Development closure candidate. It consumes Build 99's exact external closure and continues Products & Inventory usability without changing Product authority.

The current Product-browser rules are:
- the work session is browser-local under `dd_catalog_work_session_v1` and holds at most 60 Product IDs plus completion timestamps;
- Products may be pinned individually or explicitly added from the current visible Product rows;
- progress, Locate next Product, Mark done/Undo and clear actions change only browser-local planning state;
- Open next blocker delegates the existing Product row first-blocker action;
- hidden Products do not silently clear search, focus, triage or saved-view filters;
- Build 100 reuses `dd_admin_products_snapshot_v2` and readiness already rendered by the primary Products loader;
- Build 100 adds no Product/readiness API or database read;
- Build 99 saved work views/sort, Build 98 readiness triage, Build 97 readiness navigation, Build 96 Product search/focus, Build 95 Product/table ergonomics, Build 94 readable workspace navigation and Build 93 centered-shell/right-side reachability remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 100 ingests exact Build 99 Development and Production closure. Build 100 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 101 must ingest Build 100's final external closure.

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