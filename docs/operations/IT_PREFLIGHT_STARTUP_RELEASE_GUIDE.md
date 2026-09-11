# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 101 — Product Work Priority & Next-Action Ordering is the last fully verified checkpoint:
- `dev` `73cd0d56071a60c562000d5804f819f6dde10a13`
- tree `2ef06219e4b1eeb1e525680fc45107eb6ebc5226`
- System Gate `34603707283` SUCCESS
- Current Application Quality `34603707270` SUCCESS
- I.T. Admin Runtime Proof `34603707267` SUCCESS
- Repository Branch Hygiene `34603707269` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 101 is the current Production checkpoint:
- `main` `73cd0d56071a60c562000d5804f819f6dde10a13`
- tree `2ef06219e4b1eeb1e525680fc45107eb6ebc5226`
- Production Pages Deploy `34603913028` SUCCESS
- Production Live Resource Integrity `34604002146` SUCCESS.

## Build 102 operational boundary

Build 102 — **Product Work Manual Reorder & Accessibility** is the active Development closure candidate. It consumes Build 101's exact external closure and closes the remaining Manual-order usability gap without changing Product authority.

The current Product-browser rules are:
- the work session remains browser-local under `dd_catalog_work_session_v1` and holds at most 60 Product IDs;
- Build 101 priorities and ordering modes remain available: Priority, Blockers, Readiness, Recent and Manual;
- Manual mode exposes keyboard-accessible Move Up and Move Down controls;
- first-item Move Up and last-item Move Down are disabled, and reorder controls are disabled outside Manual mode;
- reorder changes only the stored session sequence and preserves each Product's priority/completion state;
- Locate next Product and Open next blocker follow the reordered manual sequence;
- Blockers/Readiness ordering reuses readiness already rendered by the primary Products loader;
- hidden Products do not silently clear search, focus, triage or saved-view filters;
- Build 102 adds no Product/readiness API or database read;
- Build 101 priority/order, Build 100 work sessions, Build 99 saved work views/sort, Build 98 readiness triage and earlier Product/table/responsive protections remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 102 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 103 must ingest Build 102's final external closure.

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