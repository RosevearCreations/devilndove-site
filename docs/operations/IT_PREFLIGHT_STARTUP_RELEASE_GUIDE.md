# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 106 — Marketplace Listing Readiness is the last fully verified checkpoint:
- `dev` `e22b3f9c7fcb223114b48e52a51e0c537e6da081`
- tree `334d907d8e39dcbc8a02dc80cfa949abf13bd8c5`
- System Gate `34655258282` SUCCESS
- Current Application Quality `34655258284` SUCCESS
- I.T. Admin Runtime Proof `34655258283` SUCCESS
- Repository Branch Hygiene `34655258294` SUCCESS.

## Verified Production

Build 106 is the current Production checkpoint:
- `main` `e22b3f9c7fcb223114b48e52a51e0c537e6da081`
- tree `334d907d8e39dcbc8a02dc80cfa949abf13bd8c5`
- Production Pages Deploy `34655379475` SUCCESS
- Production Live Resource Integrity `34655438506` SUCCESS.

## Build 107 operational boundary

Build 107 — **Storefront Discovery & Collection Improvements** is the active Development closure candidate. Shop and Collections now expose permanent links for Under $25, One-of-a-kind, Local pickup, Custom gifts, Vintage finds, Laser engraved, Workshop experiments and Proof-rich Products.

Under $25 and Vintage use existing Product filters. Evidence-backed `discover=` paths consume only the already-loaded Product payload and require public evidence before a Product is included. The feature adds no Product API/database read, Product/Inventory mutation, canonical migration or provider publication. Build 106 marketplace readiness and earlier Product workflow protections remain active.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 107 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 108 must ingest Build 107's final external closure.

The runtime I.T., preflight and reliability pages cannot self-attest GitHub/Cloudflare workflow status. A local GREEN diagnostic never substitutes for exact external release proof.

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
