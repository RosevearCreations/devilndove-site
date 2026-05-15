# Known Gaps and Risks — Current Active List

Current sync: 2026-05-14 — Build 125.

## Highest-priority gaps still open
1. The accounting backend is stronger, but it is still not a finished tax-filing system.
2. `database_upgrade_current_pass.sql` still needs to be applied in Cloudflare D1 after deployment and recorded in the migration ledger.
3. Amazon purchase review exists, but only obvious/safe rows should be approved first until more real-world review confidence is built.
4. Amazon CSV loading still needs a proper admin import screen; current staging assumes rows are already loaded into `amazon_purchase_import_staging`.
5. Cost history now exists, but inventory valuation reports still need beginning balance, additions, usage, write-offs, and ending balance logic.
6. Reconciliation exceptions now have queue statuses, but need export, attachment links, and stronger accountant review reporting.
7. Payment application screens still need to connect orders, deposits, payouts, refunds, fees, gift cards, and journals.
8. Journal validation/posting exists for monthly balance checks, but full auto-generation and close controls remain open.
9. HST/sales-tax review screens still need final worksheet/export behaviour before accountant handoff.
10. Accountant export still needs one packaged export with ledgers, statements, taxes, attachments, and unresolved notes.
11. Some catalog/product areas still use JSON as a bridge while D1 becomes the long-term source of truth.
12. Product variants/options are not complete enough for a full ecommerce app.
13. Media management still needs retire/replace/broken-link lifecycle controls.
14. Local SEO pages have been added, but they need real photos, product links, internal links from relevant pages, and performance monitoring.
15. Fuzzy Amazon matching can still be wrong when product titles are generic.

## Current guardrails
- Keep one H1 per exposed HTML page.
- Update Markdown and schema files on every code pass.
- Prefer D1 for authoritative operational data.
- Keep JSON only as fallback, seed, export, or static catalog bridge until migrated.
- Store money in cents in D1, but display dollars in admin forms.
- Treat current owned tools/supplies as at least 1 stock unit unless manually retired.
- Use package math for consumables: for example, 1 package can equal 100 sheets.
- Keep Amazon order details, costs, and review spreadsheets private; do not deploy raw order reports under public `/data/` paths.
- Review Amazon matches before applying costs; do not mass-approve weak or generic title matches.
- Run Release Sanity and D1 count checks after every deployment.

## Recently reduced risks
- Added `/api/admin/amazon-purchase-review` so private Amazon purchase staging rows can be reviewed from the admin instead of spreadsheets only.
- Added the Amazon purchase review queue UI to `/admin/catalog/` with search, status filters, approve/apply, hold, and reject controls.
- Added approved Amazon purchase application that updates linked inventory unit cost, supplier name, ASIN/supplier SKU, Amazon URL, and notes.
- Added `site_item_inventory_cost_history` so Amazon-approved costs and manual cost changes create history rows instead of silently overwriting the latest cost.
- Added inventory cost-history recording during Tools/Supplies catalog sync when a synced unit cost changes.
- Added cost-history recording for manual site-item inventory create/update and bulk cost update workflows.
- Improved the Tools/Supplies inventory sync result panel so inserted, updated, failed, Amazon URL, unit-cost, stock-default, match-status, and cost-history counts are visible after sync.
- Hardened Amazon purchase review schema creation with runtime-safe staging-table migrations for applied inventory, applied cost-history, review user, and applied timestamp fields.
- Hardened Amazon purchase review inventory access with runtime-safe inventory column backfills for older D1 tables.
- Added audit entries for Amazon purchase review decisions so approve/hold/reject actions are traceable.
- Expanded reconciliation exceptions with assign-to-user, accountant review flag, resolve, reopen, and richer status handling.
- Added reconciliation exception queue controls in the Accounting import UI for assign, manual review, accountant review, resolve, reopen, ignore, and notes.
- Added journal-period validation that checks monthly debit/credit balance before posting.
- Added journal posting metadata and posting guardrails so unbalanced monthly journals are blocked before being marked posted.
- Added Accounting report buttons for validating and posting the selected month’s journal entries.
- Added six local-intent SEO landing pages for handmade jewelry, polymer clay earrings, custom gifts, laser engraving projects, vintage finds, and workshop-made gifts in Ontario/Southern Ontario.
- Added `sitemap.xml` so the new public local-intent pages and existing public pages have a clean crawl map.
- Added shared-footer local search links so the new local-intent pages are internally linked from public pages.
- Added CSS for local-intent cards, related-page links, and mobile-friendly local page calls to action.
- Updated active schema files and Markdown files, then ran syntax/H1/meta/link sanity checks for the new build.
