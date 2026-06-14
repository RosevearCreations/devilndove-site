# Build 185 — Admin Command Center and Value-Added Dashboards

Build 185 adds `/admin/command-center/`, `/api/admin/command-center`, `database_build185_admin_command_center_value_dashboards.sql`, and `data/site/build185-command-center.json`.

This pass turns the Build 184 sanity-check recommendations into a calmer daily operating screen covering Product Readiness, Orders/Today, Local SEO, Visual Enrichment, Customer Stories, Mobile Quick Add, Inventory/Job Costing, Customer History, Performance Budgets, and Deploy Safety.

No destructive schema changes were made. The new D1 migration is additive and should run after Build 184.

# Build 184 — Application Sanity Check and Value Roadmap

Build 184 adds a sanity-check layer instead of another broad feature expansion. It provides `/admin/application-sanity/`, `/api/admin/application-sanity`, `database_build184_sanity_check_and_value_roadmap.sql`, and `data/site/build184-application-sanity.json`.

The pass documents where the application stands now, which areas are strongest, which risks still matter, and which value-added modifications should come next. It also updates schema references, deployment checks, release manifest generation, Markdown handoff files, SEO/local guidance notes, and validation output.

# Build 183 — Visual Enrichment Studio and Professional Visual Controls

- Added `/admin/visual-enrichment-studio/`, `/api/admin/visual-enrichment-studio`, and `database_build183_visual_enrichment_studio.sql`.
- Added visual media-picker asset rows, desktop/mobile screenshot pairs, dark-theme screenshot job placeholders, Local SEO visual badges, page image-slot assignments that preserve one-H1 structure, image compression budget rows, visual diff overlays, alt-text suggestions, schema validator import rows, JSON→D1 ownership decisions, public API fallback previews, mobile quick cards, seasonal campaign rows, gallery hero rotation, product detail visual polish checks, CSS token drift rows, accessibility notes, low-bandwidth preference rows, and final visual deployment report rows.
- Added a customer-facing lighter-visual toggle that reduces nonessential visual effects without changing content or H1 structure.
- Updated schema files, deployment preflight script, final blocker script, manifest generation, roadmap, known gaps, Local SEO notes, image notes, post-deploy smoke-test notes, README, AI context, and new-chat handoff.

# Build 182 Completed Pass — Visual Polish, Desktop/Mobile Parity, SEO Enrichment, and Fallback Safety

Completed in this pass:
1. Added `/admin/visual-polish/` as the Build 182 desktop/mobile polish and enrichment review page.
2. Added `/api/admin/visual-polish` for parity rows, visual candidates, effect safety, fallback reviews, schema queue rows, and JSON-to-D1 ownership candidates.
3. Added `database_build182_mobile_visual_polish.sql` and appended the same additive schema to aggregate schema files.
4. Added desktop/mobile parity check rows for key public and local SEO pages.
5. Added mobile navigation touch-target audit rows using a 44px minimum target guideline inside the admin review workflow.
6. Added visual enrichment candidate rows for local pages, image slots, asset hints, alt text hints, and reduced-motion-safe placement notes.
7. Added visual-effect safety review rows for hero glow, card lift, visual ribbons, and product-image depth.
8. Added public-page visual asset budget rows to limit new images/effects and require lazy loading for future media additions.
9. Added route fallback review rows for core admin and public APIs so blank panels can be replaced with readable retry/error states.
10. Added structured-data validation queue rows for LocalBusiness, WebSite, and Product markup review after page updates.
11. Added JSON-to-D1 migration candidate rows for catalog, SEO overrides, LocalBusiness, release notes, and local SEO bake actions.
12. Added visual-polish admin preferences for default viewport pairs and motion policy.
13. Added a shared visual polish strip on the homepage and local pages without adding any extra H1 headings.
14. Added motion-safe CSS for sharper cards, visual tiles, admin controls, and phone-friendly button sizing.
15. Added `data/site/build182-mobile-visual-polish.json` as a static handoff artifact for this pass.
16. Updated admin dashboard and Operations navigation with Visual Polish & Mobile Parity links.
17. Updated static preflight and final blocker scripts to require the new Build 182 page, API, JS, migration, and handoff JSON.
18. Updated the release manifest generator to emit Build 182 metadata.
19. Updated Markdown handoff files, schema references, release notes, sanity notes, local SEO notes, image/evidence notes, README, and AI context.
20. Ran syntax, JSON, H1, CSS, SQL, preflight, final blocker, and zip validation for the Build 182 package.

