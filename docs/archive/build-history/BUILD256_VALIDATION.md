# Build 256 Validation

## Result

**PASS — Build 256 release package validated locally against the supplied live-server ZIP.**

## Build 256 focused regression

`scripts/build256_media_packaging_regression.py`

- **52/52 checks passed**
- Amazon material draft UI/API present for soap base, essential-oil blend and colourant/mica categories.
- Remote Amazon response is bounded before parsing.
- Amazon fields remain review-first and source Master INCI rows remain independent from the active label.
- `soap_reference_v3` has five fixed zones with independent clipping.
- Media Studio admin/API/public manifest/runtime present.
- Explicit assignment precedence and safe-delete/archive checks present.
- Same-key replacement preserves media identity/placements and requires admin step-up.
- Public page runtime installed on at least 50 existing non-admin HTML entry points.
- Build 256 migration/current-pass identity and idempotency verified.

## Retained regression suites

- Build 255 Packaging Material Library: **38/38 PASS**
- Build 254 Startup/Smoke runtime: **16/16 PASS**
- Build 253 linked-item/reset inventory: **18/18 PASS**
- Build 252 inventory unit-preset runtime: **10/10 PASS**
- Build 251 Product Editor image runtime: **9/9 PASS**
- Build 250 product media/per-use persistence: **14/14 PASS**
- Build 249 kit/component inventory: **25/25 PASS**
- Build 248 Packaging/source-material: **85/85 PASS**
- Build 247 Packaging Studio: **43/43 PASS**
- Build 244 inventory authority/fractional usage: **PASS** after making the historical release-boundary assertion accept Build 256 as a newer migration.
- Build 246 product/project/packaging lifecycle: **PASS**

## Public/static audits

- Build 246 public-page audit: **36/36 passed, 0 warnings, 0 failures**
- Asset-reference audit: **121 references, 0 missing**

## JavaScript/runtime syntax

Node syntax checks pass for:

- `functions/api/admin/amazon-link-preview.js`
- `functions/api/admin/media-content-studio.js`
- `functions/api/admin/media-content-replace.js`
- `functions/api/public-media-content-manifest.js`
- `public/js/admin-media-content-studio.js`
- `public/js/admin-packaging-studio.js`
- `public/js/media-content-runtime.js`

## Database validation

All three aggregate schema authorities execute successfully with Build 256 included:

- `database_schema.sql`
- `database_store_schema.sql`
- `database_full_schema.sql`

For each aggregate schema:

- Build 256 migration objects are present.
- `PRAGMA foreign_key_check` returns **0 violations**.
- Build 256 migration is idempotent in the focused regression fixture.
- `schema_migration_ledger` retains one `build256_media_content_studio` row.
- `database_upgrade_current_pass.sql` is byte-identical to `database_build256_media_content_studio.sql`.

## Important live verification after deployment

Local validation cannot prove production Amazon HTML availability, production R2 permissions, or the physical printed appearance of a real long-ingredient soap label. After deploy:

1. Apply Build 256 D1 migration and run `BUILD256_D1_VERIFICATION.sql`.
2. Hard-refresh Packaging Studio and confirm `v=256` assets.
3. Test one real Amazon soap-base link and review every imported field before saving.
4. Open an existing soap and compare the five-zone preview to the approved reference; perform one Actual Size / 100% print check before relying on it for production.
5. In Media Studio, inspect/register one reversible page first. Assign one image, confirm only that placement changes, remove the assignment and confirm authored content returns.
6. Test one text draft without publishing, then publish and unpublish it.
7. Use R2 Sync explicitly and confirm it discovers/refreshes media without changing existing assignments.

## Scope note

Build 256 is the first production-safe implementation of the supplied Media & Content Management Studio specification. Later gallery/version/rollback/direct Packaging-artwork-picker phases remain explicitly tracked in the canonical roadmap.
