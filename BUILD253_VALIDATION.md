# Build 253 Validation

## Release scope

Build 253 fixes the Inventory Operations selected-linked-item display and adds a separate full field reset action. It also preserves linked resource usage metadata when a saved tool/supply is outside the current resource search page.

**Database migration:** none. Build 250 remains the current D1 migration boundary.

## Results

- Build 253 linked-item/reset regression: **18/18 PASS**
  - D1 inventory name is preferred for saved links.
  - Catalog name is used as fallback.
  - External/source key remains a final fallback only.
  - Saved linked resource usage metadata survives outside current search results.
  - Exact `loadProductLinks` SQL executed successfully against `database_full_schema.sql` fixtures.
  - A tool fixture configured as `1 each = 100 uses` returned its real name and `100` usage conversion.
  - Separate **Start New Item** and **Clear / Reset Fields** controls are present and wired.
  - Full clear removes catalog-search and Amazon-import helper fields.
  - Mobile action-button stacking remains present.
- Build 252 Inventory Operations runtime regression: **10/10 PASS**
- Build 251 Product Editor image runtime regression: **9/9 PASS**
- Build 250 product media/per-use regression: **14/14 PASS**
- Build 249 inventory-kit/component regression: **25/25 PASS**
- JavaScript syntax checks:
  - `public/js/admin-product-resources.js`: **PASS**
  - `public/js/admin-site-item-inventory.js`: **PASS**
  - `functions/api/admin/_productResourcesData.js`: **PASS**
- Fresh `database_full_schema.sql` execution: **PASS**
- Foreign-key check after aggregate schema load: **0 violations**
- H1 sanity:
  - `/admin/inventory-operations/`: **1 H1**
  - `/admin/products/`: **1 H1**
  - `/admin/mobile-inventory/`: **1 H1**
- Cache-bust verification:
  - `admin-product-resources.js?v=253` on Inventory Operations and Products.
  - `admin-site-item-inventory.js?v=253` on Inventory Operations, Products and Mobile Inventory.

## Expected live behavior

1. Open `/admin/inventory-operations/` and select a finished product in Product Tools & Supplies Used.
2. **Selected linked item** should show the actual tool/supply name. The external/source key remains internal identity/fallback information only.
3. A linked tool with a configured stock conversion such as `1 tool = 100 uses` should keep that conversion even if the tool is not in the current 240-item resource-search page.
4. When editing an inventory record, the action row should show **Save Changes to This Item**, **Start New Item**, and **Clear / Reset Fields**.
5. **Start New Item** exits the current edit and resets the inventory entry form.
6. **Clear / Reset Fields** performs the reset and also clears helper search/Amazon-import inputs so stale entry data cannot seed the next item.

After deployment, hard-refresh the affected admin page so the browser loads the `v=253` bundles.
