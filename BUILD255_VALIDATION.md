# Build 255 Validation

## Owner-reported issue addressed
`/admin/packaging-studio/` had stale Build 248 CSS/JavaScript asset URLs and the purchased/source-material feature was difficult to discover. Build 255 exposes a first-class **Material Library** even when no packaging project is selected, and explicitly cache-busts Packaging Studio assets to `v=255`.

## Material Library behavior
- Product families: Soap, Candles, Bath & body, Home fragrance, Cosmetic/body, General, Other.
- Source categories: Soap base, Candle wax/wax blend, Cosmetic/body base, Fragrance oil/blend, Essential-oil blend, Colourant/dye, Mica/pigment, Carrier oil/butter, Botanical/extract, Additive, Other.
- Each purchased/source template owns its supplier identity, supplier ingredient declaration, independent Master INCI/source ingredient rows, optional colour swatch, allergen evidence, benefits, claims, fragrance-allergen evidence and review notes.
- Base-role materials (including soap base and candle wax) replace the current base rows when applied; fragrance, colour and additive sources append their rows.
- Finished formula/recipe presets may retain the attached base source.
- `packaging_project_ingredients` and `packaging_project_claims` preserve structured rows for soap, candles and other package types; soap legacy tables remain mirrored for compatibility.

## Validation results
- Build 255 Packaging Material Library regression: **38/38 PASS**.
- Build 254 Startup/Smoke runtime regression: **16/16 PASS**.
- Build 253 linked-item/reset regression: **18/18 PASS**.
- Build 252 inventory unit-preset runtime regression: **10/10 PASS**.
- Build 251 Product Editor image runtime regression: **9/9 PASS**.
- Build 250 product media/per-use regression: **14/14 PASS**.
- Build 249 inventory kit/component regression: **25/25 PASS**.
- Build 247 Packaging Studio regression: **43/43 PASS**.
- Build 246 product/project/packaging lifecycle regression: **PASS**.
- Public-page audit: **36/36 passed, 0 warnings, 0 failed**.
- Asset-reference audit: **121 references, 0 missing**.
- `public/js/admin-packaging-studio.js`: `node --check` **PASS**.
- `functions/api/admin/packaging-studio.js`: `node --check` **PASS**.
- CSS opening/closing brace counts: **matched**.
- `database_full_schema.sql` fresh execution: **PASS**.
- Build 255 migration reapplied twice after fresh schema: **PASS / idempotent**.
- `PRAGMA foreign_key_check`: **0 violations**.
- Seed Goat's Milk source metadata: **Soap / Soap Base / Base**, **9** source ingredient rows.
- `database_upgrade_current_pass.sql` and `database_build255_packaging_material_library_hub.sql`: **byte-identical**.

## Deployment boundary
Build 255 **does require a D1 migration**. Back up production D1 first. Confirm the previous Build 254 migration is present, then apply **one** of:

- `database_build255_packaging_material_library_hub.sql`
- `database_upgrade_current_pass.sql`

Do not apply both; they contain the same Build 255 migration. Then run `BUILD255_D1_VERIFICATION.sql` read-only and deploy the complete package.

After deployment hard-refresh `/admin/packaging-studio/` and confirm the browser requests:
- `/css/styles.css?v=255`
- `/public/js/admin-packaging-studio.js?v=255`

## First production check
Open Packaging Studio without selecting a label. Confirm **Material Library** is visible. Create or edit a purchased material (for example one soap base or candle wax), add its supplier ingredient rows, save, reload the page and verify the template, classification and Master INCI rows survive reload. Then attach it to a test label and confirm a base replaces base rows while a fragrance/colour/additive appends rows.