Next 20 recommended steps:
1. Connect Visual Polish candidates to real product/R2 media picker thumbnails so approved image slots can choose an existing asset.
2. Add side-by-side screenshot uploads for desktop and mobile parity rows.
3. Add automated screenshot capture after deploy for the Visual Polish page using the existing dark-theme evidence queue.
4. Show Visual Polish candidate badges directly on Local SEO Review rows.
5. Create a public page image-slot editor that writes approved candidates back to page sections without changing H1 structure.
6. Add a media compression budget report that flags large images before they are promoted to public pages.
7. Add visual diff overlays for previous/current screenshot pairs.
8. Add one-click alt-text copy generation from approved visual candidates.
9. Add schema validation result import rows from Rich Results/Schema validators after manual checks.
10. Move `data/catalog.json` fallback ownership decisions into a visible JSON→D1 migration admin panel.
11. Add public API fallback preview cards that show the exact customer-facing error message before deployment.
12. Add phone-only admin quick cards for Visual Polish candidate approval.
13. Add seasonal visual campaign rows for Christmas, Mother’s Day, Father’s Day, markets, and custom gift events.
14. Add a gallery hero-image rotation queue using approved media only.
15. Add product detail visual polish checks for thumbnail strip, featured image, image roles, and mobile zoom controls.
16. Add CSS token checks for contrast, spacing, card radius, and button height drift.
17. Add visual accessibility notes for motion, contrast, text-over-image, and touch target review.
18. Add real D1-export-to-static JSON ownership status inside Safe Deploy package metadata.
19. Add a customer-facing low-bandwidth mode toggle or lighter media preference.
20. Merge Visual Polish status into the final printable deployment report alongside Release Control and Live Ops.


# Build 181 Release Notes

- Added `/admin/live-ops-followthrough/` as the Build 181 follow-through admin page after Go-Live Execution.
- Added `/api/admin/live-ops-followthrough` for QA blocker counts, marketplace gate badges, override requests, recall upload requests, LocalBusiness export rows, content-refresh logs, notification buttons, and watcher snapshots.
- Added `/api/admin/private-evidence-download` with HMAC-signed R2 download tokens, expiry enforcement, audit logging, and guarded bucket selection.
- Added `database_build181_live_ops_followthrough.sql` and updated aggregate schema files with the same additive tables.
- Added private evidence download token and audit tables for accountant/customer/recall evidence objects.
- Added Product QA blocker preview count rows for Catalog QA badges beside blocker groups.
- Added marketplace gate badge snapshots so CSV export buttons can show ready/blocked reasons before download.
- Added marketplace export gate override requests with reason and expiry timestamps for temporary audited overrides.
- Added recall evidence upload request rows with R2 target prefixes for candle/soap recall evidence widgets.
- Added LocalBusiness admin export run rows so D1 settings can feed `data/site/local-business-schema.json` during safe deploy packaging.
- Added public page content refresh tracking rows tied to local SEO phrases and static page copy updates.
- Added provider webhook crypto test-vector notes for Resend, SendGrid, and Postmark verification work.
- D1 order now includes `database_build181_live_ops_followthrough.sql` after Build 180.

# Build 180 — Go-Live Execution, Direct Endpoint Gates, SEO Visuals, and Final Release Controls

Highlights:

- Added `/admin/go-live-execution/` and `/api/admin/go-live-execution`.
- Added `database_build180_go_live_execution.sql` and updated aggregate schema files.
- Added gated Product QA safe applies for SEO-title casing and empty product status labels.
- Rendered Local SEO SVG chart rows and surfaced them on Local SEO Review.
- Blocked marketplace CSV downloads when hard export gates are active.
- Strengthened recall notification status changes so both recall lock systems must allow release.
- Added structured-data excerpt rows, manifest drawer runs, readiness score trend exports, promote-button state rows, and post-promotion watcher scheduling.

Validation summary:

