# Build 277 Validation

## Scope

Owner-requested Packaging Studio correction:

- restore separate English and French ingredient lists;
- retain Build 276 Inventory-reference-only ingredient behavior;
- retain fail-closed long-list handling;
- increase claim-icon clearance horizontally and between stacked claim rows.

## Results

Packaging regression chain:

- Build 248 source-material regression: **85/85 PASS**
- Build 255 Material Library regression: **38/38 PASS**
- Build 261 Packaging/Inventory regression: **46/46 PASS**
- Build 262 Packaging material/printer/layout regression: **22/22 PASS**
- Build 275 Packaging Label regression: **72/72 PASS**
- Build 276 Packaging Inventory/INCI regression: **53/53 PASS**
- Build 277 bilingual/claim-spacing regression: **35/35 PASS**

JavaScript syntax:

- `public/js/admin-packaging-studio.js`: PASS
- `functions/api/admin/packaging-studio.js`: PASS

Aggregate-schema sanity (schema unchanged in Build 277):

- `database_full_schema.sql`: foreign key violations **0**
- `database_schema.sql`: foreign key violations **0**
- `database_store_schema.sql`: foreign key violations **0**

## Specific Build 277 safeguards

- English label panel has `INGREDIENTS`.
- French label panel has `INGRÉDIENTS`.
- Build 276 `CONTINUED / SUITE` rendering is retired.
- English and French are line-fitted separately.
- Readiness fails if required French display names have not been reviewed/saved.
- Readiness fails if either language exceeds the dedicated tested panel capacity.
- Printed claim icon centre moves to `claims.x + 12`; claim text begins at `claims.x + 44`.
- Horizontal icon-to-copy clearance exceeds 24 SVG viewBox units.
- Stacked claim-row centre spacing is 12 units; the 10.92-unit icon-circle diameter therefore no longer overlaps.
- Claim editor uses a 24 px horizontal column gap and 46 px icon box.
- No Build 277 schema migration exists; Build 276 remains the Packaging schema boundary.
