# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 109 — Customer Proof & Fulfilment Follow-through is the last fully verified checkpoint:
- `dev` `fe9d80dc8ace5dd5ac52f877ea16badf47b27c66`
- tree `a8b8c6e0910cb840c78afa468701929d733875d2`
- System Gate `34666034487` SUCCESS
- Current Application Quality `34666034490` SUCCESS
- I.T. Admin Runtime Proof `34666034497` SUCCESS
- Repository Branch Hygiene `34666034518` SUCCESS.

## Verified Production

Build 109 is the current Production checkpoint:
- `main` `fe9d80dc8ace5dd5ac52f877ea16badf47b27c66`
- tree `a8b8c6e0910cb840c78afa468701929d733875d2`
- Production Pages Deploy `34666119275` SUCCESS
- Production Live Resource Integrity `34666156495` SUCCESS.

## Build 110 operational boundary

Build 110 — **Storefront Evidence & SEO Conversion Audit** is the active Development closure candidate. It audits existing Storefront Product facts, buyer-visible Product detail, Collections paths and the Custom Request service without adding a second Product/media/SEO authority.

Shop uses the Product payload it already loaded. Product detail uses already-rendered buyer facts. Placeholder media is excluded from evidence and Product schema. Collections structured data mirrors visible permanent discovery paths, and Custom Request Service schema mirrors the visible reviewed custom-request service in Ontario, Canada. No additional Product API request, database query, canonical migration, R2 write, Product/Inventory mutation or provider publication is introduced.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 110 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 111 must ingest Build 110's final external closure.

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
