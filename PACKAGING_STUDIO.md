# Devil n Dove Packaging Studio — Build 221

## Purpose
Packaging Studio creates reusable print packaging from structured product data rather than artwork with permanent text. The first operating template recreates the supplied soap ribbon: a narrow 19 mm wrap band, a scalloped front medallion extending beyond the band, curved collection and scent text, bilingual centre identity, botanical side ornaments, ingredient panels, rear medallion, claims and metric net quantity.

## Supplied soap-ribbon mapping
The photographed reference is represented without embedding the photograph itself:

- Upper curved text: `collection_name` or an optional upper-arc override.
- Centre English title: `product_identity_en`, for example `Luxury Soap`.
- Centre French title: `product_identity_fr`, for example `Savon de luxe`.
- Lower curved text: `product_name` or an optional lower-arc override.
- Side artwork: structured botanical, minimal or none.
- Narrow wrap band: 19 mm high.
- Full export canvas: 279.4 mm × 50 mm so the medallion is not clipped.

The built-in **Apply reference example** control loads `Coconut milk`, `Luxury Soap`, `Savon de luxe`, and `Sweet Vanilla` as a demonstration. Those values must be reviewed and replaced for each real product.

## Initial operating scope
- Scalloped soap-ribbon template based on the supplied reference.
- Standard 11 × 0.75 inch soap-ribbon template.
- Editable colours, botanical style, badge shape and centre mark.
- English/French product identity and supporting copy.
- INCI ingredient field.
- Metric net quantity, dealer identity/address, contact, claims and bilingual warnings.
- Live SVG preview with automatic font scaling.
- Structured D1 projects, templates, versions and export history.
- SVG, PNG, JPG and browser Print/Save PDF preparation.
- Browser-local draft fallback when D1 or the network is unavailable.

## Review and compliance boundary
Packaging Studio is an authoring and preflight aid, not legal approval. Before printing or selling a cosmetic, verify the visible label against current Canadian requirements and the actual formula. Common fields checked by the application include:

- product identity in English and French;
- metric net quantity;
- INCI ingredient list;
- dealer identity and principal place of business;
- consumer contact information;
- bilingual warnings or cautions when applicable.

Approval must remain deliberate. An SVG export or saved version does not prove regulatory compliance, print quality, colour accuracy, ingredient accuracy or claim substantiation.

## Data model
- `packaging_templates` — reusable dimensions, layout and theme defaults.
- `packaging_projects` — current structured label content linked optionally to a product.
- `packaging_project_versions` — immutable review snapshots and SVG evidence.
- `packaging_export_history` — prepared export format, filename and source snapshot.

Editable content remains in database columns and JSON subdocuments for small bounded theme/artwork settings. Product facts remain in the product system; Packaging Studio does not replace the catalog.

## Future packaging types
The engine should expand by template, not by separate disconnected tools:

- candle and wax-melt labels;
- lotion bars, lip balms, bottles and essential oils;
- jewelry display cards and hang tags;
- care, thank-you and QR information cards;
- craft-fair price labels and retail shelf labels;
- shipping labels, box wraps and gift-set packaging.

## CAIP and Content Studio relationship
Packaging assets can later become CAIP-controlled derivatives linked to their source product/project, rights state, approved claims and version. Packaging Studio must not auto-publish, overwrite source media or silently promote draft claims into public copy.

## Deployment
Apply `database_build221_packaging_studio_cleanup_lot_controls.sql`, deploy the complete build, open `/admin/packaging-studio/`, create a test project, save a review version and verify all four export paths before using a real production label.

## Current competitive print baseline
Current mainstream label/design tools emphasize editable templates and resizing, while production-oriented print export commonly includes bleed, crop marks and CMYK PDF output. Build 221 reaches the structured-template, resizing, auto-font-scaling and multi-format draft-export stage, but its browser Print/Save PDF must **not** be described as a true CMYK prepress file.

Next print-engine priorities are therefore:
- configurable safe areas and bleed;
- visible cut, fold and wrap guides;
- printer calibration marks and measured scaling proof;
- true print-PDF generation with embedded or outlined fonts;
- explicit RGB/CMYK handling and printer-profile guidance;
- QR generation that supplements rather than replaces mandatory label information.
