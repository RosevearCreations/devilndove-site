# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 103 — Product Work Session Paging & Full Coverage is the last fully verified checkpoint:
- `dev` `8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146`
- tree `f4e7b2071710c50cfdd3b33ca84bbb85650d86ee`
- System Gate `34617580379` SUCCESS
- Current Application Quality `34617580435` SUCCESS
- I.T. Admin Runtime Proof `34617580311` SUCCESS
- Repository Branch Hygiene `34617580348` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 103 is the current Production checkpoint:
- `main` `8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146`
- tree `f4e7b2071710c50cfdd3b33ca84bbb85650d86ee`
- Production Pages Deploy `34617779013` SUCCESS
- Production Live Resource Integrity `34617890313` SUCCESS.

## Build 104 operational boundary

Build 104 — **Product Work Session Focus Views** is the active Development closure candidate. It consumes Build 103's exact external closure and adds presentation-only focus across the existing browser-local Product work session.

The current Product-browser rules are:
- the work session remains browser-local under `dd_catalog_work_session_v1` and holds at most 60 Product IDs;
- focus modes are All, Active, Blocked, Ready and Done;
- focus changes reset to page 1 and Build 103's 20-item paging operates against focused items;
- page summaries report the focused Product range and total session size;
- Active excludes completed Products and Done contains completed Products only;
- Blocked and Ready reuse readiness already rendered by the primary Products loader;
- Locate next Product and Open next blocker scan the entire ordered session, not only the current focus;
- Manual Move Up / Move Down is available under All focus only so hidden focused Products cannot make the stored manual sequence ambiguous;
- Build 103 paging, Build 102 manual reorder, Build 101 priorities/order modes, Build 100 work sessions, Build 99 saved work views/sort, Build 98 readiness triage and earlier Product/table/responsive protections remain in force;
- hidden Products do not silently clear search, focus, triage or saved-view filters;
- Build 104 adds no Product/readiness API or database read;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 104 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 105 must ingest Build 104's final external closure.

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
