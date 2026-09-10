# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 91 — Prelaunch Authority & Go-Live Decision Convergence is the last fully verified checkpoint:
- `dev` `1d5519b976d108e7d4a558876863be5559a67e35`
- tree `6a62d01c1be002b78c3c8d05993c40676e41e208`
- System Gate `34486729268` SUCCESS
- Current Application Quality `34486729227` SUCCESS
- I.T. Admin Runtime Proof `34486729225` SUCCESS
- Repository Branch Hygiene `34486729311` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 91 is the current Production checkpoint:
- `main` `1d5519b976d108e7d4a558876863be5559a67e35`
- tree `6a62d01c1be002b78c3c8d05993c40676e41e208`
- Production Pages Deploy `34488492622` SUCCESS
- Production Live Resource Integrity `34488622668` SUCCESS.

## Build 92 operational boundary

Build 92 — **Prelaunch Action Queue Completeness & Ownership** is the active Development closure candidate. It consumes Build 91's exact external closure and keeps the existing `/admin/prelaunch/` decision fail-closed while making its action queue complete.

The current launch-decision rules are:
- Startup Readiness remains the D1-backed mutable status owner; prelaunch reads it only with GET;
- `passed` and `not_applicable` are the only closed readiness states;
- every other returned Startup Readiness row is listed as an unresolved launch action;
- Blocked/Failed rank first, then Needs Review, In Progress, Not Started and any other open state;
- recorded owner and due date are displayed; missing fields remain explicitly unassigned/undated;
- no unresolved item may hold launch while being omitted from the action queue;
- external acceptance remains a separate five-lane queue with passed/required counts and guided next actions;
- a degraded or unavailable Startup Readiness or external-acceptance response keeps launch on HOLD;
- Build 91 technical Development/Production GREEN is necessary but does not imply unrestricted go-live readiness;
- Canada-only commerce remains active in CAD, U.S. sales/shipping remain disabled, and existing local pickup remains supported;
- manual refresh is allowed; no polling or automatic corrective action is added.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 92 ingests the exact Build 91 Development and Production closure. Build 92 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

The runtime I.T., preflight, prelaunch and external-acceptance pages cannot self-attest GitHub/Cloudflare workflow status. A local GREEN diagnostic never substitutes for exact external release proof.

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

Never overwrite Production business data from Development. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain independent `HOLD_EXTERNAL` lanes; CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. U.S. sales/shipping remain disabled.
