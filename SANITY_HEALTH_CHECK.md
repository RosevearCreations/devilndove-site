# Sanity / Health Check

## Current build status

This build is in a better state for day-to-day browsing and admin use than the previous pass, but it is still not in the final security-complete or payments-complete state.

## What improved in this pass

- Movie cards now stay readable and inside the layout frame.
- Movie paging now reflects the full catalog instead of stopping the visible experience at the old default batch.
- Small-screen handling for the movie shelf is materially improved.
- Same-site admin media uploads are more reliable because auth-cookie fallback is now accepted.
- Key JSON endpoints now return safer baseline headers.
- Known gaps and risks are now documented in a much more actionable way.

## Still the biggest unfinished areas

- Stripe completion and refund/dispute safety
- webhook retry/replay hardening
- stronger media lifecycle completion
- deeper inventory movement and reorder depth
- richer analytics and funnel reporting
- trusted movie metadata enrichment

## Recommended next test cycle

1. Test the movie shelf on desktop and on phone-width layouts.
2. Verify paging across multiple movie pages and different page sizes.
3. Test admin media upload from same-site mobile/admin flows.
4. Confirm no layout overflow on dense cards and table-heavy admin screens.
5. Continue into Stripe/webhook hardening next.


## Current pass update

- Rebuilt the public movie shelf layout with a dedicated card and pager structure so movie entries no longer collapse into unusable one-character columns.
- The movies page now uses the API paging metadata to show the real total catalog size, page number, page range, and next/previous navigation more honestly.
- Added a more defensive movie-specific CSS layer so future generic card/grid changes are less likely to break the movie shelf again.
- KNOWN_GAPS_AND_RISKS.md was rewritten to document the remaining payment, inventory, media, analytics, and metadata risks more clearly.


## Current pass reliability/security improvements

- Admin audit trail added for key privileged changes.
- Account recovery request logging now stores IP and user-agent and applies light rate limiting.
- Stripe and PayPal webhook event records now track attempts more honestly during processing.

## Current pass health update

- Payment/admin risk was reduced with provider refund sync attempts plus queued receipt records.
- Inventory authority moved forward with stronger action-specific mutations and movement logging.
- Media lifecycle moved forward with restore/replace metadata support.
- Analytics moved forward with better funnel metrics.
- Draft-to-publish workflow now has readiness signals.
- The largest remaining unresolved areas are true outbound receipts, full Stripe completion, deeper provider-confirmed dispute sync, final D1 authority cleanup, and trusted movie metadata enrichment.



## Current pass health update
- Stripe confirmation is materially safer because the customer return path now finalizes the Checkout Session locally.
- Stripe dispute records are now provider-confirmed through webhook upserts instead of staying manual-only.
- Notification outbox entries can now be dispatched through a real email-delivery path when mail credentials are configured.
- Destructive admin actions now require password confirmation.
- Public creations now use a centralized API path instead of another page-level direct JSON dependency.
- The biggest remaining unresolved area is trusted movie enrichment, because that depends on external metadata access rather than an unfinished local endpoint.

## Current pass health update
- Stripe return reconciliation remains in place.
- Notification outbox dispatch remains in place.
- Draft-to-publish governance moved forward with explicit review/publish actions and durable review logs.
- Inventory authority moved forward with supplier purchase-order drafts and grouped reorder suggestions.
- Product margin visibility moved forward with linked-resource cost rollups.
- Analytics moved forward with referrer, entry-path, and zero-result search diagnostics.

## Remaining honest gaps
- worker-grade automated webhook replay/dispatch is still not fully autonomous yet
- permission granularity still needs deeper role segmentation
- trusted movie enrichment still depends on external accepted data access



## Current pass update
- Public read-path duplication was reduced again by adding centralized `/api/tools` and `/api/supplies` endpoints and using API-first reads for gallery/creations migration paths.
- Supplier purchase-order workflow now updates inventory more honestly when orders are marked ordered or received.

- Product-level resource reservation actions are now present in admin inventory workflows.
- Mobile quick-product bootstrap has been hardened against false unauthorized/bootstrap failures.
- Media asset admin patching now supports batch sort/variant updates and no longer references an undefined confirmation variable.


## Current pass health update
- Customer receipt delivery is more real than before because refund/dispute actions now attempt immediate queued-email dispatch instead of only storing queue rows.
- Stripe provider-confirmed refund/dispute customer notices now have a direct queue-and-dispatch path when customer email and mail credentials are present.
- Public product discovery moved forward with live category/colour/type summaries from `/api/products`.
- Public tools and supplies moved one step closer to single read authority by using their dedicated APIs on the outward-facing pages.

## Remaining honest gaps
- non-Stripe provider-confirmed dispute automation is still not complete
- broader role/permission segmentation is still a future security pass
- trusted movie enrichment still depends on external accepted metadata access

## Current pass update
- Bulk import quality improved: preview now catches duplicate slugs/SKUs/product numbers plus newer field-validation issues before insert.
- Bulk import completeness improved: imports can now seed richer finished-product metadata, tags, SEO rows, and additional product-image rows.
- Media upload lifecycle improved: direct R2 uploads can now attach to product galleries and optionally set the featured image in the same step.



## Current pass sanity update
- Product stock report now supports frontend reserve/release actions for linked resources.
- Storefront product detail now returns grouped image structures plus variant-role hints.
- Media asset reads expose derived variant URL suggestions for later image-processing rollout.
- Visitor analytics expose top product paths and top ordered products.
- Public supplies discovery and tools health now use centralized API reads more consistently.


