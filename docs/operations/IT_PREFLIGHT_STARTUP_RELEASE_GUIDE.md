# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 105 — Product Work Session Completion & Handoff is the last fully verified checkpoint:
- `dev` `1ce61a319c0534ea386c64978f2ed58c3391470d`
- tree `045fa67ef20ee1aec9f87dfa6e2fd4cf02219690`
- System Gate `34631203672` SUCCESS
- Current Application Quality `34631203855` SUCCESS
- I.T. Admin Runtime Proof `34631203641` SUCCESS
- Repository Branch Hygiene `34631204122` SUCCESS.

## Verified Production

Build 105 is the current Production checkpoint:
- `main` `1ce61a319c0534ea386c64978f2ed58c3391470d`
- tree `045fa67ef20ee1aec9f87dfa6e2fd4cf02219690`
- Production Pages Deploy `34631390665` SUCCESS
- Production Live Resource Integrity `34631490953` SUCCESS.

## Build 106 operational boundary

Build 106 — **Marketplace Listing Readiness** is the active Development closure candidate. It adds browser-local per-Product Etsy, Facebook Marketplace, Pinterest and manual-export readiness plus user-initiated copy and JSON download packs. It checks hero image, image quality, listing copy, dimensions/materials, price, inventory, Canada shipping/local pickup, tags/category and the Product readiness already rendered on the page.

It reuses `dd_admin_products_snapshot_v2` and existing rendered readiness. It adds no Product/readiness API/database read, performs no Product/Inventory mutation, adds no canonical migration and cannot publish to a marketplace or provider. Build 105 handoff, Build 104 focus views, Build 103 paging, Build 102 manual reorder, Build 101 priority/order modes, Build 100 work sessions and earlier Product protections remain active.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 106 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 107 must ingest Build 106's final external closure.

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
