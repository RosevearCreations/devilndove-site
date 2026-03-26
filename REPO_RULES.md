# Repo Rules

- Keep all schema files and Markdown docs in sync with the current build state.
- When payment flow changes, update both code and the database and payment documentation together.
- When media workflow changes, update both admin UI notes and deployment binding notes together.
- Prefer additive changes that preserve working storefront and admin behavior.
- Keep checkout order creation separate from provider-specific payment preparation.
- Treat webhook processing as idempotent, reviewable, and safely replayable.
- Do not remove working PayPal paths when improving Stripe paths.
- Keep product media compatible with both pasted URLs and uploaded R2 assets.
- Keep refund and dispute logging local-first until provider sync is explicitly implemented.
- Keep inventory changes consistent across products, tools, and supplies.
- Inventory quantity changes should log a movement record whenever practical.
- Use full-file updates for schema and docs when making major pass changes.
- Every outward-facing page must have exactly one H1.
- Every outward-facing page must ship with a title, meta description, canonical URL, and clear robots intent.
- Private utility pages should normally remain `noindex`.
- Review sitemap, robots.txt, and public search visibility on every pass that touches public pages.
- Treat public search awareness as an ongoing improvement requirement for future updates.
- Keep a visible shared footer on every page unless a page is intentionally standalone.
- Keep the shared logged-in account widget available on every page.
- Logged-out account UI should continue to expose login, forgot-password, and forgot-email paths.

- A valid admin/member session should remain visible across both the admin area and the outward-facing site.
- Shared auth should not depend on one storage mechanism alone; keep a reliable session fallback for standard pages.
- Footer injection is part of baseline shared layout and should remain visible after every pass.
- Keep outward-facing pages visually consistent with uniform input, table, and card styling.

- Keep product mass upload template, field rules, and import validation aligned whenever import fields change.
- Continue staged migration of duplicated JSON collections into D1 when it reduces search, inventory, or analytics failure points.
- Outward-facing collection pages should prefer live database-backed catalog data when available, with JSON fallback only as a safety net during migration.
- Keep structured data aligned with visible page content and avoid marking up hidden or misleading content.
- Keep canonical intent, robots intent, favicon support, and public search discoverability aligned with current Google Search guidance on every outward-facing SEO pass.


## Current pass additions
- Session/auth now uses a stronger same-site continuity path: auth endpoints set a first-party `dd_auth_token` cookie in addition to returning the bearer token. Public pages can resolve the signed-in member/admin state more reliably.
- Added `movie_catalog` for staged migration of the legacy UPC-only movie JSON into D1. The public movies page now reads from `/api/movies`, which prefers D1 and falls back to `/data/catalog.json`.
- Catalog sync now supports movies in addition to tools, supplies, and featured creations.
- Public movie search UI now supports title, UPC, year, actor, and director fields when that data exists, while still working with legacy UPC-only data.
- Product CSV preview now renders as a structured validation table instead of loose JSON/text lines.

- Footer must render on every outward-facing and member/admin page through the shared layout unless a page explicitly documents why it is excluded.
- Continue improving search awareness every pass: strengthen crawl paths, keep one visible H1 on outward-facing pages, and prefer database-backed shared datasets over duplicated JSON whenever scope allows.


## Movie enrichment files
- Keep legacy `/data/catalog.json` untouched if needed for fallback, but place richer movie metadata in `/data/movies/movie_catalog_enriched.json`.
- Use one record per movie and match by UPC where possible.

## Outward-facing SEO rule
- Every outward-facing page must continue to have exactly one H1.
- Each outward-facing pass should also improve crawl/discovery/search clarity where practical.


## Current pass update
- Movie catalog wiring now blends D1 `movie_catalog`, `/data/movies/movie_catalog_enriched.json`, and the R2-hosted cover images more safely.
- Movie search now supports title, UPC, year, actor, director, genre, studio, format, and optional trailer-link filtering.
- `trailer_url` is now part of the movie enrichment path so trailer support can be stored directly when available.
- Storefront product detail now includes linked tools and supplies from `product_resource_links` so each finished product can tell a clearer “made with these materials and tools” story.
- Admin product-resource linking now supports usage notes for story-building and social-post context.
- Admin inventory can now sync tool and supply records from `catalog_items` into `site_item_inventory`, reducing duplicate maintenance between JSON, catalog, and inventory records.
- Continue the one-H1-per-exposed-page rule and continue improving page titles, descriptions, canonical tags, crawl paths, structured data relevance, and visible on-page content alignment on every outward-facing pass.


## Ongoing rule additions

- Keep every outward-facing page to a single H1 only.
- Continue improving crawl, discovery, and search intent on every outward-facing pass.
- When public media or catalog data already exists in R2 or D1, do not regress pages back to placeholder local paths or sample JSON records.
