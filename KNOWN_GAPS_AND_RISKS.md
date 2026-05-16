# Known Gaps and Risks — Current Active List

Current sync: 2026-05-15 — Build 130.

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

## Build 126 runtime warning follow-up

- The Release Sanity warning for recent runtime errors is now actionable from `/admin/operations/` through the new Security / Runtime Incidents panel.
- The warning should not be treated as a deploy blocker by itself; it means unresolved `error` or `critical` incidents were logged in the last 7 days.
- Main risk: if the same scope/code/endpoint group repeats, the underlying API or schema drift still needs a code or D1 fix.
- Resolved or ignored rows are excluded from the warning, so do not mark rows closed until the recurring cause has been reviewed.


## Build 127 runtime incident follow-up

- The `/api/products` runtime incident group was caused by schema drift assumptions in the public products endpoint.
- A key example is `COALESCE(tc.rate_percent, tc.tax_rate, 0)`: D1/SQLite still fails when `tc.rate_percent` does not exist, even if `tc.tax_rate` does.
- Build 127 reduces this risk by inspecting table columns before building SQL and by using a schema-adaptive product-only fallback.
- Remaining risk: if the live `products` table itself is missing or unreadable, `/api/products` will still return a safe empty result and log an incident.
- After deployment, old `/api/products` incident rows should be marked resolved only after fresh requests stop creating new rows.

## Build 128 products API follow-up

- Build 127 still allowed `p.merchandise_origin` to leak into a live `/api/products` query on the deployed D1 schema.
- Build 128 treats `PRAGMA table_info` as helpful but not authoritative; optional columns are now verified with a direct `SELECT column FROM table LIMIT 0` test before being referenced.
- The public product list fallback now avoids all newer optional storefront fields and supplies safe defaults instead.
- `/api/product-detail` was also hardened because product detail used several of the same newer product, tax, and SEO columns.
- Remaining risk: if the live `products` table lacks required basics like `slug`, `product_id`, or `name`, public product results may still be empty or product detail may return a schema-unavailable response.
- Long-term fix: apply/verify the full product schema migration so merchandise origin, sale channel, external listing fields, condition/era/sourcing notes, and current tax fields exist in D1.


## Build 129 reduced risks

- Added a visible D1 Schema Drift Report so missing live D1 columns can be found before public APIs fail.
- Added Public API Health checks for shop/product/catalog endpoints after deployment.
- Release Sanity now includes a product schema drift snapshot and `/api/products` health check.
- Runtime incidents can now be cleaned up only after they are resolved/ignored and old enough to be safe to remove.
- Amazon CSV rows can now be imported into private D1 staging from admin rather than placing private import files in public static folders.
- Amazon review rows now explain match confidence using status, score, ASIN presence, inventory link, and available unit cost.

## Build 129 remaining risks

- The Amazon CSV import is intentionally simple and review-first; it still needs duplicate detection before large imports.
- Amazon staging import does not automatically match new rows to inventory yet unless the CSV already includes inventory keys.
- Public API Health depends on the deployed host being reachable from the Worker runtime; if fetch self is blocked/noisy, use direct browser checks too.
- Schema Drift Report lists missing columns but does not run migrations automatically.
- Runtime incident cleanup permanently deletes old resolved/ignored records, so export important history first if needed.

## Build 130 products API risk update

- The `/api/products` incident count increased again after the prior compatibility patch, which proved the endpoint still had a path that could reference optional product columns or log incidents before a successful lower-tier fallback.
- Build 130 removes candidate optional columns from the verified SQL column set and adds a final `SELECT *` fallback that filters in JavaScript. This is intentionally less fancy but much harder for schema drift to break.
- The only time `/api/products` should now log a new error incident is when every product query tier fails, including `SELECT * FROM products`.
- If the endpoint returns `summary.authority: "d1_select_star_fallback"`, the storefront is protected, but D1 schema cleanup is still recommended.
- Old `/api/products` incidents should remain open until a fresh deploy is verified, then they can be marked resolved.

## Build 131 known gaps and risk updates

- Storefront Schema Repair can add safe missing columns, but it does not replace the need for a reviewed full D1 migration history. Use it as a compatibility repair, then record/confirm the migration ledger.
- `/api/products` should no longer be allowed to sit at `authority: "error"`. If the endpoint falls back to `d1_select_star_fallback`, the public storefront is protected but schema cleanup is still recommended.
- Product rows may still need value backfills after columns are added: `merchandise_origin`, `sale_channel`, `currency`, `requires_shipping`, `status`, and image fields should be reviewed before relying on filters.
- The new local predeploy sanity script catches obvious public data leaks, but private Amazon order/cost files still must not be placed under `/data/` or other public static folders.
- Public API Health now checks more endpoints, but it cannot validate real buyer checkout success; payment/provider tests remain a separate workflow.
- Next risk to reduce: product schema value backfill and product structured-data checks so richer shop filters and SEO can move from fallback-safe to fully intentional.

## Build 132 known gaps and risk updates

- The mobile main menu is now grouped and expandable, but it still needs a real-phone pass after deployment because mobile browser address bars and font scaling can affect drawer height.
- If an old cached `/js/main.js` or `/css/styles.css` remains in the browser, the menu may still look like the older long list. Hard refresh or clear site cache before judging the deployed result.
- The mobile drawer is a code/CSS fix only. No D1 schema change is required, but the Build 132 marker should still be recorded so the release ledger remains complete.
- Admin department shortcut buttons now scroll horizontally on small screens; future work should add a dedicated admin mobile command palette if the admin page count keeps growing.
- The next major risk is still D1/product schema drift and accounting workflow completeness, not the menu itself.
