# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 90 — External Acceptance Evidence Depth & Cross-Lane Guidance is the last fully verified checkpoint:
- `dev` `ab23457370ced9224facc2a09c1cca7b1ff20968`
- tree `54f069f37e09e6f48e035f98656423ed28aa85f4`
- System Gate `34434124113` SUCCESS
- Current Application Quality `34434123999` SUCCESS
- I.T. Admin Runtime Proof `34434124058` SUCCESS
- Repository Branch Hygiene `34434124046` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 90 is the current Production checkpoint:
- `main` `ab23457370ced9224facc2a09c1cca7b1ff20968`
- tree `54f069f37e09e6f48e035f98656423ed28aa85f4`
- Production Pages Deploy `34434296247` SUCCESS
- Production Live Resource Integrity `34434356959` SUCCESS.

## Build 91 operational boundary

Build 91 — **Prelaunch Authority & Go-Live Decision Convergence** is the active Development closure candidate. It consumes Build 90's external exact-SHA proof and modernizes the existing `/admin/prelaunch/` surface.

The current launch-decision rules are:
- Startup Readiness remains the D1-backed mutable status owner; prelaunch reads it only with GET;
- the Startup Readiness API's `expected_total` is authoritative for the current row count, rather than a historical hard-coded 43-gate label;
- a degraded or unavailable Startup Readiness response keeps the launch decision on HOLD;
- the current External Acceptance control center supplies all five external lanes, passed/required counts and guided next actions;
- Build 90 technical Development/Production GREEN is necessary but does not imply unrestricted go-live readiness;
- Canada-only commerce remains active in CAD, U.S. sales/shipping remain disabled, and existing local pickup remains supported;
- manual refresh is allowed; no polling or automatic corrective action is added.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 91 ingests the exact Build 90 Development and Production closure. Build 91 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

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