- Static deployment preflight: ready, 0 blockers, 0 warnings.
- Final deployment blocker check: PASS.
- JavaScript syntax checks: passed.
- JSON validation: passed.
- One-H1 check: passed.
- CSS brace balance: passed.
- Build 180 SQL smoke test: passed.

# Release Notes

## Summary


## Release package manifest

- Static manifest: `data/site/release-package-manifest.json`
- The manifest is regenerated after release notes so its own hash does not create a documentation loop.

## Changed files

- `AI_CONTEXT.md`
- `AMAZON_MATCHING_NOTES.md`
- `COMPETITIVE.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `DEVELOPMENT_ROADMAP.md`
- `IMAGES.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `LOCAL_SEO_PLAYBOOK.md`
- `NEW_CHAT_STATUS.md`
- `POST_DEPLOY_SMOKE_TEST.md`
- `README.md`
- `RELEASE_NOTES.md`
- `REPO_BASE_GUIDE.md`
- `REPO_RULES.md`
- `SANITY_HEALTH_CHECK.md`
- `admin/accounting/index.html`
- `admin/analytics/index.html`
- `admin/catalog/index.html`
- `admin/catalog-media/index.html`
- `admin/dark-theme-evidence/index.html`
- `admin/deploy-readiness/index.html`
- `admin/deployment-preflight/index.html`
- `admin/gift-cards/index.html`
- `admin/go-live-execution/index.html`
- `admin/index.html`
- `admin/inventory-operations/index.html`
- `admin/local-seo-review/index.html`
- `admin/marketplace-exports/index.html`
- `admin/marketplace-mapping/index.html`
- `admin/members/index.html`
- `admin/membership/index.html`
- `admin/mobile/index.html`
- `admin/mobile-inventory/index.html`
- `admin/mobile-product/index.html`
- `admin/movies/index.html`
- `admin/operations/index.html`
- `admin/orders/index.html`
- `admin/post-deploy-smoke-tests/index.html`
- `admin/products/index.html`
- `admin/promotion-control/index.html`
- `admin/public-proof-candidates/index.html`
- `admin/readiness/index.html`
- `admin/release-control/index.html`
- `admin/release-notes/index.html`
- `admin/safe-deploy-package/index.html`
- `admin/stage-photo-moderation/index.html`
- `admin/trust-blocks/index.html`
- `admin/users/index.html`
- `css/styles.css`
- `data/accounting_templates/README.md`
- `data/site/build178-release-controls.json`
- `data/site/build179-promotion-control.json`
- `data/site/build180-go-live-execution.json`
- `data/site/competitive-opportunities.json`
- `data/site/deployment-preflight.json`
- `data/site/featured-items.json`
- `data/site/local-business-schema.json`
- `data/site/local-seo-bake-actions.json`
- `data/site/local-trust.json`
- `data/site/release-notes.json`
- `data/site/seo-page-overrides.json`
- `data/site/social-feed.json`
- `database_access_tiers.sql`
- `database_admin_seed_template.sql`
- `database_amazon_purchase_import_staging.sql`
- `database_build171_ledger_repair.sql`
- `database_build173_deployment_preflight.sql`
- `database_build174_deployment_preflight_detail.sql`
- `database_build175_release_control.sql`
- `database_build176_release_safety_controls.sql`
- `database_build177_deploy_score_and_controls.sql`
- `database_build178_promote_live_controls.sql`
- `database_build179_promotion_control.sql`
- `database_build180_go_live_execution.sql`
- `database_full_schema.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_inventory_stock_unit_quick_fix.sql`
- `database_payments_extension.sql`
- `database_profiles_extension.sql`
- `database_schema.sql`
- `database_store_schema.sql`
- `database_upgrade_current_pass.sql`
- `functions/api/_communityContent.js`
- `functions/api/_lib/accounting.js`
- `functions/api/_lib/adminAudit.js`
- `functions/api/_lib/adminStepUp.js`
- `functions/api/_lib/notificationOutbox.js`
- `functions/api/_lib/passwordHash.js`
- `functions/api/admin/_accountingAttachments.js`
- `functions/api/admin/_accountingGifi.js`
- `functions/api/admin/_accountingPeriods.js`
- `functions/api/admin/_accountingReconciliation.js`
- `functions/api/admin/_accountingStatementImports.js`
- `functions/api/admin/_accountingVendors.js`
- `functions/api/admin/_amazonInventoryMatches.js`
- `functions/api/admin/_catalog-options.js`
- `functions/api/admin/_costing.js`
- `functions/api/admin/_inventoryCostHistory.js`
- `functions/api/admin/_product-numbering.js`
- `functions/api/admin/access-tiers.js`
- `functions/api/admin/accounting-attachments.js`
- `functions/api/admin/accounting-close-workflow.js`
- `functions/api/admin/accounting-evidence-attachments.js`
- `functions/api/admin/accounting-evidence-check.js`
- `functions/api/admin/accounting-expenses.js`
- `functions/api/admin/accounting-fixed-assets.js`
- `functions/api/admin/accounting-gifi-notes.js`
- `functions/api/admin/accounting-gifi-summary.js`
- `functions/api/admin/accounting-item-costing.js`
- `functions/api/admin/accounting-journal.js`
- `functions/api/admin/accounting-monthly-summary-export.js`
- `functions/api/admin/accounting-overhead-allocations.js`
- `functions/api/admin/accounting-overhead-product-allocations.js`
- `functions/api/admin/accounting-period-locks.js`
- `functions/api/admin/accounting-period-summary-export.js`
- `functions/api/admin/accounting-profit-loss.js`
- `functions/api/admin/accounting-reconciliation-exceptions.js`
- `functions/api/admin/accounting-reconciliation.js`
- `functions/api/admin/accounting-recurring-expense-rules.js`
- `functions/api/admin/accounting-sales-tax-filing.js`
- `functions/api/admin/accounting-statement-imports.js`
- `functions/api/admin/accounting-statement-provider-profiles.js`
- `functions/api/admin/accounting-summary.js`
- `functions/api/admin/accounting-vendor-statements.js`
- `functions/api/admin/accounting-vendors.js`
- `functions/api/admin/accounting-writeoffs.js`
- `functions/api/admin/accounting-year-end-close.js`
- `functions/api/admin/amazon-purchase-import.js`
- `functions/api/admin/amazon-purchase-review.js`
- `functions/api/admin/app-settings.js`
- `functions/api/admin/archive-product.js`
- `functions/api/admin/assign-user-access-tier.js`
- `functions/api/admin/audit-log.js`
- `functions/api/admin/bootstrap.js`
- `functions/api/admin/bulk-update-products.js`
- `functions/api/admin/bulk-update-site-inventory.js`
- `functions/api/admin/candle-soap-label-export.js`
- `functions/api/admin/candle-soap-labels.js`
- `functions/api/admin/candle-soap-recall-notifications.js`
- `functions/api/admin/candle-soap-recalls.js`
- `functions/api/admin/candle-soap-specs.js`
- `functions/api/admin/catalog-option-sets.js`
- `functions/api/admin/catalog-sync.js`
- `functions/api/admin/cleanup-sessions.js`
- `functions/api/admin/community-content.js`
- `functions/api/admin/competitive-roadmap.js`
- `functions/api/admin/create-product.js`
- `functions/api/admin/create-user.js`
- `functions/api/admin/custom-order-stage-photos.js`
- `functions/api/admin/custom-requests.js`
- `functions/api/admin/customer-engagement.js`
- `functions/api/admin/dark-theme-evidence.js`
- `functions/api/admin/dashboard-summary.js`
- `functions/api/admin/db-sanity.js`
- `functions/api/admin/delete-product.js`
- `functions/api/admin/delete-user.js`
- `functions/api/admin/deploy-readiness.js`
- `functions/api/admin/deployment-preflight.js`
- `functions/api/admin/general-ledger-accounts.js`
- `functions/api/admin/gift-card-abuse.js`
- `functions/api/admin/gift-card-actions.js`
- `functions/api/admin/gift-card-balance.js`
- `functions/api/admin/gift-card-delivery-history.js`
- `functions/api/admin/gift-card-delivery-send.js`
- `functions/api/admin/gift-card-delivery-templates.js`
- `functions/api/admin/gift-card-redemptions.js`
- `functions/api/admin/go-live-execution.js`
- `functions/api/admin/import-products-preview.js`
- `functions/api/admin/import-products.js`
- `functions/api/admin/live-activity.js`
- `functions/api/admin/local-seo-bake-actions.js`
- `functions/api/admin/local-seo-competitor-phrases.js`
- `functions/api/admin/local-seo-review-scoring.js`
- `functions/api/admin/local-seo-review.js`
- `functions/api/admin/marketplace-csv-mapping.js`
- `functions/api/admin/marketplace-export-preview.js`
- `functions/api/admin/media-assets.js`
- `functions/api/admin/media-consent-records.js`
- `functions/api/admin/media-diagnostics.js`
- `functions/api/admin/media-upload.js`
- `functions/api/admin/migrate.js`
- `functions/api/admin/migration-ledger.js`
- `functions/api/admin/mobile-create-product.js`
- `functions/api/admin/mobile-product-drafts.js`
- `functions/api/admin/movies.js`
- `functions/api/admin/notification-outbox.js`
- `functions/api/admin/notifications.js`
- `functions/api/admin/order-detail.js`
- `functions/api/admin/order-payments.js`
- `functions/api/admin/orders.js`
- `functions/api/admin/payment-actions.js`
- `functions/api/admin/pending-actions-status.js`
- `functions/api/admin/pending-actions.js`
- `functions/api/admin/post-deploy-smoke-tests.js`
- `functions/api/admin/product-cost-rollups.js`
- `functions/api/admin/product-costs.js`
- `functions/api/admin/product-detail.js`
- `functions/api/admin/product-image-annotations.js`
- `functions/api/admin/product-image-derivatives.js`
- `functions/api/admin/product-image-health.js`
- `functions/api/admin/product-images.js`
- `functions/api/admin/product-mobile-bootstrap.js`
- `functions/api/admin/product-price-suggestions.js`
- `functions/api/admin/product-publish-qa.js`
- `functions/api/admin/product-qa-history.js`
- `functions/api/admin/product-qa-panel-state.js`
- `functions/api/admin/product-readiness.js`
- `functions/api/admin/product-resources.js`
- `functions/api/admin/product-review-actions.js`
- `functions/api/admin/product-seo.js`
- `functions/api/admin/product-stock-report.js`
- `functions/api/admin/product-story-notes.js`
- `functions/api/admin/products.js`
- `functions/api/admin/promotion-control.js`
- `functions/api/admin/public-api-health.js`
- `functions/api/admin/public-proof-candidates.js`
- `functions/api/admin/purchase-orders.js`
- `functions/api/admin/r2-derivative-settings.js`
- `functions/api/admin/record-payment.js`
- `functions/api/admin/release-control.js`
- `functions/api/admin/release-notes.js`
- `functions/api/admin/release-sanity.js`
- `functions/api/admin/remove-user-access-tier.js`
- `functions/api/admin/reset-password.js`
- `functions/api/admin/runtime-incidents.js`
- `functions/api/admin/safe-deploy-package.js`
- `functions/api/admin/schema-drift-report.js`
- `functions/api/admin/search-console-import.js`
- `functions/api/admin/security-summary.js`
- `functions/api/admin/site-item-inventory.js`
- `functions/api/admin/sitemap-preview.js`
- `functions/api/admin/social-media-privacy-guard.js`
- `functions/api/admin/social-post-queue.js`
- `functions/api/admin/stage-photo-moderation.js`
- `functions/api/admin/storefront-schema-repair.js`
- `functions/api/admin/storefront-value-backfill.js`
- `functions/api/admin/structured-data-health.js`
- `functions/api/admin/tax-classes.js`
- `functions/api/admin/testimonial-trust-blocks.js`
- `functions/api/admin/tier-policies.js`
- `functions/api/admin/today-task-actions.js`
- `functions/api/admin/today-tasks.js`
- `functions/api/admin/trust-block-placements.js`
- `functions/api/admin/trust-block-preview.js`
- `functions/api/admin/update-order-status.js`
- `functions/api/admin/update-product.js`
- `functions/api/admin/user-access-tiers.js`
- `functions/api/admin/user-profile.js`
- `functions/api/admin/user-update.js`
- `functions/api/admin/users.js`
- `functions/api/admin/visitor-analytics.js`
- `functions/api/admin/webhook-dispatch.js`
- `functions/api/admin/webhook-events.js`
- `functions/api/auth/account-help-request.js`
- `functions/api/auth/bootstrap-admin.js`
- `functions/api/auth/bootstrap-status.js`
- `functions/api/auth/change-password.js`
- `functions/api/auth/login.js`
- `functions/api/auth/logout-all.js`
- `functions/api/auth/logout.js`
- `functions/api/auth/me.js`
- `functions/api/auth/register.js`
- `functions/api/auth/session-info.js`
- `functions/api/catalog-items.js`
- `functions/api/checkout-create-order.js`
- `functions/api/checkout-prepare-payment.js`
- `functions/api/checkout-recovery-lead.js`
- `functions/api/community-content.js`
- `functions/api/creations.js`
- `functions/api/custom-request-consent.js`
- `functions/api/custom-request-order.js`
- `functions/api/custom-request-payment.js`
- `functions/api/custom-request-quote.js`
- `functions/api/custom-request-reference-upload.js`
- `functions/api/custom-request.js`
- `functions/api/gift-card-balance.js`
- `functions/api/gift-card-quote.js`
- `functions/api/health.js`
- `functions/api/image-derivative.js`
- `functions/api/me.js`
- `functions/api/member/downloads.js`
- `functions/api/member/order-detail.js`
- `functions/api/member/orders.js`
- `functions/api/member/profile.js`
- `functions/api/member/reviews.js`
- `functions/api/member/tier-policies.js`
- `functions/api/member/wishlist.js`
- `functions/api/movies.js`
- `functions/api/payment-providers.js`
- `functions/api/paypal-return.js`
- `functions/api/paypal-webhook.js`
- `functions/api/product-detail.js`
- `functions/api/product-interest.js`
- `functions/api/product-reviews.js`
- `functions/api/products.js`
- `functions/api/readme.md`
- `functions/api/seo-page-overrides.js`
- `functions/api/site-search-event.js`
- `functions/api/social-feed.js`
- `functions/api/stripe-return.js`
- `functions/api/stripe-webhook.js`
- `functions/api/supplies.js`
- `functions/api/tools.js`
- `functions/api/track/cart.js`
- `functions/api/track/visit.js`
- `functions/api/trust-blocks.js`
- `js/main.js`
- `public/js/account-help.js`
- `public/js/admin-access-tiers.js`
- `public/js/admin-accounting-advanced.js`
- `public/js/admin-accounting-backend.js`
- `public/js/admin-accounting-close-workflow.js`
- `public/js/admin-accounting-evidence-check.js`
- `public/js/admin-accounting-imports.js`
- `public/js/admin-accounting-report.js`
- `public/js/admin-accounting-statement-profiles.js`
- `public/js/admin-accounting-t2-presets.js`
- `public/js/admin-accounting.js`
- `public/js/admin-amazon-purchase-import.js`
- `public/js/admin-amazon-purchase-review.js`
- `public/js/admin-app-settings.js`
- `public/js/admin-archive-product.js`
- `public/js/admin-brand-content.js`
- `public/js/admin-candle-soap-specs.js`
- `public/js/admin-catalog-option-manager.js`
- `public/js/admin-catalog-sync.js`
- `public/js/admin-cleanup-sessions.js`
- `public/js/admin-community.js`
- `public/js/admin-competitive-roadmap.js`
- `public/js/admin-create-product.js`
- `public/js/admin-create-user.js`
- `public/js/admin-custom-requests.js`
- `public/js/admin-customer-engagement.js`
- `public/js/admin-dark-theme-evidence.js`
- `public/js/admin-dashboard-notification-actions.js`
- `public/js/admin-dashboard-preflight-badge.js`
- `public/js/admin-dashboard-smoke-badges.js`
- `public/js/admin-dashboard-summary.js`
- `public/js/admin-delete-product.js`
- `public/js/admin-delete-user.js`
- `public/js/admin-deploy-readiness.js`
- `public/js/admin-deployment-preflight.js`
- `public/js/admin-edit-product.js`
- `public/js/admin-gift-card-customer-history.js`
- `public/js/admin-gift-card-order-redemption.js`
- `public/js/admin-gift-cards.js`
- `public/js/admin-go-live-execution.js`
- `public/js/admin-import-products.js`
- `public/js/admin-live-activity.js`
- `public/js/admin-local-seo-review.js`
- `public/js/admin-marketplace-export-preview.js`
- `public/js/admin-marketplace-mapping.js`
- `public/js/admin-media-consent-records.js`
- `public/js/admin-media-diagnostics.js`
- `public/js/admin-migration-ledger.js`
- `public/js/admin-mobile-dashboard.js`
- `public/js/admin-mobile-product-augment.js`
- `public/js/admin-mobile-product.js`
- `public/js/admin-movie-catalog.js`
- `public/js/admin-notifications.js`
- `public/js/admin-order-detail.js`
- `public/js/admin-orders.js`
- `public/js/admin-panel-routing.js`
- `public/js/admin-post-deploy-smoke-tests.js`
- `public/js/admin-product-bulk-tools.js`
- `public/js/admin-product-draft-checklist.js`
- `public/js/admin-product-image-annotations.js`
- `public/js/admin-product-image-health.js`
- `public/js/admin-product-images.js`
- `public/js/admin-product-price-suggestions.js`
- `public/js/admin-product-readiness.js`
- `public/js/admin-product-resources.js`
- `public/js/admin-product-seo.js`
- `public/js/admin-product-stock-report.js`
- `public/js/admin-product-story-notes.js`
- `public/js/admin-products-enhancements.js`
- `public/js/admin-products.js`
- `public/js/admin-promotion-control.js`
- `public/js/admin-public-api-health.js`
- `public/js/admin-public-proof-candidates.js`
- `public/js/admin-r2-derivative-settings.js`
- `public/js/admin-release-control.js`
- `public/js/admin-release-notes.js`
- `public/js/admin-release-sanity.js`
- `public/js/admin-reset-password.js`
- `public/js/admin-runtime-incidents.js`
- `public/js/admin-safe-deploy-package.js`
- `public/js/admin-schema-drift-report.js`
- `public/js/admin-search-console-import.js`
- `public/js/admin-security-summary.js`
- `public/js/admin-self-protect.js`
- `public/js/admin-site-item-inventory.js`
- `public/js/admin-sitemap-preview.js`
- `public/js/admin-social-media-privacy-guard.js`
- `public/js/admin-social-post-queue.js`
- `public/js/admin-stage-photo-moderation.js`
- `public/js/admin-storefront-schema-repair.js`
- `public/js/admin-storefront-value-backfill.js`
- `public/js/admin-structured-data-health.js`
- `public/js/admin-testimonial-trust-blocks.js`
- `public/js/admin-tier-policy.js`
- `public/js/admin-today-tasks.js`
- `public/js/admin-trust-block-placement-preview.js`
- `public/js/admin-user-profiles.js`
- `public/js/admin-user-update.js`
- `public/js/admin-users.js`
- `public/js/admin-visitor-analytics.js`
- `public/js/admin-webhook-events.js`
- `public/js/admin.js`
- `public/js/auth.js`
- `public/js/bootstrap-admin.js`
- `public/js/cart-badge.js`
- `public/js/cart-page.js`
- `public/js/cart.js`
- `public/js/change-password.js`
- `public/js/checkout.js`
- `public/js/custom-request-consent.js`
- `public/js/custom-request-intake.js`
- `public/js/custom-request-order-status.js`
- `public/js/custom-request-payment.js`
- `public/js/custom-request-quote-preview.js`
- `public/js/events-page.js`
- `public/js/gift-card-storefront.js`
- `public/js/local-trust-block.js`
- `public/js/login.js`
- `public/js/logout-all.js`
- `public/js/member-account-tools.js`
- `public/js/member-downloads.js`
- `public/js/member-order-detail.js`
- `public/js/member-orders.js`
- `public/js/member-profile.js`
- `public/js/member-reviews.js`
- `public/js/member-wishlist.js`
- `public/js/members-self-protect.js`
- `public/js/members.js`
- `public/js/order-confirmation.js`
- `public/js/payment-options.js`
- `public/js/pickup-page.js`
- `public/js/product-detail.js`
- `public/js/register.js`
- `public/js/seo-page-overrides.js`
- `public/js/session-info.js`
- `public/js/shop.js`
- `public/js/site-analytics.js`
- `public/js/site-auth-ui.js`
- `public/js/site-search.js`
- `public/js/social-hub.js`
- `public/js/trust-block-context.js`

## D1 migration summary

