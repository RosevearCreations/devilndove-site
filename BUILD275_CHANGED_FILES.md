# Build 275 Changed Files — Packaging Studio Ingredient / French / Rose Repair

## Runtime
- `functions/api/admin/packaging-studio.js`
  - Build response advanced to 275.
  - Applying a source template now persists Master INCI into `packaging_project_ingredients`.
  - Base templates replace current structured ingredient rows; non-base sources append only non-duplicate rows.
  - Project fallback INCI/English/French strings are synchronized from the structured rows.
  - Supplier claim suggestions are persisted only as unapproved draft claims and deduplicated.
- `public/js/admin-packaging-studio.js`
  - Repairs blank structured ingredient rows from attached base templates.
  - Adds **Reload from attached base** and **Draft French** controls.
  - French draft can reconstruct structured rows from attached source or INCI fallback.
  - Expands curated Goat’s Milk/common soap French display vocabulary.
  - Main soap identity uses the same brand-script stack as Rosevear Creations / Devil n Dove with bold weight.
  - Increases claim icon/text spacing.
  - Expands Product rose direction and adds an actual-rose quick palette.
- `admin/packaging-studio/index.html`
  - Packaging CSS/JS cache-busted to `v=275`.
  - Hero/current-build wording advanced to Build 275.
- `css/styles.css`
  - Claim editor spacing refinements.
  - Responsive French action layout.
  - Actual botanical rose quick-palette layout.

## Documentation
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `PACKAGING_STUDIO.md`
- `MARKDOWN_INDEX.md`
- `RELEASE_NOTES.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`

## Regression maintenance
- `scripts/build248_packaging_source_material_regression.py`
  - Modernizes current-authority wording assertion.
- `scripts/build261_packaging_inventory_claims_layout_regression.py`
  - Future-safe numeric build-version assertions.
- `scripts/build262_packaging_material_printer_layout_regression.py`
  - Future-safe numeric cache-version assertion.
- `scripts/build275_packaging_label_regression.py`
  - New Build 275 regression covering persistent source ingredients, French recovery, claim spacing, brand title typography and all rose direction assets.

## Database
No D1 schema change is introduced by Build 275. Build 274 remains the latest focused schema migration after Build 269.
