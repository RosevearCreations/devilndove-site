# Development Roadmap — Fresh Working Plan

Current sync: 2026-05-10 cleanup and next-step planning pass.

## Completed in this pass
- Archived the old Markdown set before rewriting the active docs.
- Moved retired root docs into `/archive/retired-markdown/`.
- Archived the previous current-pass SQL and reset `database_upgrade_current_pass.sql`.
- Removed duplicate API copies outside `/functions/api/`.
- Removed duplicate nested data and duplicate public supply/movie data copies.
- Kept active JSON fallbacks only where the current app still reads them.
- Fixed a malformed admin Movies footer.
- Fixed supplies duplicate-report health paths.

## Next logical 20 steps
1. Build a D1 migration ledger/admin runner that records which SQL files have been applied and blocks double-running destructive changes.
2. Add a database sanity dashboard that checks required tables, indexes, column names, and seed rows before admin pages load.
3. Finish statement-import provider profiles for bank, PayPal, Stripe, Square, Etsy, and manual CSV formats with saved mapping rules.
4. Add reconciliation matching confidence scores with clear exact, likely, partial, duplicate, and manual-review buckets.
5. Build a reconciliation exception queue with assign, note, resolve, reopen, and export controls.
6. Add payment application screens that connect orders, deposits, refunds, fees, gift cards, processor payouts, and journal entries.
7. Expand automatic journal-line generation for sales, discounts, shipping, COGS, inventory adjustments, fees, refunds, write-offs, and taxes.
8. Add posting validation that refuses unbalanced entries and shows the exact missing debit/credit difference.
9. Finish period close controls: checklist, lock, reopen reason, audit trail, and admin-only unlock.
10. Add sales-tax/HST worksheet screens that compare collected tax, refunded tax, taxable sales, exempt sales, and remittance-ready totals.
11. Build accountant export package v2 with GL, trial balance, P&L, balance sheet support, statement import summary, tax worksheet, attachments index, and unresolved issues.
12. Move active creations/products from JSON-first fallback into D1 as the primary catalog while keeping JSON as emergency fallback/export.
13. Add product variants/options tables for size, colour, material, custom request status, SKU, stock, price, and media per variant.
14. Add media asset lifecycle controls: upload, crop/alt review, public/private flag, replace image, retire unused image, and broken-link scan.
15. Add admin-managed homepage/gallery/featured blocks so public marketing content no longer depends on hand-edited JSON.
16. Add local SEO landing pages for high-intent searches: handmade jewelry, polymer clay earrings, custom gifts, laser engraving, vintage finds, and workshop-made gifts in Southern Ontario.
17. Add structured data review for Organization, WebSite, Product, BreadcrumbList, and local business-style contact details where appropriate.
18. Add mobile-first admin quick actions: create draft product, add photos, adjust stock, record expense, scan receipt, and add customer note.
19. Add a runtime incident inbox with grouped errors, affected page/API, first/last seen, count, status, and resolution notes.
20. Add a release checklist page that runs H1 checks, missing script checks, broken data-source checks, schema drift checks, and SEO title/meta checks before each ZIP handoff.

## Working order recommendation
Start with steps 1, 2, 4, 6, 8, and 19 first. Those make the backend safer and easier to trust. Then move into period close, tax review, accountant export, and catalog/media D1 migration.


## Amazon Purchase Import Workflow — Added 2026-05-11

A review-first Amazon purchase import package was added under:

`PRIVATE IMPORT PACKAGE: amazon_inventory_import_package.zip`

Next logical implementation steps:
1. Build an admin Import Review screen for `amazon_purchase_import_staging`.
2. Add approve/hold/reject controls for each Amazon purchase row.
3. Add an inventory match picker so medium-confidence rows can be manually attached to tools/supplies.
4. Add an “apply approved imports” function that updates ASIN/cost/date references only after review.
5. Add accounting posting rules for approved purchases by category.
6. Add receipt/document attachment support for each order line.
7. Add duplicate detection by `amazon_order_id + asin + item_net_total_cents`.
8. Add inventory-cost history instead of overwriting the latest inventory item record.


## Private Import Data Safety Note — 2026-05-11

Amazon transaction CSVs and review spreadsheets are **not** stored inside the deployable website tree because `/data/` assets may become publicly reachable after Cloudflare Pages deployment. Keep the generated Amazon import package private and load approved rows into the database through an admin/import workflow instead.
