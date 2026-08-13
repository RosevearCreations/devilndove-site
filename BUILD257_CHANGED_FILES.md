# Build 257 Changed Files

Build 257 narrows Media & Content Management Studio to static website presentation content and replaces typed public-page paths with a curated page/area directory. It is a **code-only release**; the D1 migration boundary remains Build 256.

## Core Media Studio

- `admin/media-content-studio/index.html`
  - Removes the owner-facing manual page-path field.
  - Adds a curated static-page selector, common-page shortcuts and sitewide Header/Navigation, Footer and Background controls.
  - Adds Home Banner/Hero and section filters.
  - Removes Product media type and product R2 sync options.
  - Adds explicit specialist-ownership guidance for Product Editor and Inventory Operations.
- `public/js/admin-media-content-studio.js`
  - Loads the Build 257 page catalog.
  - Supports sitewide `@site` controls.
  - Ignores dynamic product/catalog/inventory mounts during page inspection.
  - Filters discovered slots into static Banner/Hero, Main Content, Gallery/Showcase, Background, Header/Nav and Footer groups.
  - Removes product-specific media workflows from this Studio.
- `functions/api/admin/media-content-studio.js`
  - Server-side filters product-linked media, blocked specialist source types and product/inventory/supply/tool R2 prefixes.
  - Refuses blocked specialist page paths and ineligible media assignments.
  - Removes `products/` from approved R2 Media Studio sync prefixes.
- `functions/api/public-media-content-manifest.js`
  - Returns shared `@site` assignments plus the current page.
  - Orders shared defaults first and page-specific overrides second.
- `public/js/media-content-runtime.js`
  - Build 257 public runtime marker/cache boundary.

## Static page catalog

- `public/data/media-content-page-catalog.json` **NEW**
  - 29 curated static/public owner-facing pages grouped by site area.
  - Deliberately excludes Shop/Product, Inventory, Supplies, Tools and other operational/specialist screens.
- `scripts/build_media_content_page_catalog.py` **NEW**
  - Validates that every curated page maps to an actual static `index.html` and detects duplicates.
- `scripts/build257_media_static_scope_regression.py` **NEW**
  - Regression coverage for static-only scope, sitewide controls, page directory, cache versions, public manifest ordering, JS syntax and schema compatibility.
- `scripts/build256_media_packaging_regression.py`
  - Historical compatibility assertion updated to accept the newer Build 257 cache/version boundary while preserving Build 256 feature checks.

## Styling and site runtime

- `css/styles.css`
  - Adds responsive page-directory, quick-area, sitewide control and ownership-boundary styles.
- 56 non-admin public HTML entry points
  - Cache-bump `media-content-runtime.js` from `v=256` to `v=257`; no authored public content/images were otherwise changed by this release.

## Canonical documentation

- `AI_HANDOFF.md`
  - Current code release moved to Build 257; D1 migration boundary explicitly remains Build 256.
  - Documents the static-only Media Studio ownership boundary and `@site` authority.
- `PROJECT_STATUS_AND_ROADMAP.md`
  - Adds Build 257 completed work and current next steps.
- `docs/archive/build-history/BUILD256_CHANGED_FILES.md`
- `docs/archive/build-history/BUILD256_VALIDATION.md`
  - Build 256 release evidence archived; it no longer competes with the current Build 257 release pair.

## Database

No Build 257 D1 migration exists or should be applied. Existing Build 256 tables already support the required static slots and the internal `@site` page key. `database_upgrade_current_pass.sql` remains byte-identical to `database_build256_media_content_studio.sql`.
