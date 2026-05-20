# New Chat Status — Devil n Dove Build 137

## Current status — Build 137

Build 137 starts from the latest uploaded build and focuses on Search Console SEO workflow safety. Operations > Search Console CSV Import now has filters, safe batch delete/revert, and private SEO opportunity actions. Generated title/meta/internal-link ideas are stored as reviewable admin tasks and do not edit public pages automatically. Deploy it, apply or record `database_upgrade_current_pass.sql`, then test with a small Search Console CSV batch.

## Current status — Build 135

Build 135 adds Media/R2 Diagnostics, Product Image Health, a product draft checklist, reusable media picker, edit-mode image upload attachment, and saved handmade/vintage/external listing fields during product updates. Deploy it, run `database_upgrade_current_pass.sql` or record the Build 135 ledger marker, then test `/admin/products/` and `/admin/operations/`.


Current output build: Build 137 Search Console filters, safe import batch revert, private SEO opportunity actions, and all prior compact mobile/product/media safeguards carried forward.

## Current status — Build 134

Build 134 fixes the admin Product editor workflow. Draft mode now only requires product name and product type. SEO title/description, price, category, images, and external links are treated as publish-readiness items instead of draft blockers. The Product editor now includes an inline image uploader that uses `/api/admin/media-upload` when R2 media storage is connected, while still allowing pasted image URLs.

`/api/admin/create-product` was rebuilt to adapt to live D1 columns, insert SEO/images only when their tables/columns are present, and always return JSON on failure. Create-product failures are logged as runtime incidents under `admin_products/create_product_failed`.

Post-deploy priority: open `/admin/products/`, create a draft with only name/type, test one pasted image URL, then test one upload if R2 media bindings are configured. If upload fails, inspect Operations > Runtime Incidents and confirm R2 public base settings.


## Current status — Build 133

Build 133 starts from the latest uploaded build and keeps the compact grouped mobile menu in place. This pass adds Operations panels for Structured Data Health, Storefront Value Backfill, and Live Sitemap Preview. It also adds admin endpoints for those checks, Search Console CSV staging tables for future SEO performance imports, Release Sanity coverage for the new checks, and predeploy sanity coverage for the new Operations assets.

After deploy, run Operations checks in this order: Storefront Schema Repair, Storefront Value Backfill, Structured Data Health, Live Sitemap Preview, Public API Health, Runtime Incidents, Migration Ledger, and Release Sanity.

## Build 130 handoff — 2026-05-15

Build 130 follows Build 129 because the live runtime incident count still increased for `/api/products`:

```text
products_primary_query_failed
products_fallback_query_failed
```

The new fix is more defensive: `/api/products` now uses only actual D1 columns from metadata/sample rows, and if both richer SQL paths fail it falls back to `SELECT * FROM products LIMIT 500` with JavaScript-side filtering. It does not log a runtime incident when a lower fallback succeeds.

Post-deploy validation:

1. Open `/api/products`.
2. Confirm `ok: true`.
3. Confirm `summary.authority` is not `error`.
4. Check Runtime Incidents and ensure the `/api/products` grouped count stops increasing.
5. Mark old `/api/products` incidents resolved after fresh requests stay clean.

## Current status — Build 131

Build 131 adds an admin Storefront Schema Repair panel and endpoint, expands Public API Health, adds Release Sanity coverage for storefront schema repair readiness, and adds a local `scripts/predeploy_sanity_check.py` privacy/SEO/CSS/link check. This pass is focused on fixing the root cause behind repeated `/api/products` fallback incidents by making the live D1 product/tax/SEO schema repairable from admin, not just making the public endpoint survive schema drift.

After deploy: open `/admin/operations/`, run Storefront Schema Repair inspect/apply if needed, then run Public API Health and Release Sanity. Only mark old `/api/products` runtime incidents resolved after the count stops increasing.

## Current status — Build 132

Build 132 focuses on mobile usability. The shared main menu now opens as a compact grouped drawer instead of a long flat list. The pass also hardens mobile drawer sizing, close/focus behavior, admin department shortcut layout on phones, and the local predeploy sanity script. No D1 structural migration is required; `database_upgrade_current_pass.sql` includes a Build 132 ledger marker.

Post-deploy priority: test the main menu on a real phone, then run Operations > Public API Health and Release Sanity.

## Build 136 status — 2026-05-18

- Added Operations > Search Console CSV Import.
- Added `/api/admin/search-console-import` for private D1 staging of Search Console CSV exports.
- Added top-page and SEO-opportunity summaries for manual title/meta/internal-link review.
- Added Release Sanity coverage and current-pass SQL table/index self-healing for the Search Console staging tables.
- Keep Search Console CSV exports private; do not store them in public `/data/`.

Next deployment checks: apply/record `database_upgrade_current_pass.sql`, open `/admin/operations/`, import a tiny Search Console CSV sample, then run Release Sanity and Public API Health.


## Build 138 status

Build 138 adds the Social Posting Queue in Operations. It can queue job/process photos, create captions, target Facebook/Instagram/TikTok/X/YouTube/Pinterest, copy captions for manual publishing, and record public post URLs after publishing. It intentionally does not auto-post yet because platform OAuth/app approvals and secret storage need to be configured safely first.
