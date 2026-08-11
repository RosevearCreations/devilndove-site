# Build 253 Changed Files

Build 253 is a code/UI reliability release for Inventory Operations and Product Resource links. It requires **no D1 migration**; the current database migration boundary remains Build 250.

## Product-resource linked-item naming

- `functions/api/admin/_productResourcesData.js`
  - Resolves each saved link's human-readable name from `site_item_inventory.item_name`, with `catalog_items.name` fallback and the external/source key only as a last resort.
  - Returns linked stock/usage metadata so items outside the current resource-search page retain their configured usage conversion and cost context.
  - Uses a bounded single-row inventory/catalog lookup so historical duplicate/inactive records cannot duplicate product-resource links.
- `public/js/admin-product-resources.js`
  - Preserves the server-provided linked resource/name when the item is not present in the current resource-search result.
  - Keeps the external key as identity/fallback, not the normal selected-item label.

## Inventory form controls

- `public/js/admin-site-item-inventory.js`
  - Keeps **Start New Item** as a distinct action.
  - Adds **Clear / Reset Fields** as a separate explicit action.
  - Full clear also removes catalog-search and Amazon-import helper values before the next inventory entry.

## Cache-bust / affected pages

- `admin/inventory-operations/index.html`
- `admin/products/index.html`
- `admin/mobile-inventory/index.html`
  - Product Resources and/or Inventory Operations shared bundles now request `?v=253` where used.

## Documentation / regression maintenance

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `MARKDOWN_INDEX.md`
  - Current release advanced to Build 253; D1 boundary remains Build 250.
- `scripts/build253_inventory_link_labels_reset_regression.py`
  - New Build 253 regression, including execution of the exact linked-resource SQL against the full aggregate schema.
- `scripts/build252_inventory_unit_preset_runtime_regression.py`
- `scripts/build250_product_media_usage_regression.py`
  - Historical cache-version assertions now accept later compatible bundle versions instead of falsely failing when a newer release is deployed.

## Release evidence

- `BUILD253_CHANGED_FILES.md`
- `BUILD253_VALIDATION.md`
