# Build 255 Changed Files

Build 255 makes the Packaging Studio Material Library visible and usable as the single reusable source-material entry point for soap, candles, bath/body, home fragrance and other labelled products.

## Application / UI
- `admin/packaging-studio/index.html` — cache-busts Packaging Studio CSS/JS to `v=255`.
- `public/js/admin-packaging-studio.js` — adds the always-available Material Library hub, source-product families/categories, independent source Master INCI rows, supplier evidence editor, colour swatches, base/addition behavior, and general formula wording.
- `css/styles.css` — explicit Material Library/source-card/source-editor grid, table and mobile CSS.

## API / schema
- `functions/api/admin/packaging-studio.js` — Build 255 API; persists source metadata, supports base roles beyond soap, and reads/writes structured ingredients/claims for all packaging project types while retaining soap compatibility.
- `database_build255_packaging_material_library_hub.sql` — additive/idempotent D1 migration for source-material family/subtype/role metadata plus general packaging ingredient/claim tables and soap backfill.
- `database_upgrade_current_pass.sql` — byte-identical Build 255 current migration.
- `database_full_schema.sql` — fresh-install authority includes Build 255 tables/settings/ledger.
- `BUILD255_D1_VERIFICATION.sql` — read-only production verification queries.

## Documentation / tests
- `PACKAGING_STUDIO.md` — explains exactly where to enter soap bases, candle waxes, oils, colours, additives, supplier composition and Master INCI.
- `AI_HANDOFF.md` — current Build 255 handoff and Material Library authority rule.
- `PROJECT_STATUS_AND_ROADMAP.md` — Build 255 completion/status entry.
- `scripts/build255_packaging_material_library_regression.py` — 38-check Build 255 regression.
- `scripts/build254_startup_smoke_runtime_regression.py` — historical regression now accepts Build 255 as a newer current migration while continuing to validate Build 254 behavior.
