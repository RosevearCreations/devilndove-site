# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 107 — Storefront Discovery & Collection Improvements is the last fully verified checkpoint:
- `dev` `943d7af070bc1b01506f2b8d3e8fc36b8aed7750`
- tree `a16e55754b40279050b781ed5bad1892ee62b76c`
- System Gate `34662074529` SUCCESS
- Current Application Quality `34662074545` SUCCESS
- I.T. Admin Runtime Proof `34662074524` SUCCESS
- Repository Branch Hygiene `34662074579` SUCCESS.

## Verified Production

Build 107 is the current Production checkpoint:
- `main` `943d7af070bc1b01506f2b8d3e8fc36b8aed7750`
- tree `a16e55754b40279050b781ed5bad1892ee62b76c`
- Production Pages Deploy `34662205783` SUCCESS
- Production Live Resource Integrity `34662253285` SUCCESS.

## Build 108 operational boundary

Build 108 — **Mobile Workshop Assistant** is the active Development closure candidate. It adds a phone-first capture/review path for one workshop image, consent/privacy intent, image role, optional Product association, story note, caption draft and explicit specialist-review handoff.

Photo bytes remain in the active browser tab and are not persisted to localStorage or included in the exported JSON. Lightweight metadata/text uses browser-local storage. Product association uses `GET /api/products?limit=100` only. Public-use candidates fail closed unless consent evidence is `owner_no_people` or `explicit_release`. No media upload, Product/Inventory/D1/R2 mutation, canonical migration, provider execution or publication is introduced.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 108 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 109 must ingest Build 108's final external closure.

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
