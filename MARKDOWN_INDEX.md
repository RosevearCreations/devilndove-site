# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 106

Build 106 — **Marketplace Listing Readiness** is the current Development closure candidate.

Last fully verified Development is Build 105:
- `dev` `1ce61a319c0534ea386c64978f2ed58c3391470d`
- tree `045fa67ef20ee1aec9f87dfa6e2fd4cf02219690`
- System `34631203672` SUCCESS
- Quality `34631203855` SUCCESS
- I.T. `34631203641` SUCCESS
- Hygiene `34631204122` SUCCESS.

Current Production is Build 105:
- `main` `1ce61a319c0534ea386c64978f2ed58c3391470d`
- tree `045fa67ef20ee1aec9f87dfa6e2fd4cf02219690`
- Production Pages Deploy `34631390665` SUCCESS
- Production Live Resource Integrity `34631490953` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build106-marketplace-listing-readiness.json`
3. `release467-build105-product-work-session-handoff.json`
4. `docs/operations/RELEASE_467_BUILD_106_MARKETPLACE_LISTING_READINESS.md`
5. `PROJECT_STATUS_AND_ROADMAP.md` — includes the autonomous Build 106–113 layout.
6. `AI_HANDOFF.md`
7. `SANITY_HEALTH_CHECK.md`
8. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
9. `migrations/canonical/manifest.json`

## Build 106 authority contract

Build 106 consumes exact Build 105 Development and Production closure and adds browser-local Etsy, Facebook Marketplace, Pinterest and manual-export listing readiness. It evaluates hero image, image quality, title/description, dimensions/materials, price, inventory state, Canada shipping/local pickup, tags/category and already-rendered readiness evidence. It reuses `dd_admin_products_snapshot_v2`, adds no Product/readiness network/database read, performs no Product/Inventory mutation, and cannot publish to a provider or marketplace.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
