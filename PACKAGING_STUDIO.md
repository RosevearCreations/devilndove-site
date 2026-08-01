# Devil n Dove Packaging Studio — Build 222

## Purpose
Packaging Studio creates reusable packaging from structured product data rather than flattening permanent text into a picture. Build 222 adds a focused Soap Label Studio that follows the approved Glacial Purple Aloe Soap continuous ribbon and the authoritative `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md`.

## Admin routes
- `/admin/packaging-studio/` — all structured packaging projects and templates.
- `/admin/packaging/soap-labels/` — focused soap-label project list and nine-tab editor.
- `/admin/startup-readiness/` — ordered launch gates, including physical label proof and regulatory workflow.

## Approved soap-ribbon structure
The live SVG uses one continuous ribbon in this order:

```text
English ingredients | front oval | French ingredients | rear seal | bilingual claims + net weight | overlap/glue
```

The front oval recreates the approved hierarchy without embedding the reference picture:
- `Rosevear Creations`
- `- Devil n Dove -`
- a product-coloured rose as the primary botanical
- product family/variant and soap type
- `Handcrafted with Care`
- `Made in Canada`
- website/brand seal as configured

The rear seal contains the brand, small-batch line, website and Canadian origin. The right panel supports editable bilingual claim/icon rows and net quantity.

## Exact physical profiles
### Photo-fit profile — preferred starting point
- artboard: 11.00 × 1.50 inches;
- band: 11.00 × 0.75 inches, centred vertically;
- front oval: 2.00 × 1.50 inches, centred on the same line;
- rear seal rendered at 38.1 mm so it fits the 38.1 mm artboard;
- bleed: 0.125 inch;
- safe margin: 0.0625 inch default.

### 50 mm rear-seal profile
- artboard width: 11.00 inches;
- artboard height: 50 mm (about 1.9685 inches);
- band: 0.75 inch;
- front oval: 2.00 × 1.50 inches;
- rear seal: 50 mm.

The source specification requires both a 1.5-inch artboard and 50 mm rear circle. Since 50 mm exceeds 38.1 mm, Build 222 does not silently clip the seal or misstate the dimensions. Both profiles remain explicit until physical testing chooses the production geometry.

## Editor tabs
1. **Product** — product link, family, variant/type, brand, website, Canadian origin and net quantity.
2. **Ingredients** — ordered INCI/English rows, organic flag, allergen note and required-on-label state.
3. **French** — matched French display rows and completeness warnings.
4. **Rose & Colours** — rose asset, rose colour, product accent, gold and background palette.
5. **Claims** — ordered bilingual claim/icon rows, approval and compliance notes.
6. **Layout** — dimension profile, safe/bleed values, guide toggles and section controls.
7. **Preview** — exact-source SVG, region checks and downloadable previews.
8. **Print Test** — 100%-scale measurements, printer/paper, fit, legibility, overlap, proof URL and reviewer notes.
9. **Versions** — review snapshots, approval state and export/checksum history.

## Data authority
- `products` remains the public commerce product authority.
- `packaging_templates` and `packaging_projects` remain the broad packaging engine.
- `soap_label_templates` stores soap-specific physical profiles.
- `soap_products` stores soap-label product identity and visual selection linked to the packaging project.
- `soap_ingredients` stores ordered ingredient/translation rows.
- `soap_label_claims` stores ordered bilingual claim rows and approval evidence.
- `packaging_project_versions` stores review snapshots and source SVG.
- `soap_label_print_tests` stores physical evidence and measured dimensions.
- `soap_label_exports` stores format, filename, checksum, version and print-test status.

Structured rows replace duplicated JSON for ingredients, claims, print tests and exports. Small bounded visual options may remain JSON because they are versioned with the project and do not require independent inventory-style editing.

## Export rules
- SVG is the editable master.
- PNG, WebP and JPG are previews.
- Browser Print/Save PDF prepares a measured print but is not a true CMYK prepress PDF.
- Predictable names use the product slug and version.
- Each prepared export records a SHA-256 checksum where browser support is available.
- Approval is blocked until a saved version has a passed 100%-scale print test.

## Review and compliance boundary
The system helps find missing fields; it does not approve a formula or legal label. Before sale, verify:
- actual formula and INCI order;
- English/French product identity and warnings;
- metric net quantity;
- dealer/business identity and principal address;
- consumer contact information;
- claim substantiation;
- fragrance/allergen obligations that apply at the sale date;
- physical fit, legibility, scale, overlap and colour.

Never use supplier marketing bullets as an ingredient declaration without review. Never infer a cosmetic claim or warning from the reference artwork.

## Error and fallback behaviour
- D1/auth/validation failures return structured errors and create runtime incidents.
- The browser stores a local recovery draft when a server save cannot complete.
- The recovery draft is clearly marked local and is not considered a version, approval or server export.
- Failed exports and failed print tests cannot advance approval.

## Current completion
Implemented:
- exact SVG canvas profiles;
- photo-matched section order;
- structured product, ingredient and claim editing;
- reusable rose assets;
- guide overlays;
- versions, checksums and export evidence;
- local recovery;
- physical print-test recording and approval gate;
- mobile-responsive editor and sticky actions.

Still required for production-grade prepress:
- server-generated print PDF with exact media/bleed boxes;
- embedded or outlined fonts;
- explicit RGB/CMYK conversion/profile workflow;
- crop/calibration marks;
- automated region text measurement;
- R2 proof-image upload;
- locked approved-version/supersession workflow;
- barcode/batch/QR retail variants.

## Deployment
Apply `database_build222_soap_label_startup_readiness.sql` after Build 221, or the identical `database_upgrade_current_pass.sql`, but not both. Deploy the complete build and follow `BUILD222_VALIDATION.md`, then complete Gate 13 in `STARTUP_GO_LIVE_GUIDE.md` for each launch soap.
