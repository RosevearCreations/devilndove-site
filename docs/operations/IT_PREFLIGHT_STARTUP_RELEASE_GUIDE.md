# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 102 — Product Work Manual Reorder & Accessibility is the last fully verified checkpoint:
- `dev` `7325c093f47c29aafaef0cff3da88f1b273227`
- tree `f7c1e97b1b811af68c2701db985ccc824e11abca`
- System Gate `34606547840` SUCCESS
- Current Application Quality `34606547841` SUCCESS
- I.T. Admin Runtime Proof `34606547865` SUCCESS
- Repository Branch Hygiene `34606547882` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 102 is the current Production checkpoint:
- `main` `7325c093f47c29aafaef0cff3da88f1b273227`
- tree `f7c1e97b1b811af68c2701db985ccc824e11abca`
- Production Pages Deploy `34606720131` SUCCESS
- Production Live Resource Integrity `34606812380` SUCCESS.

## Build 103 operational boundary

Build 103 — **Product Work Session Paging & Full Coverage** is the active Development closure candidate. It consumes Build 102's exact external closure and exposes the entire allowed browser-local Product work session without changing Product authority.

The current Product-browser rules are:
- the work session remains browser-local under `dd_catalog_work_session_v1` and holds at most 60 Product IDs;
- the session panel exposes 20 Product entries per page with Previous and Next buttons;
- Previous is disabled on the first page and Next on the final page;
- the page summary reports page number, visible Product range and total pinned Products;
- changing the session sort returns to page 1;
- removing items or clearing completed items clamps the active page safely;
- Build 102 Manual Move Up/Move Down remains available and a cross-page move follows the moved Product to its destination page;
- Build 101 priorities and ordering modes remain available: Priority, Blockers, Readiness, Recent and Manual;
- Locate next Product and Open next blocker scan the entire ordered session, not only the current page;
- Blockers/Readiness ordering reuses readiness already rendered by the primary Products loader;
- hidden Products do not silently clear search, focus, triage or saved-view filters;
- Build 103 adds no Product/readiness API or database read;
- Build 102 manual reorder, Build 101 priority/order, Build 100 work sessions, Build 99 saved work views/sort, Build 98 readiness triage and earlier Product/table/responsive protections remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 103 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 104 must ingest Build 103's final external closure.

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
