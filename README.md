# Devil n Dove Website

Devil n Dove is a public website, storefront, member area, and admin management system for the workshop.

## Current state

The current build includes:

- public storefront and product detail pages
- member login, registration, account tools, orders, and downloads
- admin dashboard for users, products, orders, analytics, inventory, SEO, notifications, and media
- checkout and order creation
- PayPal handoff, PayPal return capture, and PayPal webhook reconciliation
- Stripe hosted checkout preparation and Stripe webhook reconciliation
- webhook event logging for provider idempotency and audit trail
- admin webhook review and safe replay queue controls
- live visitor/session analytics and historical website data by path and country
- product SEO fields, product image annotations, and product media workflow tools
- direct image upload endpoint for R2-backed product media
- uploaded asset browsing and delete actions in admin
- public site search page with structured data support and search-event logging
- shared footer-driven site search and crawl-discovery links on every page
- floating logged-in account widget available sitewide
- shared auth token persistence now uses localStorage plus a sitewide cookie fallback so public pages can detect active sign-in more reliably
- shared footer injection hardened so the footer remains visible across standard site pages
- admin dashboard layout pass with cleaner summary cards, more uniform inputs/tables, and a live activity feed
- account-help page for forgot-password and forgot-email request logging
- site inventory and reorder tracking for tools, supplies, and sellable products
- inventory movement history logging for stock changes
- local refund and dispute workflow logging for orders and payments
- live admin activity feed for recent searches, visitor sessions, cart events, orders, and webhook activity

## Main payment status

Implemented now:

- order creation
- payment preparation
- PayPal redirect handoff
- PayPal return capture
- PayPal webhook reconciliation endpoint
- Stripe Checkout session creation
- Stripe webhook reconciliation endpoint
- webhook event storage for duplicate-event safety
- admin manual payment recording
- admin webhook review and requeue controls
- refund and dispute local tracking tables and admin actions

Still to deepen later:

- actual provider-side refund execution and sync-back confirmation
- provider dispute evidence upload and response workflow
- webhook worker retry scheduling beyond manual replay queueing
- optional Stripe customer portal and saved customer records later

## Main product and media status

Implemented now:

- create, edit, archive, and delete products
- bulk update products
- import preview and import tools with duplicate slug checks
- product SEO editor
- product image annotation editor
- product image workflow editor for ordered images, alt text, captions, focal points, and featured image sync
- direct admin upload endpoint for product images to R2
- uploaded asset library browsing and delete actions in admin
- storefront search page spanning products, tools, supplies, creations, and key pages
- inventory tracking on products and site inventory records
- inventory movement history foundation

## Public SEO and search policy now in force

For every future public-facing update:

- every outward-facing page must have exactly one H1
- no outward-facing page may ship without a title, meta description, canonical URL, and index/follow or noindex/follow decision
- social tags should exist for outward-facing pages: Open Graph and Twitter card tags
- public pages should use structured data where practical
- private utility pages such as login, register, cart, checkout, members, bootstrap, and health pages should stay `noindex`
- sitemap and robots.txt must be reviewed whenever public pages are added or removed
- search visibility and crawl awareness should be improved a little every pass, not treated as a one-time task
- every shared-layout pass should preserve the shared footer, shared account widget, and search-discovery links sitewide
- shared auth/session UI must remain consistent between admin and outward-facing pages so an active admin session is visible across the regular site too
- formatting passes should keep forms, tables, widgets, and dashboard cards visually consistent rather than page-specific

## Database files

- `database_schema.sql`
- `database_store_schema.sql`
- `database_access_tiers.sql`
- `database_payments_extension.sql`
- `database_profiles_extension.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`
- `database_admin_seed_template.sql`

## Important endpoints

Auth:
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/logout-all`
- `/api/auth/me`
- `/api/auth/change-password`
- `/api/auth/session-info`
- `/api/auth/bootstrap-admin`
- `/api/auth/bootstrap-status`

Storefront and checkout:
- `/api/products`
- `/api/product-detail`
- `/api/checkout-create-order`
- `/api/checkout-prepare-payment`
- `/api/paypal-return`
- `/api/paypal-webhook`
- `/api/stripe-webhook`
- `/api/site-search-event`

Admin operations added or deepened in the recent passes:
- `/api/admin/live-activity`
- `/api/admin/webhook-events`
- `/api/admin/payment-actions`
- `/api/admin/media-assets`
- `/api/admin/site-item-inventory`
- `/api/admin/product-resources`
- `/api/movies`
- `/api/admin/import-products-preview`


## Current caution

JSON-backed collections still exist for some public sections such as tools, supplies, and creations. The site search works across them today, but a staged move of those collections into D1 would make future search, inventory, analytics, and admin tooling much stronger.


## Latest pass additions

- CSV-first mass upload workflow for products with a downloadable template. Required fields are `name`, `product_type`, and `price_cents`; `slug` is optional and auto-generated when omitted.
- Featured images remain optional during import and can be added later during product review before store-ready status is applied.
- Began staged D1 migration for tools, supplies, and featured creations through the new `catalog_items` table and admin sync tooling.
- Public search, tools, and supplies pages now prefer database-backed catalog items when available and fall back to JSON when a sync has not been run yet.


## SEO operating note

Public SEO passes should stay aligned with current Google Search guidance: strong title links, useful meta descriptions, one clear H1 per outward-facing page, crawlable canonicals/robots intent, and structured data that matches visible content.


## Current pass additions
- Session/auth now uses a stronger same-site continuity path: auth endpoints set a first-party `dd_auth_token` cookie in addition to returning the bearer token. Public pages can resolve the signed-in member/admin state more reliably.
- Added `movie_catalog` for staged migration of the legacy UPC-only movie JSON into D1. The public movies page now reads from `/api/movies`, which prefers D1 and falls back to `/data/catalog.json`.
- Catalog sync now supports movies in addition to tools, supplies, and featured creations.
- Public movie search UI now supports title, UPC, year, actor, and director fields when that data exists, while still working with legacy UPC-only data.
- Product CSV preview now renders as a structured validation table instead of loose JSON/text lines.
