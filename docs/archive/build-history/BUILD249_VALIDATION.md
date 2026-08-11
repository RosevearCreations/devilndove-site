# Build 249 validation

Build 249 extends the current inventory authority with purchased-kit decomposition, component provenance, inventory classification and cost allocation while retaining Build 248 source-material/Packaging Studio behavior.

## Passed checks

- Build 249 inventory-kit regression: **25/25**.
- Build 248 Packaging Studio/source-material compatibility regression: **85/85**.
- Build 244 D1 inventory authority/fractional-usage regression: **PASS**; 897 legacy master records remain represented (399 tools + 498 supplies), with no TEMP/DROP migration operations.
- Build 246 product/project/packaging lifecycle regression: **PASS**.
- Public-page audit: **36/36 passed**, zero warnings/failures.
- Asset-reference audit: **121 references, zero missing**.
- JavaScript syntax: `inventory-kits.js`, Inventory Operations UI/API, and Packaging Studio changed files parse successfully with Node.
- `database_full_schema.sql`: executes in clean SQLite with zero foreign-key violations.
- `database_schema.sql` and `database_store_schema.sql`: remain internally executable scoped schemas with zero foreign-key violations. Build 249 is intentionally not appended to these incomplete historical overlays because they do not own the `site_item_inventory` dependency.
- Build 249 migration executes repeatedly after the full aggregate schema and remains idempotent.
- `database_upgrade_current_pass.sql` is byte-identical to `database_build249_inventory_kits_components_provenance.sql`.

## Behavior validated

1. A purchased kit remains a parent inventory/provenance record until deliberately opened.
2. Kit templates can contain existing inventory items or create child items on first opening.
3. Opening a kit reduces only the parent kit count and increments each child balance independently.
4. Consumable children can later be consumed by product/project resource workflows; reusable child tools remain reusable/evidence-only.
5. Equal cost allocation is supported when component values are unknown; percentage allocation requires approximately 100% total.
6. Existing child inventory receives weighted-average unit cost instead of destructive cost overwrite.
7. Kit opening writes parent/child movement evidence and immutable kit-open provenance records.
8. Main inventory now classifies raw material, consumable, packaging, reusable equipment, kit, component, finished good, sample/test material, waste/scrap and other.
9. Lot, expiry and source-material recommendations are stored as profile metadata while the existing lot tables remain the lot authority.
10. Premixed essential/fragrance oil is represented as one purchased inventory item; supplier-listed constituents/INCI/allergen evidence remain in Packaging Source Materials.
11. Inventory deletion audit no longer references the undefined `merged` variable in the DELETE path.

## Production checks still required

- Back up production D1 before applying Build 249.
- Confirm Build 248 is already present, then apply `database_build249_inventory_kits_components_provenance.sql` once.
- Run `BUILD249_D1_VERIFICATION.sql` and review foreign-key output.
- Create one real candle-kit template from an existing purchased kit and open **one** kit first.
- Confirm physical counts and allocated component costs before opening the remainder.
- For fragrance/essential-oil blends, enter supplier composition/INCI/allergen documentation in Packaging Studio before relying on it for label generation.
