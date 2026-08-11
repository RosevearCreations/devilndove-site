# Build 249 changed files

Build 249 adds purchased-kit breakdown and general inventory classification while preserving Build 248 source-material and Packaging Studio behavior.

- `database_build249_inventory_kits_components_provenance.sql` — new inventory profile, kit template/component, kit-open provenance and inventory↔source-material link tables.
- `database_upgrade_current_pass.sql` — byte-identical current migration.
- `database_full_schema.sql` — Build 249 synchronized into the complete fresh-install aggregate. `database_schema.sql` and `database_store_schema.sql` remain scoped historical/overlay schemas and are intentionally not given Build 249 tables whose inventory dependencies they do not own.
- `functions/api/admin/inventory-kits.js` — create/edit kit breakdowns and open kits into child stock with provenance/cost allocation.
- `public/js/admin-inventory-kits.js` — Inventory Operations kit UI.
- `admin/inventory-operations/index.html` — loads the Build 249 kit workspace.
- `public/js/admin-site-item-inventory.js` — inventory class, lifecycle, lot/expiry/source-material recommendations.
- `functions/api/admin/site-item-inventory.js` — persists inventory profiles and fixes inventory-delete audit key handling.
- `public/js/admin-packaging-studio.js` — clarifies premixed fragrance/essential-oil blend handling.
- `css/styles.css` — responsive kit/component editor styles.
- `scripts/build249_inventory_kits_regression.py` — Build 249 static/schema regression.
- `scripts/build248_packaging_source_material_regression.py`, `scripts/build244_inventory_authority_fractional_usage_regression.py` — historical tests now accept a newer current migration boundary.
- `BUILD249_D1_VERIFICATION.sql`, `BUILD249_VALIDATION.md` — deployment verification and validation evidence.
- `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md` — Build 249 current authority/handoff updates.
