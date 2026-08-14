# Build 257 Validation

**Release:** Build 257 — Static-only Media Studio and automatic site directory  
**D1 migration boundary:** Build 256 (`database_build256_media_content_studio.sql`)  
**Build 257 migration:** None

## Requested behavior validated

- Media & Content Management Studio no longer exposes Product as a media type.
- Product-linked media (`product_id`) is excluded server-side.
- Media sourced/typed as product, inventory, supply/supplies or tool/tools is excluded server-side.
- R2 keys under product/inventory/supply/tool/tool-shed prefixes are excluded and cannot be synchronized through this Studio.
- Dynamic product/catalog/inventory mounts are ignored during page inspection.
- Manual owner-facing public-page URL entry is removed.
- A curated directory of 29 known static/public pages is loaded from repository data.
- Friendly quick choices include Home, About, Gallery, Showcase / Creations and Workshop / Workroom.
- Shared Header & Navigation, Footer and Site Backgrounds are first-class sitewide areas.
- Home Banner / Hero is a direct page-area choice.
- Public manifest loads shared `@site` assignments before page-specific assignments so page-specific overrides win.
- Product Editor and Inventory Operations remain the specialist authorities for products, inventory, supplies and tools.

## Regression results

- Build 257 static-scope regression: **37/37 PASS**
- Build 256 Media/Packaging regression: **52/52 PASS**
- Build 255 Packaging Material Library regression: **38/38 PASS**
- Build 254 Startup/Smoke runtime regression: **16/16 PASS**
- Build 253 linked-item/reset regression: **18/18 PASS**
- Build 252 inventory unit-preset regression: **10/10 PASS**
- Build 251 Product Editor image regression: **9/9 PASS**
- Build 250 product media/per-use regression: **14/14 PASS**
- Build 249 kit/component inventory regression: **25/25 PASS**
- Build 246 public page audit: **36/36 PASS; 0 warnings; 0 failures**
- Build 246 asset-reference audit: **121 references; 0 missing**

## Static page catalog audit

`python scripts/build_media_content_page_catalog.py`

- Catalog pages: **29**
- Missing static page files: **0**
- Duplicate page paths: **0**

## JavaScript/runtime checks

`node --check` passes for:

- `public/js/admin-media-content-studio.js`
- `public/js/media-content-runtime.js`
- `functions/api/admin/media-content-studio.js`
- `functions/api/public-media-content-manifest.js`

All 56 non-admin HTML entry points that already used the public Media Studio runtime now request `media-content-runtime.js?v=257`.

## Database checks

Build 257 is code-only. The existing Build 256 schema was executed through all three aggregate schema authorities used by the project:

- `database_full_schema.sql` — PASS; foreign-key check clean
- `database_schema.sql` — PASS; foreign-key check clean
- `database_store_schema.sql` — PASS; foreign-key check clean

`database_upgrade_current_pass.sql` remains the Build 256 migration and should **not** be reapplied merely because Build 257 code is deployed if Build 256 was already installed.

## First live verification recommended

1. Deploy the complete Build 257 code package.
2. Hard-refresh `/admin/media-content-studio/` and confirm `admin-media-content-studio.js?v=257`.
3. Confirm Product/Inventory/Supply/Tool media do not appear in Studio results.
4. Choose **About** from the directory without typing a URL; verify only static presentation slots are discovered.
5. Choose **Header & Navigation**, make one reversible test assignment/text change, and verify it appears on two public pages.
6. Remove/unpublish the test change and confirm authored content returns.
7. On Gallery or Showcase, verify live product/catalog cards are not registered as Media Studio slots.
