# Build 262 Changed Files

## Release focus

Build 262 refines Packaging Studio only. It is a code-only release; the D1 migration boundary remains Build 259.

## Application files

- `admin/packaging-studio/index.html`
  - Cache-bumps Packaging Studio CSS/JavaScript to `v=262`.
- `public/js/admin-packaging-studio.js`
  - Material Library now shows only the active source template selected from a dropdown.
  - Reusable ingredients / fragrance-essential-oil blends / colourants now use a dropdown and active record rather than an expanded card wall.
  - Adds saved/inventory printer profiles, Letter-sheet packing, print history printer name, and optimized multi-label printing.
  - Refines soap ribbon ingredient/claim/title/rose/seal geometry and swaps ingredient languages to French-left / English-right.
- `functions/api/admin/packaging-studio.js`
  - Reports Build 262.
  - Returns likely printer inventory records.
  - Synchronizes source-template Master INCI rows to reusable individual ingredients and promotes saved fragrance/colourant source templates to reusable content choices.
- `css/styles.css`
  - Adds active Material Library card, reusable-content and printer/sheet-plan responsive styling.

## Documentation / regression

- `AI_HANDOFF.md`
  - Current release updated to Build 262 with active-library, reusable-source-content and printer-layout rules.
- `PROJECT_STATUS_AND_ROADMAP.md`
  - Adds Build 262 completed work and physical-print next checks.
- `scripts/build262_packaging_material_printer_layout_regression.py`
  - New Build 262 regression coverage.
- `scripts/build261_packaging_inventory_claims_layout_regression.py`
  - Historical regression made forward-compatible with Build 262 cache/geometry wording.
- `scripts/build249_inventory_kits_regression.py`
  - Historical essential-oil wording check made forward-compatible with current blend terminology.
- `BUILD262_VALIDATION.md`
- `BUILD262_CHANGED_FILES.md`

## Database

No Build 262 migration was introduced.

Current migration authority remains:

- `database_build259_media_static_slot_catalog.sql`
- `database_upgrade_current_pass.sql` (same current migration payload)
