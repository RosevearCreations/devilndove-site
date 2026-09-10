# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 86 — I.T. Operations & Self-Diagnostics is the last fully verified checkpoint:
- `dev` `5fdbb5346e52f17072671274dc36e4d3527a7905`
- tree `f9037baf12bc3489b3a0df3df03eef5bdbe85e90`
- System Gate `34419070653` SUCCESS
- Current Application Quality `34419070636` SUCCESS
- I.T. Admin Runtime Proof `34419070642` SUCCESS
- Repository Branch Hygiene `34419070660` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 86 is the current Production checkpoint:
- `main` `5fdbb5346e52f17072671274dc36e4d3527a7905`
- tree `f9037baf12bc3489b3a0df3df03eef5bdbe85e90`
- Production Pages Deploy `34419211512` SUCCESS
- Production Live Resource Integrity `34419284027` SUCCESS.

The Production chain proved exact green Development ancestry, Production business-data preservation, canonical Production D1, isolation/FK integrity, exact deployment, live bindings, public smoke and promotion proof. Live-resource verification separately proved supported account/D1 access, same-origin Product R2 bytes, Product API photography and Production D1 diagnostic reachability.

## Build 87 operational boundary

Build 87 — **Production Authority & Restart Convergence** is the active Development closure candidate. It consumes Build 86's external exact-SHA proof and converges current I.T., Reliability, Deployment Preflight and restart documentation onto that verified baseline.

Build 86 remains the historical feature authority for the eight-domain I.T. self-diagnostics implementation covering deployment identity, D1/R2 bindings, canonical migration/schema integrity, runtime incidents, root-admin/module authority, provider setup/HOLDs, exact-SHA release gates and backup/recovery guidance.

Build 87 never repairs automatically. It performs no request-time schema mutation, D1/R2/binding mutation, provider execution/publication, deployment execution, backup restore or Production business-data overwrite.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 87 ingests the exact Build 86 Development and Production closure. Build 87 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

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
