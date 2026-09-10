# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 89 — External Acceptance Environment Isolation & Guided Recovery is the last fully verified checkpoint:
- `dev` `68ac415302bceddb81e6faea15fbbebb3a76f24a`
- tree `1a7cccf46b29718ea63d532c8c22322bcca98ffd`
- System Gate `34425720516` SUCCESS
- Current Application Quality `34425720539` SUCCESS
- I.T. Admin Runtime Proof `34425720559` SUCCESS
- Repository Branch Hygiene `34425720537` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 89 is the current Production checkpoint:
- `main` `68ac415302bceddb81e6faea15fbbebb3a76f24a`
- tree `1a7cccf46b29718ea63d532c8c22322bcca98ffd`
- Production Pages Deploy `34425875315` SUCCESS
- Production Live Resource Integrity `34425949898` SUCCESS.

The Production chain proved exact green Development ancestry, Production business-data preservation, canonical Production D1, isolation/FK integrity, exact deployment, live bindings, public smoke and promotion proof. Live-resource verification separately proved supported account/D1 access, same-origin Product R2 bytes, Product API photography and Production D1 diagnostic reachability.

## Build 90 operational boundary

Build 90 — **External Acceptance Evidence Depth & Cross-Lane Guidance** is the active Development closure candidate. It consumes Build 89's external exact-SHA proof and deepens the current acceptance control center without widening execution authority.

The current control center now follows these rules:
- Build 89 environment isolation remains intact: Production is bridge-first/read-only and the retained provider runner is Development-only;
- Stripe Development remains six-part evidence: credentials, checkout, webhook signature, provider-synchronized refund, reconciliation, idempotent replay;
- PayPal sandbox remains six-part evidence: credentials, approval/capture, webhook verification, provider-synchronized refund, reconciliation, idempotent replay;
- Social OAuth exposes provider-selection, readiness, intended-account, controlled-lifecycle and publication-closed checks;
- CAIP private-media exposes schema, authenticated review-proxy serve, ranged streaming, no-copy and no-cache checks, with object-key presence informational only;
- Cloudflare Access exposes source harness, exact reviewed SHA, service-token secret availability, dispatch success and expected application `401` as a five-check contract; only the source harness is locally knowable;
- all five lanes show passed/required counts and one next action;
- timestamps are shown when available but the application never silently declares evidence fresh or an external workflow successful.

Historical Build 6/7 provider/commercial engines remain preserved as regression/evidence authorities. Production provider execution and provider publication remain closed.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 90 ingests the exact Build 89 Development and Production closure. Build 90 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

The runtime I.T. diagnostic and external acceptance page cannot self-attest GitHub/Cloudflare workflow status. A local GREEN diagnostic therefore never substitutes for the exact external release proof.

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

Never overwrite Production business data from Development. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain independent `HOLD_EXTERNAL` lanes; CAIP private-media acceptance remains evidence-dependent until current external evidence proves otherwise.
