# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 87 — Production Authority & Restart Convergence is the last fully verified checkpoint:
- `dev` `646d73710784008617157cf5746a66f053daba83`
- tree `709f802cf7ca24a12f48bd7c8b562a92b306fcae`
- System Gate `34421392242` SUCCESS
- Current Application Quality `34421392244` SUCCESS
- I.T. Admin Runtime Proof `34421392231` SUCCESS
- Repository Branch Hygiene `34421392188` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 87 is the current Production checkpoint:
- `main` `646d73710784008617157cf5746a66f053daba83`
- tree `709f802cf7ca24a12f48bd7c8b562a92b306fcae`
- Production Pages Deploy `34421532872` SUCCESS
- Production Live Resource Integrity `34421613381` SUCCESS.

The Production chain proved exact green Development ancestry, Production business-data preservation, canonical Production D1, isolation/FK integrity, exact deployment, live bindings, public smoke and promotion proof. Live-resource verification separately proved supported account/D1 access, same-origin Product R2 bytes, Product API photography and Production D1 diagnostic reachability.

## Build 88 operational boundary

Build 88 — **External Acceptance Control Center Convergence** is the active Development closure candidate. It consumes Build 87's external exact-SHA proof and adds a current operator surface for the remaining external acceptance work.

The current control center reports:
- Stripe Development six-part evidence: credentials, checkout, webhook signature, provider-synchronized refund, reconciliation, idempotent replay;
- PayPal sandbox six-part evidence: credentials, approval/capture, webhook verification, provider-synchronized refund, reconciliation, idempotent replay;
- Social OAuth selected-provider evidence with publication closed;
- CAIP private-media authenticated evidence state;
- Cloudflare Access service-token acceptance as a separate external proof.

Historical Build 6/7 provider/commercial engines remain preserved as regression/evidence authorities. The current status endpoint is GET-only. Deliberate Stripe/PayPal test actions continue through the retained guarded runner and require Development host, test/sandbox credentials, provider mutation switches and explicit human confirmation. Production provider execution remains closed.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 88 ingests the exact Build 87 Development and Production closure. Build 88 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

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

Never overwrite Production business data from Development. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain independent `HOLD_EXTERNAL` lanes; CAIP private-media acceptance remains evidence-dependent until fresh evidence proves otherwise.
