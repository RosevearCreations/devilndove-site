# Development Roadmap — Current Working Plan

Current sync: 2026-05-14 — Build 125 Amazon purchase review, inventory cost history, reconciliation queue, journal validation, and local SEO pass.

## Completed 20 items in this pass
1. Added `/api/admin/amazon-purchase-review` so private Amazon purchase staging rows can be reviewed from the admin instead of spreadsheets only.
2. Added the Amazon purchase review queue UI to `/admin/catalog/` with search, status filters, approve/apply, hold, and reject controls.
3. Added approved Amazon purchase application that updates linked inventory unit cost, supplier name, ASIN/supplier SKU, Amazon URL, and notes.
4. Added `site_item_inventory_cost_history` so Amazon-approved costs and manual cost changes create history rows instead of silently overwriting the latest cost.
5. Added inventory cost-history recording during Tools/Supplies catalog sync when a synced unit cost changes.
6. Added cost-history recording for manual site-item inventory create/update and bulk cost update workflows.
7. Improved the Tools/Supplies inventory sync result panel so inserted, updated, failed, Amazon URL, unit-cost, stock-default, match-status, and cost-history counts are visible after sync.
8. Hardened Amazon purchase review schema creation with runtime-safe staging-table migrations for applied inventory, applied cost-history, review user, and applied timestamp fields.
9. Hardened Amazon purchase review inventory access with runtime-safe inventory column backfills for older D1 tables.
10. Added audit entries for Amazon purchase review decisions so approve/hold/reject actions are traceable.
11. Expanded reconciliation exceptions with assign-to-user, accountant review flag, resolve, reopen, and richer status handling.
12. Added reconciliation exception queue controls in the Accounting import UI for assign, manual review, accountant review, resolve, reopen, ignore, and notes.
13. Added journal-period validation that checks monthly debit/credit balance before posting.
14. Added journal posting metadata and posting guardrails so unbalanced monthly journals are blocked before being marked posted.
15. Added Accounting report buttons for validating and posting the selected month’s journal entries.
16. Added six local-intent SEO landing pages for handmade jewelry, polymer clay earrings, custom gifts, laser engraving projects, vintage finds, and workshop-made gifts in Ontario/Southern Ontario.
17. Added `sitemap.xml` so the new public local-intent pages and existing public pages have a clean crawl map.
18. Added shared-footer local search links so the new local-intent pages are internally linked from public pages.
19. Added CSS for local-intent cards, related-page links, and mobile-friendly local page calls to action.
20. Updated active schema files and Markdown files, then ran syntax/H1/meta/link sanity checks for the new build.

## Next logical 20 steps
1. Deploy Build 125 and apply `database_upgrade_current_pass.sql` in Cloudflare D1.
2. Open `/admin/operations/`, run Release Sanity, and mark the Build 125 migration ledger entry applied once D1 is confirmed.
3. Open `/admin/catalog/`, run Sync all tools + supplies, and confirm inventory counts plus cost-history counts.
4. Use the Amazon purchase review queue to approve a small batch of obvious safe matches first, then verify cost history and unit-cost display.
5. Add a CSV import endpoint/screen for Amazon staging rows so future Amazon order files can be loaded through admin without manual SQL.
6. Add fuzzy review helpers in the Amazon queue: suggested inventory links, confidence explanation, and “needs human review” grouping.
7. Add an accountant-facing reconciliation export of unresolved exceptions, assigned users, notes, and attached statement references.
8. Finish payment application screens connecting orders, deposits, gift cards, refunds, fees, processor payouts, and journal entries.
9. Expand automatic journal-line generation for sales, discounts, shipping income, shipping expense, COGS, inventory adjustments, fees, refunds, write-offs, and HST.
10. Add period-close lock/reopen controls with close checklist, lock reason, reopen reason, and audit trail.
11. Build the HST review worksheet with taxable sales, exempt sales, collected HST, refunded HST, input credits, adjustments, and remittance-ready totals.
12. Build accountant export package v2 with GL, trial balance, P&L, balance sheet support, HST worksheet, statement import summary, attachments index, and unresolved issue log.
13. Move product/creation management from JSON-first fallback into D1 as the primary source, keeping JSON as export/fallback only.
14. Add product variant tables and UI for colour, size, material, customization status, SKU, stock, price, and media per variant.
15. Add admin-managed public content blocks for Home, Gallery, Shop, About, Featured Creations, and local-intent sections.
16. Add media lifecycle controls for upload, crop, alt text, public/private flag, replacement, retirement, and broken-link scans.
17. Add structured data review for Product, BreadcrumbList, Organization, WebSite, and local contact details on public pages.
18. Add Search Console metric fields/screens for clicks, impressions, CTR, position, page, query, and local-intent landing page performance.
19. Add mobile admin quick actions: draft product, add photos, adjust stock, record expense, scan receipt, add customer note, and review Amazon match.
20. Add a pre-deploy checklist that combines Release Sanity, SQL ledger status, JS syntax check, public-page SEO check, CSS/link check, and privacy/public-data checks.

