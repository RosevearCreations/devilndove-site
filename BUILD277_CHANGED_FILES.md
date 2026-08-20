# Build 277 Changed Files

Build 277 is a Packaging Studio code/documentation release. **No D1 migration is required; Build 276 remains the Packaging schema boundary.**

## Application

- `admin/packaging-studio/index.html`
  - Build 277 UI/cache marker.
- `public/js/admin-packaging-studio.js`
  - Restores dedicated English and French ingredient panels.
  - Fits each language independently and fails closed on overflow.
  - Widens claim icon-to-copy spacing and increases stacked claim-row spacing.
- `css/styles.css`
  - Larger claim-editor horizontal gap and icon box.
- `functions/api/admin/packaging-studio.js`
  - Build 277 readiness logic requires reviewed French ingredient display values.
  - Validates English/French ingredient capacity independently.

## Current documentation authorities

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `PACKAGING_STUDIO.md`
- `RELEASE_NOTES.md`
- `MARKDOWN_INDEX.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `DATABASE_SCHEMA_REFERENCE.md`

These now state that Build 277 restores the owner-requested bilingual ingredient presentation while Build 276 remains the schema/migration boundary.

## Regression maintenance

- `scripts/build261_packaging_inventory_claims_layout_regression.py`
- `scripts/build262_packaging_material_printer_layout_regression.py`
- `scripts/build275_packaging_label_regression.py`
- `scripts/build276_packaging_inventory_inci_regression.py`
- `scripts/build277_packaging_bilingual_claim_spacing_regression.py` (new)

Historical tests were broadened only where Build 277 intentionally supersedes rendering/spacing behavior; their original source/template/inventory/print-safety assertions remain intact.
