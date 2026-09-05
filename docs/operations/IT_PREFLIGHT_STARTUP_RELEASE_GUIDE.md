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

## Build 61 incident / validation boundary

Production Live Resource Integrity run `33972823412` failed before its resource assertions because its Wrangler D1 invocation omitted the Cloudflare account context present in the successful Production deployment workflow. That run is not evidence of a live D1 schema failure.

Subsequent Build 61 read-only diagnostics established the incident boundary:
- Product rows and Product image metadata remain present in Production D1, while sampled historical Product delivery URLs returned HTML 404s.
- Movie rows and front/back cover metadata remain present in Production D1, while sampled historical Movie `r2.dev` delivery URLs returned HTML 404s.
- Production `users` and `sessions` tables are present and schema-compatible.
- the account writer used 210,000 PBKDF2 iterations, above the Cloudflare Workers WebCrypto PBKDF2 runtime maximum used by this application path.
- existing Cloudflare deployment credentials do not have R2 inventory/list permission; Build 61 therefore performs no blind R2 object copy or mutation.

Build 61 — **Production Live Resource Proof Repair**:
- uses 100,000 PBKDF2-HMAC-SHA256 iterations for new password writes while preserving verification of legacy SHA-256 and existing PBKDF2 hashes by their embedded iteration count;
- maps browser domain groups onto the canonical five modules so `/admin/users/` resolves to `it-platform` instead of retired `business-administration`;
- extends the read-only same-origin `/api/product-media` authority to historical Product and Movie public URLs and the `movies/` prefix;
- keeps R2 access read-only (`bucket.get` only; no list/put/delete);
- strengthens the live-resource proof so Product/Movie metadata cannot be mistaken for proven image-byte availability;
- preserves canonical migrations exactly `0001`–`0004` and performs no D1 business-data migration.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 61’s first source mutation ingested the exact Build 60 Development and Production closure. Build 61 must pass exact feature-head proofs, then exact merged-`dev` System + Quality + I.T. + Hygiene and Preview acceptance. Only that exact green tree may be promoted to `main` under explicit Production authorization.

Production must not be called incident-green merely because Pages deploys. Live account behavior and actual Product/Movie image bytes must be verified separately after the exact Build 61 Production deployment.

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

Never overwrite Production business data from Development. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain independent HOLD/evidence-dependent lanes.
