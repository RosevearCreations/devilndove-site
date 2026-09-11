# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 100 — Product Work Session & Progress is the last fully verified checkpoint:
- `dev` `20400309f3ab450cc256769870e8f963f8d3de3c`
- tree `3344c8e4d8c177820ea5077f4b429ff1e832d881`
- System Gate `34598663510` SUCCESS
- Current Application Quality `34598663549` SUCCESS
- I.T. Admin Runtime Proof `34598663501` SUCCESS
- Repository Branch Hygiene `34598663509` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 100 is the current Production checkpoint:
- `main` `20400309f3ab450cc256769870e8f963f8d3de3c`
- tree `3344c8e4d8c177820ea5077f4b429ff1e832d881`
- Production Pages Deploy `34598827876` SUCCESS
- Production Live Resource Integrity `34598920977` SUCCESS.

## Build 101 operational boundary

Build 101 — **Product Work Priority & Next-Action Ordering** is the active Development closure candidate. It consumes Build 100's exact external closure and continues Products & Inventory usability without changing Product authority.

The current Product-browser rules are:
- the work session remains browser-local under `dd_catalog_work_session_v1` and holds at most 60 Product IDs;
- each pinned Product may be Urgent, High, Normal or Low priority;
- existing items without priority default to Normal;
- session order may be Priority, Blockers, Readiness, Recent or Manual;
- Locate next Product and Open next blocker follow the selected session order;
- Blockers/Readiness ordering reuses readiness already rendered by the primary Products loader;
- hidden Products do not silently clear search, focus, triage or saved-view filters;
- Build 101 adds no Product/readiness API or database read;
- Build 100 work sessions, Build 99 saved work views/sort, Build 98 readiness triage and earlier Product/table/responsive protections remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 101 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 102 must ingest Build 101's final external closure.

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

Never overwrite Production business data from Development. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain independent `HOLD_EXTERNAL` lanes; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.