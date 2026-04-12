# New Chat Status

## Current handoff summary

This handoff is updated for the latest repo pass. The build focus remained admin resilience, mobile follow-up visibility, schema/doc sync, and reducing duplicate truth risks where the repo could safely move forward in one pass.

## Most important current truths
- `data/movies/movie_catalog_enriched.v2.json` remains the active movie base truth.
- `functions/api/admin/catalog-sync.js` now points movie sync work at the v2 JSON source instead of the older enriched file.
- `movie_catalog` in D1 is still a manual/admin overlay layer, not the primary movie truth.
- The public movie tab and admin movie list/editor must continue to load from the JSON-first movie source, then merge any D1 overlay rows on top.
- The admin movie editor must continue to show fuller JSON-backed details, not just image and UPC.
- `database_schema.sql`, `database_store_schema.sql`, and `database_upgrade_current_pass.sql` were brought forward so the schema references better match the current code paths.
- Public exposed pages were checked again and still keep the one-H1-per-page rule intact.

## What just happened
- Earlier movie admin saves could fail on older databases with: `D1_ERROR: table movie_catalog has no column named imdb_id`.
- This pass reduced that drift by aligning the repo schema references and upgrade SQL with the richer movie fields the admin editor expects.
- Catalog-sync movie imports were moved to the same v2 JSON source already preferred by the public/admin movie flows.
- The movies page received another small SEO wording pass around DVD/Blu-ray collection terms.

## Current requested direction
1. Keep movies JSON-first using `movie_catalog_enriched.v2.json`.
2. Keep admin movie editing stable and visually complete.
3. Keep D1 movie writes backward-compatible with older table shapes.
4. Continue moving Known Gaps forward only where it is honest and safe to do so.
5. Keep all Markdown and schema-reference files in sync each pass.

## Movie fields the user expects to see/edit
At minimum, the admin movie workflow should expose and allow edits for:
- UPC
- title
- original title
- summary
- release year
- media format
- genre
- director names
- actor names
- studio name
- runtime minutes
- trailer URL
- front image URL
- back image URL
- status
- featured rank
- IMDb id
- alternate identifier
- metadata source
- metadata status
- estimated value low/high cents
- estimated value currency
- rarity notes
- collection notes
- value search URL

## Product intake expectations
- Mobile product entry must support partial drafts before later mandatory fields are enforced.
- The repo should include and maintain a detailed finished-products CSV import template for bulk additions.

## Known honest remaining gaps
- Trusted movie enrichment still depends on the external/local enrichment pipeline and cannot be truthfully marked fully complete inside the site repo alone.
- Broader permission granularity and deeper security segmentation remain future security-pass work, not something already solved.
- Some legacy admin/read paths may still need more API-first authority cleanup.

## Recommended next actions in a new chat
- Verify `functions/api/admin/movies.js` in a live environment against an older D1 database and confirm the auto-add column path covers every missing movie field.
- Continue the Known Gaps list from the remaining repo-safe items.
- Keep docs aligned with the JSON-first movie truth and overlay-only D1 strategy.
- Continue reducing duplicate truth paths between JSON, D1, and admin screens where the repo can do so honestly.


## Current pass addendum
- Marked the previous admin preview, products fallback, movie save, and accordion issues as completed/fixed in the documentation.
- Departmentalized Admin into standalone interfaces: Members, Catalog, Orders, Accounting, Analytics, Operations, and Movies, reducing the size and risk of the main dashboard file.
- Added real starter routes/UI for tier policy, general ledger accounts, expenses, write-offs, product unit costs, and monthly accounting CSV export.
- Added accounting templates (CSV + XLSX) so GL and month-end bookkeeping can be seeded faster.
- Continued mobile direction by making the lighter departmental pages easier to use on smaller screens than the former all-in-one Admin page.
- Continued JSON-to-DB convergence by moving tier policy and accounting records into D1-backed tables instead of temporary page-only assumptions.


## Current pass addendum
- Fixed the Members department so Access Tiers render as a visible standalone interface instead of only a hidden modal dependency.
- Rewired Tier Policy admin/member JSON contracts so the admin editor and member account views use the same DB-backed field names.
- Strengthened the Accounting department with visible starter forms plus month-end, quarter-end, and year-end CSV export presets.
- Added a new phone-first Admin Dashboard at `/admin/mobile/` with Today, Quick Add, receiving, and export-oriented shortcuts.
- Continued moving the admin shell toward dashboard-style department buttons instead of long scroll-heavy interfaces.


