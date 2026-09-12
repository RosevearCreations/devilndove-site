# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 111

Build 111 — **Orders-to-Fulfilment Reconciliation** is the current Development closure candidate.

Last fully verified Development is Build 110:
- `dev` `a881a7d6c6f38a297511b0446e780c9f28574c9d`
- tree `f92ba677efc109b1748f6892044e3f3c06500315`
- System `34667564542` SUCCESS
- Quality `34667564497` SUCCESS
- I.T. `34667564555` SUCCESS
- Hygiene `34667564565` SUCCESS.

Current Production is Build 110:
- `main` `a881a7d6c6f38a297511b0446e780c9f28574c9d`
- tree `f92ba677efc109b1748f6892044e3f3c06500315`
- Production Pages Deploy `34669029532` SUCCESS
- Production Live Resource Integrity `34669069642` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build111-orders-fulfilment-reconciliation.json`
3. `release467-build110-storefront-evidence-seo-conversion-audit.json`
4. `docs/operations/RELEASE_467_BUILD_111_ORDERS_FULFILMENT_RECONCILIATION.md`
5. `PROJECT_STATUS_AND_ROADMAP.md` — includes the autonomous Build 111–113 layout.
6. `AI_HANDOFF.md`
7. `SANITY_HEALTH_CHECK.md`
8. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
9. `migrations/canonical/manifest.json`

## Build 111 authority contract

Build 111 consumes exact Build 110 Development and Production closure and reconciles the existing Build 82 Orders / Fulfilment workflow against current Finance, shared Product/Inventory/Production, item-mode and status-history evidence without creating another Orders mutation authority.

The existing Build 82 transition contract remains authoritative for reviewed non-financial status writes. Build 111 is read-only, treats shared Product readiness as evidence rather than reservation, keeps customer communication copy-only, and adds no inventory/production/payment/refund/accounting/provider execution.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
