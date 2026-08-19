# Build 275 Validation — Packaging Studio Ingredient / French / Rose Repair

## Acceptance issues

### Goat’s Milk source → Structured Ingredient Rows
PASS. Applying a purchased/source base now writes its `master_inci` composition into `packaging_project_ingredients` and updates project fallback ingredient strings. Existing pre-Build-275 projects can use **Reload from attached base**.

### French draft
PASS. The French draft helper can reconstruct missing structured rows from the attached base or INCI fallback. Common Goat’s Milk soap display terms now include curated French wording. Generated wording remains draft-only and human-reviewed; INCI remains ingredient authority.

### Claim icon spacing
PASS. Rendered claim text starts farther to the right of the icon, and editor icon/card spacing was increased.

### Soap main title type
PASS. The main soap identity/title now uses the same `Brush Script MT` / `Segoe Script` brand-script stack used by Rosevear Creations / Devil n Dove, with bold weight retained.

### Product rose direction
PASS. The Product rose direction now includes a visual quick palette of actual botanical rose assets for white, pink, cream/off-white, yellow, coral, orange, peach, green, blue, brown, black, grey, silver, gold, copper and bronze.

## Automated checks
- Build 273 CAIP / Creative Process / Content Studio test: PASS.
- Build 274 Creative Process lifecycle/correction/dashboard test: PASS.
- Build 248 Packaging Source Material regression: 85/85 PASS.
- Build 255 Packaging Material Library regression: 38/38 PASS.
- Build 261 Packaging/Inventory regression: 46/46 PASS.
- Build 262 Packaging Material/Printer/Layout regression: 22/22 PASS.
- Build 275 Packaging Label regression: 72/72 PASS.
- `node --check public/js/admin-packaging-studio.js`: PASS.
- `node --check functions/api/admin/packaging-studio.js`: PASS.
- Packaging Studio H1 count: exactly 1.
- All 16 quick-palette WebP rose assets exist and open successfully.
- `database_full_schema.sql`: executes; `PRAGMA foreign_key_check` returns 0.
- `database_schema.sql`: executes; `PRAGMA foreign_key_check` returns 0.
- `database_store_schema.sql`: executes; `PRAGMA foreign_key_check` returns 0.

## Database boundary
No Build 275 D1 migration is required. Runtime changes use existing Packaging Studio/source-material tables.

## Existing Goat’s Milk label recovery
After deployment, open the affected label and do one of the following:
1. Ingredients → **Reload from attached base**, or
2. Material Library → select the existing Goat’s Milk base → **Reapply**.

The structured rows should immediately become project-backed D1 rows. Then use **Draft French** / **Translate to French / generate draft**, review the wording, and save the project.