## Current pass status
- Departmental admin pages remain the active direction and the lighter launcher dashboard is still the preferred shell over a single long admin page.
- Accounting now has clearer quick-action launch points and export preset entry points, especially for phone use.
- Mobile-first work should continue by moving more common daily actions onto the phone dashboard before broader stress testing.


## Current pass addendum
- Replaced the long phone Admin link list with a grouped tree-style mobile menu so the phone workflow uses collapsible sections instead of one uninterrupted list.
- Continued mobile-first workflow tuning by surfacing Today, quick expense, quick write-off, product cost, and export actions closer to the top of the phone dashboard.
- Continued docs/current-build synchronization for the present mobile-navigation and admin-usability pass.


## Current pass addendum
- Customer-facing home/shop flow was made friendlier and clearer on phone and desktop with stronger exploration sections and clearer action cards.
- Accounting moved forward with monthly overhead allocations and a rough net-after-overhead view in the accounting report so operating costs can start flowing toward fuller P&L reporting.
- Mobile admin moved forward again with a direct overhead-allocation shortcut from the phone dashboard.
- Schema and template files were updated for the new overhead allocation layer.


## Current pass update
- Fixed the missing phone-draft continuation gap by adding a draft picker to the mobile product capture screen and update-in-place draft saves.
- Added an estimated item-costing accounting view so rough full unit cost can include direct costs, linked resources, and allocated overhead.
- Mobile admin quick links now expose item-costing review directly from the phone dashboard.

## Current pass update
- Fixed a real accounting-schema mismatch in the reporting layer: the rough P&L now reads the live `amount` / `tax_amount` accounting columns instead of non-existent cents columns.
- Fixed the estimated item-costing layer so it now joins product costs by `product_number` and uses real-dollar `cost_per_unit`, then blends that with linked-resource cost and allocated overhead.
- Mobile draft continuation is better because saved SEO rows reload with the draft and updated drafts stay open in-place after save.
- The phone dashboard now has a live month snapshot for rough revenue, overhead, costing warnings, and visible draft-product status.
- Public SEO copy was tuned again around Southern Ontario / Canada language and About/Contact now carry a stronger LocalBusiness-style structured-data graph.

## Honest remaining open items
- overhead allocation is still rough revenue-share logic, not true final per-item absorption accounting
- deeper accounting / P&L / double-entry still remains future work
- remaining mixed JSON/D1 cleanup and broader real-device stress testing still remain open

## 2026-04-10 deploy hotfix

- Fixed a Cloudflare Pages build blocker in the accounting CSV export helpers by replacing the regex-based CSV quoting check with a simpler string-contains check.
- This hotfix does not change the database shape. Schema files remain current for this pass because no SQL migration was required.

## Latest pass update
- Public gallery/creations pages now rely on `/api/creations` instead of keeping another direct JSON-read fallback in the page code.
- The public tools page now uses `/api/tools` as its page authority rather than reading `/data/toolshed/toolshed_items_master.json` directly.
- `/admin/mobile/` now shows open accounting-record count plus paid, outstanding, and tax-liability snapshot values for quicker phone-side review.
- `functions/api/admin/accounting-summary.js` now shares the same accounting schema helper as the rest of the accounting layer, which reduces future drift.
- Schema/upgrade SQL now includes extra `catalog_items` indexes to support centralized public catalog reads.

## Still open after this pass
- movies remain intentionally JSON-first with D1 overlay logic rather than full D1 authority
- social feed content still reads from JSON
- real phone/desktop stress testing is still needed
- deeper accounting remains rough and is not yet final double-entry

## Latest pass update
- `/api/social-feed` now fronts the public social hub so that page no longer reads `data/site/social-feed.json` directly in the browser.
- Shop, movies, socials, and the phone dashboard now keep last-good snapshot fallback data in the browser for safer public/admin continuity.
- `/api/admin/runtime-incidents` now exposes recent fallback/error records for admin review.
- `dashboard-summary` now tracks recent runtime-incident counts for quicker phone/admin health checks.

