# Devil n Dove Packaging Reference Baseline - Build 229

The following three user-supplied files are adopted together as direction for the soap-label system. `PACKAGING_STUDIO.md` remains the current implementation map and contains the full specification. Code, schema, templates, Startup gates and future changes must be reconciled against all three files.

| Adopted reference | Repository location | SHA-256 | Governs |
|---|---|---|---|
| `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` | `docs/packaging/source-references/DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` | `26fe76cff4943547739bbe68b328509ba916ed6c608b57e86a048ceb4f1611b7` | Brand, data model, bilingual/INCI content, workflow, deterministic SVG/PDF, testing and definition of done |
| `Soap_Label_Template_Guide.pdf` | `docs/packaging/source-references/Soap_Label_Template_Guide.pdf` | `cc4940bcb31a244ee7bd9248f4830be986c5cb669d21273a23b373aa3b5bfe0e` | Compact dimension/print direction |
| `Soap_Label_Master_Template.svg` | `assets/packaging/soap/reference/Soap_Label_Master_Template.svg` | `6e0a1653cdb85861544f06f5d1aa1897e1878cfcb5e62ebe86c6cfe003aacb5e` | Editable physical-size SVG baseline and comparison asset |

## Non-negotiable direction

- True physical-size SVG master; browser/raster imagery is not the layout authority.
- 11 × 1.5-inch artboard, 11 × 0.75-inch centred band and 2 × 1.5-inch front oval.
- Specification/guide target of 50 mm for the rear seal.
- 0.125-inch recommended bleed, safe margin, 300-DPI preview and CMYK where the chosen printer supports it.
- Rosevear Creations / Devil n Dove, `devilndove.com`, Made in Canada wording and a rose as the primary flower.
- Cream/ivory low-contrast background, gold trim, product accent and readable non-script ingredient type.
- Ordered continuous strip: English ingredients, front oval, French ingredients, rear seal, claims/weight and optional overlap/glue zone.
- Structured product, INCI, bilingual ingredient/claim, export, print-test, version and approval records.
- Human review, 100%-scale measured print/wrap test and archived approved version before production.

## Dimensional discrepancy that must remain visible

The specification and guide request a 50 mm rear seal while the 1.5-inch artboard is only 38.1 mm high. The supplied SVG uses `<circle r="12.5">`, which renders a 25 mm diameter rear seal. Neither the 50 mm specification circle nor the supplied 25 mm SVG circle should be silently treated as the approved production geometry.

The application therefore retains two controlled renderer profiles:

1. Photo-fit: 11 × 1.5 inches with a 38.1 mm rear seal that fits the artboard.
2. True-50-mm: 11 inches × 50 mm with a 50 mm rear seal.

Print both at 100%, wrap the actual soap, measure every region and record which geometry is approved. Until that evidence exists, the packaging gate remains open.
