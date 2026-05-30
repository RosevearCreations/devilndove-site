# Build 156 API note

New or expanded API surface:

- `/api/custom-request-payment` — public private-token payment page API. It now blocks links that did not pass admin share gates and can prepare Stripe/PayPal/Square/manual checkout records.
- `/api/custom-request-order` — public private-token order-status API for converted custom-request orders.
- `/api/custom-request-consent` — public private-token review/photo/consent response API.
- `/api/admin/custom-requests?format=marketplace_csv&channel=...` — authenticated CSV export for Etsy, Facebook Marketplace, Pinterest, or all/manual listing review.
- `/api/admin/custom-requests` — expanded with payment-share gate checks, checkout record visibility, order-status links, consent prompt tokens, and stricter approved payment link rules.

Do not expose private token URLs in sitemap or public navigation. Keep all external payment sharing behind admin approval gates.

# Functions API Notes

Current sync: 2026-05-14 — Build 125.

## Active API surface
Cloudflare Pages Functions are under `/functions/api/`. Admin endpoints require admin authentication through the existing admin audit/auth helpers.

## Added/updated admin endpoints this pass
- `/api/admin/migration-ledger` — record and list SQL migration status.
- `/api/admin/release-sanity` — run public page, D1, accounting, incident, and migration checks.
- `/api/admin/accounting-statement-provider-profiles` — seed/list/save statement CSV provider mappings.
- `/api/admin/accounting-statement-imports` — now returns provider profiles for the import UI.
- `/api/admin/db-sanity` — now includes critical checks and count summaries.
- `/api/admin/site-item-inventory` — normalizes movement types, returns dollar display values, and guards current stock defaults.

## Money rule
APIs should store cents in D1 and return display helpers where needed. Admin forms should accept dollars and convert to cents before saving.

## Private data rule
Do not expose raw CSV imports, Amazon order history, or accounting reports through public static files. Use authenticated admin endpoints and D1 staging tables.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Build 129 admin endpoints

- `/api/admin/schema-drift-report` checks live D1 tables/columns against the current build expectations.
- `/api/admin/public-api-health` tests public JSON endpoints after deploys.
- `/api/admin/amazon-purchase-import` imports pasted Amazon CSV rows into private D1 staging.
- `/api/admin/runtime-incidents` now supports cleanup of old resolved/ignored incidents.

## Build 131 API note

New admin endpoint: `/api/admin/storefront-schema-repair`. It requires admin auth and can inspect/apply non-destructive storefront compatibility columns for `products`, `tax_classes`, and `product_seo`. Public API Health was expanded to treat `authority: "error"` as a failure and to check sitemap/robots/page HTML health.

- `/api/admin/social-post-queue` — admin review-first social post queue for job/process photos and summaries.

## Build 155 maintenance note

This Markdown file was reviewed during the Build 155 pass. The active roadmap/schema/gaps documents carry the detailed implementation notes for custom request payment links, order conversion, marketplace export packs, proof filters, and post-fulfillment prompts.

## Build 157 API note

Build 157 adds safer custom request operations across the admin and public APIs: mobile product save fallback handling, lifecycle controls for quote/payment/order/consent links, order-stage history, candle/soap product-spec fields, richer marketplace CSV preset data, payment provider readiness records, and consent-to-public-proof approval records.
