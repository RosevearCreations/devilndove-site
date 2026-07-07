# Devil n Dove Sanity Health Check — Build 209

## Canonical truth

Read `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` first. This file is a short quality checkpoint.

## Build 209 checkpoint

- `/admin/inventory-operations/` has scoped contrast and responsive fixes only; public storefront styling is not changed.
- All inventory controls, cards, inputs, tables, messages, and action columns use a readable dark theme.
- Desktop tables stay inside their own scroll container when wide. At phone widths, inventory, movement, and stock report tables become labelled cards.
- Inventory page accepts `?product_id=<id>` and routes that context into the Product Tools & Supplies selector.
- Product Release Preflight adds read-only, non-blocking inventory/maker-input context.
- Inventory context never affects release handoff/publish scores and never writes stock, reservations, costs, supplier data, product-resource links, CAIP evidence, rights, consent, media, or publication status.
- No D1 migration is required.
- Admin visual placeholder remains internal-only.
- Outstanding separate incident: `POST /api/auth/login` `500` still needs a safe response/log detail; current `users`/`sessions` D1 schema is already confirmed.

## Required proof

Run `BUILD209_VALIDATION.md` after deployment, then `POST_DEPLOY_SMOKE_TEST.md`.
