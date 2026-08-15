# Devil n Dove Build 264 — Changed Files

## Release focus

Build 264 expands site-content editability, adds explicit public merchandising order, adds an optional review-first Movie metadata helper, makes research/experiment Creative Projects first-class CAIP workspaces, records project inventory usage/cost, and fixes storefront image cropping/category-first Shop navigation.

## Database / deployment

- `database_build264_content_project_merchandising.sql` — additive Build 264 migration.
- `database_upgrade_current_pass.sql` — byte-identical current deployment migration.
- `database_full_schema.sql` — fresh-install aggregate updated through Build 264.
- `BUILD264_D1_VERIFICATION.sql` — read-only production verification.

## Media & Content Management Studio / Home / Shop

- `public/data/media-content-slot-catalog.json` — version 264, 30 owner-facing static/public areas and 543 explicit slots.
- `admin/media-content-studio/index.html`
- `public/js/admin-media-content-studio.js`
- `functions/api/admin/media-content-studio.js`
- `functions/api/public-media-content-manifest.js`
- `public/js/media-content-runtime.js`
- `index.html`
- `js/main.js`
- `shop/index.html`
- `public/js/shop.js`
- `public/js/recently-viewed-products.js`
- `gift-card-storefront.js`
- `assets/placeholders/media-content/home-what-we-make-2.svg`
- `assets/placeholders/media-content/home-what-we-make-3.svg`
- `css/styles.css`

## Public display / merchandising order

- `admin/public-display-order/index.html` — owner-facing Home Featured / Art-Gallery / Creations order control.
- `public/js/admin-public-display-order.js`
- `functions/api/admin/public-display-order.js`
- `functions/api/featured-products.js`
- `functions/api/creations.js`
- `gallery/index.html`
- `creations/index.html`
- `admin/index.html` — adds Public Display Order department link.

## Full-frame storefront product images

- `public/js/site-search.js`
- `public/js/cart-page.js`
- `public/js/product-detail.js`
- `public/js/member-wishlist.js`
- retained duplicate/root bundles where still referenced: `site-search.js`, `cart-page.js`, `product-detail.js`, `member-wishlist.js`

## Movie metadata helper

- `admin/movies/index.html`
- `public/js/admin-movie-catalog.js`
- `functions/api/admin/movies.js`
- `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md` — documents optional `TMDB_READ_ACCESS_TOKEN` and commercial-use/attribution review requirement.

## Creative Process / CAIP / project cost context

- `admin/creative-process/index.html`
- `public/js/admin-creative-process.js`
- `functions/api/admin/creative-process.js`
- `admin/creative-assets/index.html`
- `public/js/admin-caip-media-intake.js`

## Canonical project documentation / regression

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `scripts/build264_content_project_merchandising_regression.py`
- `BUILD264_VALIDATION.md`
- `BUILD264_CHANGED_FILES.md`

## Generated audit artifacts refreshed during validation

- `data/site/build246-public-page-audit.json`
- `data/site/build246-asset-reference-audit.json`