## Working order recommendation
Do steps 1-6 first because they confirm the new Amazon/private-cost workflow without risking broad inventory changes. Then complete payment application, journal automation, close controls, HST review, and accountant export. After the backend is steadier, continue moving public catalog and media from JSON-first workflows into D1-managed admin screens.

## SEO habit for every pass
Keep one clear H1 per exposed page, keep page titles/meta descriptions specific, and keep local/product/service wording visible in page headings and body copy. Public pages should support real search intent without keyword stuffing.

## Build 126 completed hotfix items

1. Added visible Security / Runtime Incidents panel to Operations.
2. Added grouped runtime incident results by severity, scope, code, and endpoint.
3. Added filters for incident age, severity, review status, and result count.
4. Added selected-row review actions for reviewing, resolved, ignored, and reopened.
5. Added admin notes on incident review actions.
6. Added runtime incident review fields to schema references.
7. Added runtime-safe PRAGMA-based backfills for older D1 tables.
8. Added runtime incident grouping indexes after columns are confirmed.
9. Updated Release Sanity to count only unresolved/unignored error or critical incidents.
10. Added the Operations page script and mount point for the new review panel.
11. Kept the runtime incident API guarded by admin authentication.
12. Added admin audit records for runtime incident review status changes.
13. Preserved no-store cache headers for incident review results.
14. Added JSON detail expansion in the admin incident table.
15. Added grouped view so repeated endpoint failures can be fixed before one-off noise.
16. Documented the D1 SQL query to identify the current 7 incidents.
17. Kept fallback behavior intact; this is visibility/review hardening, not a public-page change.
18. Updated schema docs to reflect review status columns.
19. Updated the sanity handoff docs with the runtime incident triage flow.
20. Packaged Build 126 as a hotfix focused on the sanity warning.

## Next 20 steps after Build 126

1. Use the new Runtime Incidents panel to group the 7 current error/critical rows.
2. Fix the highest-count grouped endpoint first.
3. Resolve or ignore incidents only after confirming the repeated cause is fixed or no longer relevant.
4. Add a retention/cleanup action for old resolved runtime incidents.
5. Add a CSV export for grouped incidents for accountant/developer review.
6. Add a direct deep link from Release Sanity rows to the matching admin panel.
7. Add incident badges to the main Admin dashboard summary.
8. Add a small "last deploy build" setting so incidents can be grouped by build number.
9. Add client-side source maps or file hints for admin JS errors where practical.
10. Add release sanity checks for stale service-worker/browser-cache issues if a PWA layer is later added.
11. Continue Amazon staging import UX for uploading CSV rows directly from admin.
12. Continue payment application workflows.
13. Continue fuller journal-line automation and posting validation.
14. Continue HST/GST filing review worksheets.
15. Continue period close/lock/reopen controls.
16. Continue accountant export packaging.
17. Continue item-level inventory costing and usage-unit review screens.
18. Continue local SEO page expansion with one clear H1 per public page.
19. Continue CSS drift checks on admin tables and mobile panels.
20. Continue migration of duplicated JSON/DB data toward a single source of truth with public-safe JSON fallbacks only.
