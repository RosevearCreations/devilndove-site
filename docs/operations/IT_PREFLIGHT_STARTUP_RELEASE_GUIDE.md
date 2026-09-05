# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 60 — Production Resource Binding & Account/Auth Recovery is the last fully verified checkpoint:
- `dev` `2f099d88b39a35a3bb8cf73798ba2c30b2b82083`
- tree `66bbd5b61e815b2bd9f2483eaa5161542c177e9a`
- System Gate `33972673238` SUCCESS
- Current Application Quality `33972673246` SUCCESS
- I.T. Admin Runtime Proof `33972673266` SUCCESS
- Repository Branch Hygiene `33972673254` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 60 is the current standard Production checkpoint:
- `main` `732bac55a4a43434a31090bb3b9c6b7b2c5a7939`
- tree `66bbd5b61e815b2bd9f2483eaa5161542c177e9a`
- Production Pages Deploy `33972781588` SUCCESS.

The Production workflow proved exact green Development ancestry, Production business-data snapshot/preservation, canonical Production D1, isolation/FK integrity, exact deployment, live bindings, public smoke and promotion proof.

## Build 61 validation boundary

Production Live Resource Integrity run `33972823412` failed before its resource assertions because its Wrangler D1 invocation omitted the Cloudflare account context present in the successful Production deployment workflow. Its R2/API checks were skipped. Do not interpret that run as a proven live D1/R2 failure.

Build 61 — **Production Live Resource Proof Repair**:
- adds the canonical `CLOUDFLARE_ACCOUNT_ID` to the proof;
- exposes Wrangler output instead of redirecting the critical diagnostic silently;
- proves supported `users`/`sessions` table columns read-only;
- fetches known R2 object `Itemsforsale/DD215-216B.jpeg` through the live same-origin route;
- requires `/api/products` to return at least one Product and at least one public image URL;
- fetches real Product image bytes, using the same-origin fallback when the custom asset hostname fails;
- requires `/api/storefront-merchandising` JSON/OK;
- requires the public auth diagnostic to reach Production D1.

Build 61 changes no application runtime, D1 business data, R2 object, canonical migration, provider execution or Cloudflare Access policy.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 61’s first source mutation ingested the exact Build 60 Development and Production closure. Build 61 must pass exact feature-head proofs, then exact merged-`dev` System + Quality + I.T. + Hygiene and Preview acceptance. Only that exact green tree may be promoted to `main` to execute the repaired live-resource proof.

## Environment boundaries

- Development Pages: `dev` / `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Development Product R2: `devilndove-toolshed-images-dev`
- Development CAIP R2: `devilndove-caip-media-dev`
- Production Pages: `main` / `https://devilndove.com`
- Production D1: `devilndove-prod-r462` / `f34a741b-0000-45b0-9a96-6be08754d563`
- Production Product R2: `devilndove-toolshed-images`
- Production CAIP R2: `devilndove-caip-media`
- Canonical migrations: exactly `0001`–`0004` via `scripts/d1_migrate.py`.

Never overwrite Production business data from Development. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain independent HOLD/evidence-dependent lanes. The `business-administration` browser warning remains a separate legacy module-name convergence task.
