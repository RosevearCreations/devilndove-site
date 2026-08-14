# Build 261 Changed Files

Build 261 was developed from Build 260. There is **no Build 261 D1 migration**.

## Packaging Studio

- `functions/api/admin/packaging-studio.js`
  - Build 261 API contract;
  - richer Inventory/source-material projection;
  - joins inventory descriptions/catalog/source-template linkage;
  - excludes tools from packaging component inventory choices;
  - can bind a saved Material Library template back to the selected inventory item;
  - accepts `soap_reference_v3` and makes it the current soap layout profile.

- `public/js/admin-packaging-studio.js`
  - Components & Cost converted from overlapping table to responsive component cards;
  - Inventory type-to-search control is first;
  - inventory selection fills known component facts;
  - Material Library becomes inventory-first with Amazon as fallback;
  - reusable Claims library surfaced directly in Claims tab with icons;
  - custom reusable claim editor added;
  - soap `reference-v3` renderer tightens title, ingredient, claim, and net-weight geometry.

- `css/styles.css`
  - responsive component-card layout;
  - responsive claim-card/editor layout;
  - Material Library inventory/import controls;
  - v3 soap preview sizing and narrow-screen handling.

- `admin/packaging-studio/index.html`
  - CSS/JavaScript cache bust to Build 261.

## Inventory → Packaging source reuse

- `public/js/admin-site-item-inventory.js`
  - preserves `packaging_source_draft` returned by Amazon/source preview for source-material-recommended inventory items;
  - sends the draft on save so it can be reused later instead of discarded;
  - clears stale draft state when resetting/opening unrelated records.

- `functions/api/admin/site-item-inventory.js`
  - persists a captured source-material draft into the existing Packaging Material Library tables when appropriate;
  - links the source template to the authoritative inventory record;
  - refuses to silently overwrite an already linked/reviewed source template.

- `admin/inventory-operations/index.html`
- `admin/products/index.html`
- `admin/mobile-inventory/index.html`
  - inventory bundle cache bust to Build 261.

## Canonical project documentation

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
  - identify Build 261 as current code while retaining Build 259 as the current D1 migration boundary;
  - document Inventory-first Packaging, Claims library placement, and soap reference-v3 behavior.

## Regression maintenance

- `scripts/build261_packaging_inventory_claims_layout_regression.py` — new Build 261 focused regression.
- `scripts/build248_packaging_source_material_regression.py` — current-handoff assertion updated without weakening Build 248 feature checks.
- `scripts/build253_inventory_link_labels_reset_regression.py` — cache-bust assertion accepts the newer Build 261 inventory bundle.
- `scripts/build255_packaging_material_library_regression.py` — accepts current Build 261 authority while retaining Build 255 feature checks.

## Database

No schema file changed for Build 261. Current migration remains:

- `database_build259_media_static_slot_catalog.sql`
- `database_upgrade_current_pass.sql` (byte-identical)