## Latest handoff note

This pass focused on admin order resiliency rather than new storefront features. The strongest shipped changes are: partial-fallback order APIs, cached admin order snapshots in the browser, and expanded phone dashboard health counts for order/payment incidents. The next strongest step is write-path hardening for refunds/disputes/payment-entry flows plus real device testing.


## Latest pass addendum
- Saved local fallback actions now exist for failed admin order writes in the browser, so operators can retry order-status, manual-payment, and refund/dispute actions without retyping.
- Server-side runtime incidents now cover these write paths more explicitly, and the mobile dashboard shows those warnings plus the local pending-action count.
- Composite payment/refund/dispute indexes were added to keep the new follow-up health queries responsive.

## Latest handoff note

This pass focused on moving failed admin write actions beyond one browser. A new `admin_pending_actions` table plus `/api/admin/pending-actions` endpoints now back a shared replay queue for order-status updates, manual payment entries, and refund/dispute actions. The order-detail screen now prefers the shared queue and only keeps browser-local fallback when the shared queue cannot be reached. The phone dashboard also shows shared queue health counts.

## Current pass handoff update
- Fixed the social hub YouTube thumbnail problem by deriving thumbnail fallbacks in `/api/social-feed` and rendering thumbnail cards in `public/js/social-hub.js`.
- Moved shared replay coverage beyond order detail by queueing failed product review actions from `public/js/admin-products.js` into `admin_pending_actions`, with retry/dismiss controls in the products screen.
- Switched `/api/admin/accounting-item-costing` over to the shared `_costing.js` engine, which now exposes basis-aware overhead pools plus rough recognized COGS metrics to the accounting UI.
- Added `idx_admin_pending_actions_scope_status` to all main schema files and the current-pass upgrade SQL.

## Current pass completion update
- Added `accounting_overhead_product_allocations` so monthly overhead can now be assigned directly to specific products by ledger code instead of relying only on pool-wide share logic.
- Added a rough journal foundation with `accounting_journal_entries` and `accounting_journal_lines`, plus `/api/admin/accounting-journal` to sync and review month-level double-entry style bookkeeping.
- Expanded shared replay coverage from order/payment and product review into product edit/update failures through the same `admin_pending_actions` queue, with browser-local storage kept only as the last safety net.
- Strengthened the public movies API merge logic so D1 overlay rows can match JSON rows by UPC, slug, or title/year instead of only one identifier path.
- Updated the phone dashboard and accounting overview to show journal health, explicit overhead overrides, and queued product-edit actions more honestly.

## Current pass note
- Catalog migration sync now accepts both `collections` and legacy `item_kinds` payloads for maintenance/reseed use after the completed full migration.
- Tool, supply, and featured creation syncs continue to upsert into `catalog_items`.
- Movie sync now upserts into `movie_catalog` so hybrid JSON + D1 movie authority can move forward without crashing `catalog_items`.
- The admin catalog sync tooling now remains maintenance-only. The main Catalog department page no longer shows the migration panel after the successful full sync run, but the backend route is still available for maintenance or reseed recovery.

## Current Pass Note — 2026-04-12

- Movie catalog sync was changed from one-row-at-a-time D1 writes to chunked `db.batch(...)` upserts so large movie imports stay under the Worker invocation API-request ceiling.
- `/api/admin/products` was hardened to detect optional table availability and fall back to a simpler products query instead of failing the full admin page with a 500 during staged migration.
- `_headers` now explicitly allows `https://static.cloudflareinsights.com` in `script-src` so the Cloudflare Insights beacon is no longer blocked by the current CSP.
- The initial catalog migration has now been run successfully for Tools, Supplies, Movies, and Featured Creations. The everyday admin catalog sync panel was retired from the main Catalog page, while `/api/admin/catalog-sync` remains available for maintenance or reseed work. Movies still remain hybrid on the public read path while D1 overlay parity continues.


- Current pass: the main Catalog admin page no longer shows the day-to-day migration panel after the full D1 catalog sync completed successfully. The sync route remains available only for maintenance or reseed recovery, and the docs now treat catalog migration as completed rather than an active daily admin step.