## Current pass update
- Admin products screen now includes reserve/release controls for linked resources.
- Toolshed page now reads through `/api/tools` instead of direct JSON fallback chaining.
- Product detail payload now includes `build_summary` and image `variant_urls` hints.


## Current pass check
- Mobile product capture now supports partial draft saves and no longer requires every storefront field before intake can continue.
- Admin movie-catalog editing is now available for manual metadata cleanup while the movie-enrichment pipeline is still being processed offline.
- Bulk finished-product CSV seeding now has a detailed template file in `data/finished_products_import_template.csv`.


## Current pass health update
- Movie truth is still JSON-first. This is intentional and safer while the enrichment pipeline is still being processed outside the site build.
- Manual movie editing is now expected to work through a D1 overlay, but the route still needs schema-hardening against older `movie_catalog` tables missing late-added columns such as `imdb_id`, metadata source, and value fields.
- The admin movie editor should be considered incomplete unless it visibly shows both cover images and the richer JSON-backed fields already present in the live movie records.
- Partial mobile finished-product draft capture remains a required workflow and should not be blocked by later publish-time required fields.


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


## Current pass checks
- Public exposed pages were checked again for the one-H1 rule.
- Admin/department/mobile layouts received another CSS pass to reduce action-row drift and long-scroll friction.
- Accounting quick links and export preset anchors were aligned with the dedicated accounting department screen.


## Current pass addendum
- Replaced the long phone Admin link list with a grouped tree-style mobile menu so the phone workflow uses collapsible sections instead of one uninterrupted list.
- Continued mobile-first workflow tuning by surfacing Today, quick expense, quick write-off, product cost, and export actions closer to the top of the phone dashboard.
- Continued docs/current-build synchronization for the present mobile-navigation and admin-usability pass.


## Current pass addendum
- Customer-facing home/shop flow was made friendlier and clearer on phone and desktop with stronger exploration sections and clearer action cards.
- Accounting moved forward with monthly overhead allocations and a rough net-after-overhead view in the accounting report so operating costs can start flowing toward fuller P&L reporting.
- Mobile admin moved forward again with a direct overhead-allocation shortcut from the phone dashboard.
- Schema and template files were updated for the new overhead allocation layer.


## Current pass note
- Mobile product capture now supports reopening and continuing saved drafts in the same screen.
- Accounting overview now includes estimated item costing using available cost and overhead data.
- No new schema table was required in this pass; reporting and workflow layers were advanced on the existing schema.

## Current pass addendum
- Rough P&L/reporting drift was reduced by realigning accounting summary code to the live expense/write-off table shapes.
- Estimated item costing was realigned to the current `product_costs` table shape so the cost view is less likely to silently under-report or fail.
- Mobile product draft continuation was checked again and now restores saved SEO data from `product_seo` when reopening drafts.
- Public exposed pages still keep the one-H1-per-page rule after this pass.

## 2026-04-10 deploy hotfix

- Fixed a Cloudflare Pages build blocker in the accounting CSV export helpers by replacing the regex-based CSV quoting check with a simpler string-contains check.
- This hotfix does not change the database shape. Schema files remain current for this pass because no SQL migration was required.

## Current pass verification focus

- Verify `/admin/mobile/` renders the added accounting snapshot cards correctly on phone width and desktop width.
- Verify `/tools/`, `/gallery/`, and `/creations/` still load from their centralized APIs after deployment.
- Confirm the new `catalog_items` indexes are present after running `database_upgrade_current_pass.sql` in environments that use the public catalog APIs heavily.

## Current pass sanity note
- Check `/api/social-feed` when the social hub looks blank before assuming the public JSON file is wrong.
- Check `/api/admin/runtime-incidents` when fallback warnings appear on shop, movies, socials, or the phone dashboard.
- Remember that the shop, movie shelf, social hub, and phone dashboard can now intentionally show cached last-good data during live endpoint trouble.

## Current pass checks

- changed admin order JS files parsed successfully
- changed admin order/payment Pages Functions parsed successfully
- phone dashboard health block now expects order/payment incident counts from `/api/admin/dashboard-summary`
- public one-H1 rule still needs to remain part of the normal sweep each pass


## Current pass reliability update
- Admin order write paths are safer because failed status/payment/refund/dispute actions no longer have to disappear immediately; they can be saved locally for retry in the same browser.
- Server-side runtime incidents now cover these write paths more explicitly, which gives the phone dashboard a more honest health readout.
- Composite payment/refund/dispute indexes were added to support the growing health/follow-up queries.

## Remaining honest gaps
- saved local fallback actions are still browser-local rather than a fully durable shared operations queue
- deeper accounting completion and final overhead rules remain open
- real phone and desktop stress testing still needs a fuller pass

## Latest pass update

- Check that `/api/admin/pending-actions` and `/api/admin/pending-actions-status` respond for an authenticated admin session.
- Confirm failed admin order writes appear in the shared queue, can be replayed from the order-detail screen, and update queue status afterward.
- Confirm the phone dashboard shows shared queue counts alongside local browser-only fallback counts.

## Current pass checks to remember
- If the social hub shows blank YouTube cards, check `/api/social-feed` for `thumbnail_url` and `thumbnail_candidates` before assuming the page script is broken.
- If product review actions fail to persist, check `admin_pending_actions` for `action_scope = 'product_review'` and check runtime incidents for `admin_product_review_actions`.
- If costing looks too flat, confirm `/api/admin/accounting-item-costing` is returning `overhead_pools`, `sold_quantity_in_period`, and `estimated_recognized_full_cogs_cents`.

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
