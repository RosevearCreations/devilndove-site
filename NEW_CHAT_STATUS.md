# New Chat Status — Devil n Dove Build 133

Current output build: Build 133 structured-data health, live sitemap preview, safe storefront value backfill, Search Console staging, and mobile-menu preservation.

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
