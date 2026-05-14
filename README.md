# Devil n Dove Site — Current Clean Build

Current sync: 2026-05-10 cleanup and refoundation pass.

## Active purpose
This repository powers the Devil n Dove public storefront, admin app, member area, catalog tools, accounting workflow, and Cloudflare Pages Functions backend.

## Current active structure
- `/functions/api/` is the active Cloudflare Pages Functions API surface.
- `/public/js/` holds browser-side admin/member/storefront scripts.
- `/admin/*/index.html` holds admin department pages.
- `/data/` holds approved JSON fallbacks/import sources that have not yet fully moved to D1.
- `/database_schema.sql`, `/database_store_schema.sql`, and `/database_full_schema.sql` are the main schema references.
- `/database_upgrade_current_pass.sql` is now a clean staging file for the next migration batch.
- `/archive/` holds retired Markdown snapshots and the archived current-pass SQL from the previous build.

## Cleanup completed in this pass
- Archived all previous Markdown before rewriting the active docs.
- Archived the previous `database_upgrade_current_pass.sql` and reset the active file to a clean staging file.
- Retired older root-level Markdown into `/archive/retired-markdown/`.
- Removed duplicate/stale API files outside `/functions/api/`.
- Removed duplicate nested `/data/data/` exports.
- Removed duplicate movie JSON under `/assets/movies/`; active movie JSON stays under `/data/movies/`.
- Removed duplicate supply inventory files from `/supplies/`; active supply data stays under `/data/supplies/`.
- Fixed the supplies duplicate-report health page to point to the active duplicate report paths.
- Fixed malformed footer markup on the admin Movies department page.

## Important active docs
- `DEVELOPMENT_ROADMAP.md` — next 20 logical steps.
- `KNOWN_GAPS_AND_RISKS.md` — current gaps and risks.
- `SANITY_HEALTH_CHECK.md` — checks for each build.
- `DATABASE_SCHEMA_REFERENCE.md` — schema and migration notes.
- `REPO_BASE_GUIDE.md` — current repo map.
- `REPO_RULES.md` — rules for future passes.
- `LOCAL_SEO_PLAYBOOK.md` — search/local visibility guidance.
- `AI_CONTEXT.md` and `NEW_CHAT_STATUS.md` — handoff notes for a fresh chat.

## Removed from active build
- `_lib`
- `auth`
- `member`
- `track`
- `admin/_catalog-options.js`
- `admin/_costing.js`
- `admin/_product-numbering.js`
- `admin/access-tiers.js`
- `admin/accounting-expenses.js`
- `admin/accounting-item-costing.js`
- `admin/accounting-journal.js`
- `admin/accounting-monthly-summary-export.js`
- `admin/accounting-overhead-allocations.js`
- `admin/accounting-overhead-product-allocations.js`
- `admin/accounting-period-summary-export.js`
- `admin/accounting-profit-loss.js`
- `admin/accounting-summary.js`
- `admin/accounting-writeoffs.js`
- `admin/app-settings.js`
- `admin/archive-product.js`
- `admin/assign-user-access-tier.js`
- `admin/audit-log.js`
- `admin/bootstrap.js`
- `admin/bulk-update-products.js`
- `admin/bulk-update-site-inventory.js`
- `admin/catalog-option-sets.js`
- `admin/catalog-sync.js`
- `admin/cleanup-sessions.js`
- `admin/create-product.js`
- `admin/create-user.js`
- `admin/customer-engagement.js`
- `admin/dashboard-summary.js`
- `admin/delete-product.js`
- `admin/delete-user.js`
- `admin/general-ledger-accounts.js`
- `admin/import-products-preview.js`
- `admin/import-products.js`
- `admin/live-activity.js`
- `admin/media-assets.js`
- `admin/media-upload.js`
- `admin/migrate.js`
- `admin/mobile-create-product.js`
- `admin/mobile-product-drafts.js`
- `admin/movies.js`
- `admin/notification-outbox.js`
- `admin/notifications.js`
- `admin/order-detail.js`
- `admin/order-payments.js`
- `admin/orders.js`
- `admin/payment-actions.js`
- `admin/pending-actions-status.js`
- `admin/pending-actions.js`
- `admin/product-cost-rollups.js`
- `admin/product-costs.js`
- `admin/product-detail.js`
- `admin/product-image-annotations.js`
- `admin/product-images.js`
- `admin/product-mobile-bootstrap.js`
- `admin/product-price-suggestions.js`
- `admin/product-readiness.js`
- `admin/product-resources.js`
- `admin/product-review-actions.js`
- `admin/product-seo.js`
- `admin/product-stock-report.js`
- `admin/products.js`
- `admin/purchase-orders.js`
- `admin/record-payment.js`
- `admin/remove-user-access-tier.js`
- `admin/reset-password.js`
- `admin/runtime-incidents.js`
- `admin/security-summary.js`
- `admin/site-item-inventory.js`
- `admin/tax-classes.js`
- `admin/tier-policies.js`
- `admin/update-order-status.js`
- `admin/update-product.js`
- `admin/user-access-tiers.js`
- `admin/user-profile.js`
- `admin/user-update.js`
- `admin/users.js`
- `admin/visitor-analytics.js`
- `admin/webhook-dispatch.js`
- `admin/webhook-events.js`
- `catalog-items.js`
- `checkout-create-order.js`
- `checkout-prepare-payment.js`
- `checkout-recovery-lead.js`
- `creations.js`
- `gift-card-quote.js`
- `health.js`
- `me.js`
- `movies.js`
- `payment-providers.js`
- `paypal-return.js`
- `paypal-webhook.js`
- `product-detail.js`
- `product-interest.js`
- `product-reviews.js`
- `products.js`
- `site-search-event.js`
- `social-feed.js`
- `stripe-return.js`
- `stripe-webhook.js`
- `supplies.js`
- `tools.js`
- `data/data`
- `assets/movies`
- `data/tools.json`
- `data/products.json`
- `data/test_write`
- `data/supplies/supplies_metadata.zip`
- `supplies/README.txt`
- `supplies/exact_duplicate_report.json`
- `supplies/supplies_images_inventory.csv`
- `supplies/supplies_images_inventory.json`
- `supplies/supplies_items_master.csv`
- `supplies/supplies_items_master.json`
- `supplies/supplies_metadata.zip`


## Amazon Purchase Import Package — Added 2026-05-11

This build includes a staged Amazon purchase-history matching package for Toolshed and Supplies inventory.

Location:
`PRIVATE IMPORT PACKAGE: amazon_inventory_import_package.zip`

It includes review CSVs, summary totals, and a staging SQL file. The import package is intentionally review-first and does not automatically overwrite inventory.


## Private Import Data Safety Note — 2026-05-11

Amazon transaction CSVs and review spreadsheets are **not** stored inside the deployable website tree because `/data/` assets may become publicly reachable after Cloudflare Pages deployment. Keep the generated Amazon import package private and load approved rows into the database through an admin/import workflow instead.
