# Development Roadmap

## Current completed foundations

- CSV-first product mass upload foundation with downloadable template and required/optional field guidance
- staged D1 migration foundation for tools, supplies, and featured creations through `catalog_items` and admin sync tooling

- auth and session model
- member orders and downloads
- admin users and security tools
- checkout and order creation
- PayPal handoff
- PayPal return capture
- PayPal webhook reconciliation
- Stripe hosted checkout session creation
- Stripe webhook reconciliation
- webhook event idempotency log foundation
- webhook review and manual replay queue admin tooling
- analytics and visitor monitoring foundation
- product SEO tools
- sitewide public SEO metadata refresh and explicit H1 policy baseline
- public site search page plus search-event logging foundation
- product media workflow foundation
- direct admin image upload endpoint for R2 media
- uploaded asset browser and delete foundation in admin
- site inventory and reorder foundation
- deeper site inventory fields for reserved, incoming, supplier, and cost tracking
- inventory movement history foundation
- refund and dispute workflow logging foundation in admin
- import preview validation improvements for duplicate slugs and malformed media URLs
- shared auth token fallback so the outward-facing site and admin area resolve the same active login more reliably
- shared footer/widget layout hardening across standard pages
- admin dashboard formatting refresh with cleaner summary cards and a live activity feed

## Strongest next steps after this pass

1. webhook retry, replay, and dispatch hardening worker flow beyond admin requeue
2. storefront and admin refund and dispute workflows with provider sync confirmation
3. direct media replace polish, thumbnail and variant generation, and featured-image suggestions
4. deeper inventory operations for products, tools, and supplies with movement history UX
5. product import seeding refinement and richer row-by-row validation UX
6. richer analytics dashboards and funnel reporting
7. continue public search-engine awareness improvements on every outward-facing pass
8. continue staged migration of high-value JSON collections into D1 for unified search, analytics, and inventory automation

## Media-specific roadmap

- uploaded asset gallery and browser in admin ✅ foundation added
- image delete and reorder UI polish ✅ partial
- thumbnail and variant handling
- tighter annotation-to-storefront usage
- optional automatic featured-image suggestion from uploaded media

## Payment-specific roadmap

- webhook replay safety admin tooling ✅ partial foundation added
- idempotency review dashboard using `webhook_events` ✅ partial foundation added
- provider retry logging and admin resend tools ✅ partial foundation added
- refund and dispute workflows ✅ local foundation added
- optional Stripe customer portal and saved customer records later

## Public SEO and search roadmap

- one-H1 policy on all outward-facing pages ✅ baseline refreshed
- canonical, robots, Open Graph, and Twitter tags on outward-facing pages ✅ baseline refreshed
- noindex coverage on utility and private pages ✅ baseline refreshed
- sitemap coverage for public collections and search page ✅ refreshed
- structured data on home and major public pages ✅ baseline refreshed
- continue improving crawl, discovery, and query-awareness each pass


## Data model caution now worth planning

- the search page still blends live database products with JSON-driven tools, supplies, and creations
- if the long-term plan is unified search, richer analytics, and inventory automation, migrating high-value JSON collections into D1 is now the right time to start while scope is still manageable


## Current pass additions
- Session/auth now uses a stronger same-site continuity path: auth endpoints set a first-party `dd_auth_token` cookie in addition to returning the bearer token. Public pages can resolve the signed-in member/admin state more reliably.
- Added `movie_catalog` for staged migration of the legacy UPC-only movie JSON into D1. The public movies page now reads from `/api/movies`, which prefers D1 and falls back to `/data/catalog.json`.
- Catalog sync now supports movies in addition to tools, supplies, and featured creations.
- Public movie search UI now supports title, UPC, year, actor, and director fields when that data exists, while still working with legacy UPC-only data.
- Product CSV preview now renders as a structured validation table instead of loose JSON/text lines.
