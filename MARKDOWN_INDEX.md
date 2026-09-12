# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 110

Build 110 — **Storefront Evidence & SEO Conversion Audit** is the current Development closure candidate.

Last fully verified Development is Build 109:
- `dev` `fe9d80dc8ace5dd5ac52f877ea16badf47b27c66`
- tree `a8b8c6e0910cb840c78afa468701929d733875d2`
- System `34666034487` SUCCESS
- Quality `34666034490` SUCCESS
- I.T. `34666034497` SUCCESS
- Hygiene `34666034518` SUCCESS.

Current Production is Build 109:
- `main` `fe9d80dc8ace5dd5ac52f877ea16badf47b27c66`
- tree `a8b8c6e0910cb840c78afa468701929d733875d2`
- Production Pages Deploy `34666119275` SUCCESS
- Production Live Resource Integrity `34666156495` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build110-storefront-evidence-seo-conversion-audit.json`
3. `release467-build109-customer-proof-fulfilment.json`
4. `docs/operations/RELEASE_467_BUILD_110_STOREFRONT_EVIDENCE_SEO_CONVERSION_AUDIT.md`
5. `PROJECT_STATUS_AND_ROADMAP.md` — includes the autonomous Build 110–113 layout.
6. `AI_HANDOFF.md`
7. `SANITY_HEALTH_CHECK.md`
8. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
9. `migrations/canonical/manifest.json`

## Build 110 authority contract

Build 110 consumes exact Build 109 Development and Production closure and audits the existing public Storefront without creating a second Product, media or SEO authority. Shop uses its already-loaded Product payload; Product detail uses buyer-visible rendered facts; Collections schema mirrors visible permanent paths; Custom Request schema mirrors the visible reviewed service.

Placeholder media is excluded from evidence claims, missing facts remain missing, and structured data is constrained to visible Product/service facts. No Product API request, extra database read, schema migration, R2 mutation, Product/Inventory mutation or provider publication is added.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
