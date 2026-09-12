# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 108 — Mobile Workshop Assistant is the last fully verified checkpoint:
- `dev` `f9d68ea87a8c2622e8ec05e09e64f3a0672ba2b8`
- tree `6d2e524ceb06b90dad9e01e94297cdedde61920c`
- System Gate `34663299696` SUCCESS
- Current Application Quality `34663299662` SUCCESS
- I.T. Admin Runtime Proof `34663299580` SUCCESS
- Repository Branch Hygiene `34663299597` SUCCESS.

## Verified Production

Build 108 is the current Production checkpoint:
- `main` `f9d68ea87a8c2622e8ec05e09e64f3a0672ba2b8`
- tree `6d2e524ceb06b90dad9e01e94297cdedde61920c`
- Production Pages Deploy `34663390560` SUCCESS
- Production Live Resource Integrity `34663433029` SUCCESS.

## Build 109 operational boundary

Build 109 — **Customer Proof & Fulfilment Follow-through** is the active Development closure candidate. It improves the existing private custom-order status flow with reviewed stage-specific next steps, local-pickup/Canada-shipping follow-through, customer-visible proof-consent status and optional completion review/photo prompts.

The implementation reuses the existing customer-order status data already loaded by `/api/custom-request-order`; it does not add another database query. Internal production notes remain excluded. Customer-private proof stays private. Public use still requires explicit recorded consent plus moderation, and the private status page cannot grant publication authority. No customer-submission mutation, canonical migration, R2 write, Product/Inventory mutation or provider publication is introduced.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 109 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 110 must ingest Build 109's final external closure.

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
