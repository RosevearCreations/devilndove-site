# Build 263 Validation

## Scope
Build 263 removes Inventory/history-derived printers from Packaging Studio, adds persistent **My Printers** records with one default label printer, and moves the soap front wording block closer to the botanical rose with a left-justified text block.

## Validation results
- Build 263 My Printers / oval regression: **15/15 PASS**
- Build 262 Packaging material/printer/layout regression: **22/22 PASS**
- Build 261 Packaging/Inventory/Claims regression: **46/46 PASS**
- Build 255 Packaging Material Library regression: **38/38 PASS**
- Build 249 Kit/Component inventory regression: **25/25 PASS**
- Build 250 product media/use-batch regression: **14/14 PASS**
- Build 251 Product Editor image runtime regression: **9/9 PASS**
- Build 252 Inventory unit runtime regression: **10/10 PASS**
- Build 253 linked-item/reset regression: **18/18 PASS**
- Build 254 Startup/Smoke runtime regression: **16/16 PASS**
- Build 259 Media Studio slot regression: **98/98 PASS**
- Build 260 Media Studio runtime regression: **21/21 PASS**
- Public page audit: **36/36 PASS; 0 warnings; 0 failures**
- Asset reference audit: **149/149 present; 0 missing**
- `public/js/admin-packaging-studio.js`: JavaScript syntax **PASS**
- `functions/api/admin/packaging-studio.js`: JavaScript syntax **PASS**

## Database validation
`database_build263_packaging_my_printers_label_alignment.sql` was applied twice over each aggregate schema:
- `database_full_schema.sql`: **PASS**, 0 foreign-key violations
- `database_schema.sql`: **PASS**, 0 foreign-key violations
- `database_store_schema.sql`: **PASS**, 0 foreign-key violations

The migration creates:
- `packaging_printer_profiles`
- `idx_packaging_printer_profiles_active_default`
- `ux_packaging_printer_profiles_one_default`
- migration ledger entry `build263_packaging_my_printers`

`database_upgrade_current_pass.sql` is byte-identical to the standalone Build 263 migration.

## Behavior checked
- Packaging Studio no longer queries Inventory for printer names.
- Old print-test printer names do not populate the current printer dropdown.
- Browser-local Build 262 profile lists no longer define the dropdown.
- Only active **My Printers** D1 rows populate Print Test.
- One printer can be marked **Default for labels**; database/API logic prevents multiple active defaults.
- Default printer settings include paper, margin, gap, scale, auto-rotation, and driver/settings notes.
- My Printers entries can be saved/updated and removed.
- Packaging Studio assets are cache-busted to `v=263`.
- Soap rose is slightly enlarged/repositioned and the adjacent wording block starts closer to it.
- Front family/product/subtitle/origin wording uses a left-justified block rather than independent centered text.

## Migration SHA-256
`0c9d441a62905a019ac79f284ca70458c9e8af62ff3fdee39d11d8fdd2202aeb`
