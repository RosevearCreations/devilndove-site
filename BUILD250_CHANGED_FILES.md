# Build 250 changed files

- `public/js/admin-edit-product.js` — fixes Product Edit featured/gallery image load ordering.
- `public/js/admin-product-resources.js` — one-use defaults, direct visible-field synchronization, save verification handling.
- `functions/api/admin/product-resources.js` — reads persisted links back after save.
- `admin/products/index.html` — cache-busts corrected Product Edit/Product Resources scripts to v250.
- `database_build250_product_media_resource_usage_reliability.sql` — normalizes missing/non-positive historical resource usage quantities to 1.
- `database_upgrade_current_pass.sql` — Build 250 current migration.
- `database_full_schema.sql` — fresh-install authority includes Build 250 normalization.
- `scripts/build250_product_media_usage_regression.py` — Build 250 regression suite.
- `scripts/build249_inventory_kits_regression.py`, `scripts/build248_packaging_source_material_regression.py` — historical regressions accept a newer current migration.
- `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md` — Build 250 canonical handoff/status update.
