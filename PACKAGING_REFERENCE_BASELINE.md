# Devil n Dove Packaging Reference Baseline - Build 234 current pointer

Five owner-supplied files are adopted as packaging direction. The first four govern the soap-label system: specification, guide, editable physical baseline and approved visual target. The fifth directs the round wedding/anniversary candle-top family. `PACKAGING_STUDIO.md` remains the current implementation map. Code, schema, templates, Startup gates and future changes must be reconciled against the applicable adopted files.

| Adopted reference | Repository location | SHA-256 | Governs |
|---|---|---|---|
| `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` | `docs/packaging/source-references/DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` | `26fe76cff4943547739bbe68b328509ba916ed6c608b57e86a048ceb4f1611b7` | Brand, data model, bilingual/INCI content, workflow, deterministic SVG/PDF, testing and definition of done |
| `Soap_Label_Template_Guide.pdf` | `docs/packaging/source-references/Soap_Label_Template_Guide.pdf` | `cc4940bcb31a244ee7bd9248f4830be986c5cb669d21273a23b373aa3b5bfe0e` | Compact dimension/print direction |
| `Soap_Label_Master_Template.svg` | `assets/packaging/soap/reference/Soap_Label_Master_Template.svg` | `6e0a1653cdb85861544f06f5d1aa1897e1878cfcb5e62ebe86c6cfe003aacb5e` | Editable physical-size SVG baseline and comparison asset |
| Glacial Purple Aloe Soap approved visual | `assets/packaging/soap/reference/glacial-purple-aloe-soap-approved-reference.png` | `297d8a7e737447c307523ea50b04d4967892e86c948f19745e35c114dd0a382c` | Permanent brand/static elements, botanical rose, centred front hierarchy, bilingual panels, rear seal, claims and weight-area appearance |
| Wedding candle-top sample | `assets/packaging/reference/wedding-candle-top-john-laurie-approved-reference.png` | `8abe415ff7fb472fd28697a18638a9b30a7e8f53cce737eb5bc87f13c8cfa056` | Round double-border composition, curved website/origin wording, candle/rose/bow art, centred editable names, dates and occasion |

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

## Candle-top direction

- The supplied wedding sample is visual direction, not a measured dieline. Measure the actual lid or laser blank before choosing a 4-inch, 3.5-inch, 3-inch or custom template.
- Keep `devilndove.com`, customer names/main wording, original date, occasion, celebration date and `Hand Made in Canada` as editable, centred SVG text. Do not bake customer wording into generated artwork.
- Preserve a round double border, concentric safe area and text paths for upper/lower arcs.
- Use text-free wedding candle/rose/bow artwork for the wedding profile; general round and maker-mark profiles can omit it.
- Save repeatable dimensions, design profile, colours, artwork defaults and wording defaults as a D1 custom template.
- Export a self-contained SVG with artwork embedded. Record a checksum and complete a material/laser or 100%-scale print proof before approval.
- Raster artwork is not automatically an accepted laser vector. Trace/vectorize only through a reviewed production workflow and preserve the approved source/version.

## Dimensional discrepancy that must remain visible

The specification and guide request a 50 mm rear seal while the 1.5-inch artboard is only 38.1 mm high. The supplied SVG uses `<circle r="12.5">`, which renders a 25 mm diameter rear seal. Neither the 50 mm specification circle nor the supplied 25 mm SVG circle should be silently treated as the approved production geometry.

The application therefore retains two controlled renderer profiles:

1. Photo-fit: 11 × 1.5 inches with a 38.1 mm rear seal that fits the artboard.
2. True-50-mm: 11 inches × 50 mm with a 50 mm rear seal.

Print both at 100%, wrap the actual soap, measure every region and record which geometry is approved. Until that evidence exists, the packaging gate remains open.
