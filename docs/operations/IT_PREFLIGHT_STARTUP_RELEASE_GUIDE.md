# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 110 — Storefront Evidence & SEO Conversion Audit is the last fully verified checkpoint:
- `dev` `a881a7d6c6f38a297511b0446e780c9f28574c9d`
- tree `f92ba677efc109b1748f6892044e3f3c06500315`
- System Gate `34667564542` SUCCESS
- Current Application Quality `34667564497` SUCCESS
- I.T. Admin Runtime Proof `34667564555` SUCCESS
- Repository Branch Hygiene `34667564565` SUCCESS.

## Verified Production

Build 110 is the current Production checkpoint:
- `main` `a881a7d6c6f38a297511b0446e780c9f28574c9d`
- tree `f92ba677efc109b1748f6892044e3f3c06500315`
- Production Pages Deploy `34669029532` SUCCESS
- Production Live Resource Integrity `34669069642` SUCCESS.

## Build 111 operational boundary

Build 111 — **Orders-to-Fulfilment Reconciliation** is the active Development closure candidate. It keeps the existing Build 82 Operations-owned fulfilment transition contract as the sole non-financial order-status mutation owner.

Build 111 adds a GET-only reconciliation over the Build 82 workflow, Build 27 Finance settlement readiness, Build 29 Production readiness (including Build 26 Inventory fulfilment evidence), and one bounded order-item/status-history evidence read. It surfaces contradictions and missing evidence before an operator uses the existing transition controls. Shared Product readiness is never interpreted as an order-specific reservation or production authorization.

No second order mutation route, customer-message send, inventory reservation/deduction, production post, payment/refund/accounting execution, canonical migration, R2 mutation or provider action is introduced.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 111 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 112 must ingest Build 111's final external closure.

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
