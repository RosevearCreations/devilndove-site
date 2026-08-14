# Build 263 Changed Files

## Application
- `admin/packaging-studio/index.html`
- `public/js/admin-packaging-studio.js`
- `functions/api/admin/packaging-studio.js`

## Database
- `database_build263_packaging_my_printers_label_alignment.sql` — new
- `database_upgrade_current_pass.sql`
- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`
- `BUILD263_D1_VERIFICATION.sql` — new

## Canonical documentation
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`

## Regression maintenance
- `scripts/build263_packaging_my_printers_alignment_regression.py` — new
- `scripts/build262_packaging_material_printer_layout_regression.py`
- `scripts/build261_packaging_inventory_claims_layout_regression.py`
- `scripts/build260_media_bootstrap_runtime_regression.py`
- `scripts/build259_media_static_slot_regression.py`
- `scripts/build254_startup_smoke_runtime_regression.py`

Historical regression changes only allow newer additive migration/cache boundaries while retaining their original feature checks.
