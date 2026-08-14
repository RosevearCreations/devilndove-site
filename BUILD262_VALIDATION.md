# Build 262 Validation

## Result

Build 262 passed the focused Packaging Studio regression and retained compatibility suites.

## Focused Build 262 checks

`python scripts/build262_packaging_material_printer_layout_regression.py`

**22 / 22 PASS**

Covered:

- active-only source Material Library template;
- reusable ingredient/blend/colourant dropdown;
- source Master INCI synchronization;
- printer inventory/profile selector;
- Letter 8.5 × 11 sheet planner;
- portrait/landscape and 90-degree packing choices;
- zero-gap maximum-yield default with editable gap;
- printer name in print-test history;
- Build 262 cache busting;
- French ingredients left / English ingredients right;
- lowered/compressed claims;
- lowered net-weight separator and line;
- centered/wrapped front title relative to botanical rose;
- enlarged small circular seal and smaller seal wording;
- ingredient print-zone clipping;
- no unnecessary D1 migration.

## Retained compatibility results

- Build 261 Packaging / Inventory / Claims: **46 / 46 PASS**
- Build 255 Packaging Material Library: **38 / 38 PASS**
- Build 248 Packaging Source Materials: **85 / 85 PASS**
- Build 247 Packaging Studio: **43 / 43 PASS**
- Build 249 Inventory Kits / Components: **25 / 25 PASS**
- Build 250 Product Media / Use-Batch: **14 / 14 PASS**
- Build 251 Product Image Runtime: **9 / 9 PASS**
- Build 252 Inventory Unit Runtime: **10 / 10 PASS**
- Build 253 Inventory Linked Item / Reset: **18 / 18 PASS**
- Build 254 Startup / Smoke Runtime: **16 / 16 PASS**
- Build 259 Explicit Media Slots: **98 / 98 PASS**
- Build 260 Media Bootstrap Runtime: **21 / 21 PASS**
- Build 239 public visual test: **PASS**

## Syntax / schema

- `node --check public/js/admin-packaging-studio.js`: PASS
- `node --check functions/api/admin/packaging-studio.js`: PASS
- Fresh `database_full_schema.sql`: PASS
- `PRAGMA foreign_key_check`: zero violations in fresh-schema check.

## Print-planning behavior

The Letter planner uses the exact template dimensions at the selected scale, subtracts the printer-profile margins, applies the selected inter-label gap, evaluates both Letter orientations and optional 90-degree label rotation, then picks the highest-count arrangement.

Default gap is 0 mm to maximize yield; an owner can add a cutting gap in the printer profile. A label that cannot physically fit the selected Letter profile at the selected exact scale is reported rather than silently shrunk.

For the existing 11-inch-wide soap ribbon templates, a physical 100% print requires a printer/profile capable of the needed printable width (for example a genuinely borderless/zero-side-margin Letter mode). The system print dialog remains the final authority for the actual printer/driver capabilities.

## Deployment

Build 262 is code-only.

**Do not run a new D1 migration for this build.**

After deployment, hard-refresh `/admin/packaging-studio/` and verify the page loads:

- `/css/styles.css?v=262`
- `/public/js/admin-packaging-studio.js?v=262`
