# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 85 — Socials & OAuth Acceptance is the last fully verified checkpoint:
- `dev` `33dc9857e1fada5549181a28ce4ef26c4a919572`
- tree `b2c6b80401241f1757cd172511d12f9d813bc817`
- System Gate `34386667094` SUCCESS
- Current Application Quality `34386667361` SUCCESS
- I.T. Admin Runtime Proof `34386667111` SUCCESS
- Repository Branch Hygiene `34386667194` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings and non-secret smoke: SUCCESS.

## Verified Production

Build 85 is the current Production checkpoint:
- `main` `33dc9857e1fada5549181a28ce4ef26c4a919572`
- tree `b2c6b80401241f1757cd172511d12f9d813bc817`
- Production Pages Deploy `34386848470` SUCCESS
- Production Live Resource Integrity `34386976511` SUCCESS.

The Production chain proved exact green Development ancestry, Production business-data preservation, canonical Production D1, isolation/FK integrity, exact deployment, live bindings, public smoke and promotion proof. Live-resource verification separately proved supported account/D1 access, same-origin Product R2 bytes, Product API photography and Production D1 diagnostic reachability.

## Build 86 operational boundary

Build 86 — **I.T. Operations & Self-Diagnostics** is the active Development closure candidate. It converges the current I.T., Reliability and Deployment Preflight truth onto the Build 85 verified baseline and adds one read-only diagnostic view covering:
- deployment environment, branch and exact runtime SHA when exposed;
- D1 and Product/CAIP R2 binding presence;
- canonical migration ledger/proofs, expected five-module authority and foreign-key integrity;
- runtime incidents and database reachability;
- root-administrator effective manage authority with explicit I.T. manage grant;
- Stripe/PayPal/Social OAuth configuration presence without secret values;
- exact-SHA release-gate requirements and external acceptance separation;
- backup/rollback/recovery guidance and prioritized corrective instructions.

Build 86 never repairs automatically. It performs no request-time schema mutation, D1/R2/binding mutation, provider execution/publication, deployment execution, backup restore or Production business-data overwrite.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 86 ingests the exact Build 85 Development and Production closure. Build 86 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

The runtime I.T. diagnostic cannot self-attest GitHub/Cloudflare workflow status. A local GREEN diagnostic therefore never substitutes for the exact external release proof.

## Recovery discipline

- Record a current D1 recovery point before a real schema change.
- Rehearse restore only in a test/copied environment; never overwrite live Production business data as a diagnostic action.
- Verify representative users, Products, Inventory, Orders, Packaging and readiness records after an isolated D1 restore.
- Verify R2 inventory/re-link a safe test object without deleting live media.
- Rehearse Pages rollback and return to the current deployment with smoke evidence.
- Keep required binding/variable names documented without secret values.
- Record recovery time and update the runbook when a rehearsal exposes missing steps.

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

Never overwrite Production business data from Development. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain independent `HOLD_EXTERNAL` lanes; CAIP private-media acceptance remains evidence-dependent.
