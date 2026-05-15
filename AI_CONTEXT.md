# AI Context — Devil n Dove

Current sync: 2026-05-14 — Build 125.

Devil n Dove is a Southern Ontario maker/storefront project with handmade jewelry, polymer clay, resin, laser engraving, sublimation, workshop tools/supplies, vintage/collectible finds, and admin/accounting workflows.

## Current technical direction
- Cloudflare Pages + Pages Functions.
- Cloudflare D1 as the long-term operational database.
- JSON is still used as seed/fallback/static bridge data, but DB-first workflows are preferred for inventory, catalog, accounting, and admin-managed content.
- Money is stored as cents in D1 and displayed as dollars in admin UI.
- Tools and supplies currently owned by the shop default to at least one stock unit.
- Consumables use package math: one stock package can contain many usage units.

## Build 125 focus
- Amazon purchase review/apply workflow for private staging rows.
- Inventory unit-cost history.
- Reconciliation exception queue actions.
- Journal validation/posting guardrails.
- Local-intent SEO pages and sitemap.

## Strong guardrails
- Do not deploy raw Amazon order reports publicly.
- Update Markdown and schema files each pass.
- Keep one H1 per exposed HTML page.
- Prefer D1 for authoritative operational data.
- Keep robust fallbacks and admin-visible error states.
