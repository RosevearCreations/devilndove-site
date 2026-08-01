# Devil n Dove Packaging Studio — Single Source of Truth (Build 225)

## Authority rule
This file is the **single authoritative packaging specification and implementation map** for Devil n Dove. Packaging code, schema, templates, launch checks, and future work must be reconciled here during every build.

The former root and documentation-tree files named `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` are compatibility pointers only. They must not contain a second editable copy of the specification.

## Current implemented routes
- `/admin/packaging-studio/` — all structured packaging projects and templates.
- `/admin/packaging/soap-labels/` — focused nine-tab soap-label editor.
- `/admin/startup-readiness/` — launch status, evidence, and physical/regulatory gates.

## Current data authority
- `products` is the public commerce product authority.
- `packaging_templates`, `packaging_projects`, `packaging_project_versions`, and `packaging_export_history` are the broad packaging engine.
- `soap_label_templates`, `soap_products`, `soap_ingredients`, `soap_label_claims`, `soap_label_exports`, and `soap_label_print_tests` are the normalized soap-label authority.
- SVG is the editable master. PNG/WebP/JPG are previews. Browser Print/Save PDF remains preparation until a printer-specific prepress workflow is proven.
- Approved labels require a saved version and passed physical 100%-scale print evidence.

## Current implementation reconciliation
Implemented now:
- exact 11-inch continuous SVG ribbon and centred 0.75-inch band;
- Glacial Purple reference hierarchy and reusable rose assets;
- English/French/INCI rows and bilingual claims as editable database rows;
- photo-fit and true-50-mm controlled profiles;
- rose/colour/layout controls, guides, preview, versions, checksum/export evidence, and local recovery;
- physical print-test measurements and approval gate;
- startup launch tracking with owner, due date, status, evidence, and history.

Still gated or incomplete:
- true server-generated prepress PDF with verified media/bleed boxes and embedded or outlined fonts;
- printer calibration profiles and crop/calibration marks;
- deterministic glyph-level overflow measurement for every SVG region;
- R2 proof-photo upload and immutable approved-label supersession;
- barcode, batch/lot, QR, gift, and market/retail variants;
- direct reviewed recipe/formula-to-label synchronization without duplicating source facts;
- final bilingual, formula, claim, cosmetic, packaging, and net-quantity review for each product.

## Physical dimension conflict
The supplied specification states both a 1.50-inch (38.1 mm) artboard and a 50 mm rear circle. These cannot occupy the same height without clipping. The application keeps two explicit profiles until a physical proof selects the production geometry:
1. **Photo-fit:** 11 × 1.5 inches with a 38.1 mm rear seal.
2. **True 50 mm:** 11 inches wide × 50 mm high with a 50 mm rear seal.

---

# Authoritative User-Provided Soap Label & Packaging Automation Specification

# Devil n Dove Soap Label & Packaging Automation Specification

**Version:** 1.0  
**Project:** Devil n Dove  
**Subsystem:** Creative Asset Intelligence Platform (CAIP)  
**Status:** Ready for integration planning  
**Primary Purpose:** Generate consistent, print-ready soap ribbon labels from structured product data while preserving the exact Devil n Dove visual language established in the approved label concepts.

---

## 1. Objective

Create a reusable soap-label generation workflow that converts a soap product record into:

- one continuous wraparound ribbon label;
- one front oval product panel;
- one rear circular brand panel;
- bilingual English/French ingredient content;
- bilingual feature and care statements;
- product-specific rose artwork;
- product-specific accent colours;
- exact print dimensions;
- print-ready SVG and PDF;
- web-ready preview PNG or WebP;
- archived template and product metadata.

The workflow must preserve the established Devil n Dove label style:

- cream damask background;
- gold trim and decorative flourishes;
- product-specific accent colour;
- a rose as the main botanical element;
- `Rosevear Creations - Devil n Dove`;
- `devilndove.com`;
- `Made in Canada`;
- handcrafted and small-batch presentation;
- bilingual information side;
- elegant vintage typography;
- one continuous soap band rather than separate front and rear pieces.

---

## 2. Non-Negotiable Physical Specifications

### 2.1 Finished Canvas

The generated production artwork must use a true physical-size document, not an AI image whose dimensions are only written into the artwork.

| Element | Required Size |
|---|---:|
| Overall artboard | 11.00 in × 1.50 in |
| Wrap band | 11.00 in × 0.75 in |
| Front oval | 2.00 in × 1.50 in |
| Rear circle | 50 mm × 50 mm |
| Band centreline | 0.75 in from top of artboard |
| Front oval vertical overlap | 0.375 in above and below band |
| Recommended bleed | 0.125 in |
| Recommended safe margin | 0.0625–0.125 in |
| Raster preview | 300 DPI minimum |
| Production colour | CMYK where supported |
| Web preview | sRGB |

### 2.2 Important Layout Rule

The 0.75-inch band must be centred vertically inside the 1.50-inch artboard.

The front oval must also be centred vertically on the same centreline.

This creates:

- 0.375 inch of oval above the band;
- 0.375 inch of oval below the band.

The band itself must remain exactly 0.75 inch high throughout the full 11-inch length.

---

## 3. Label Segment Order

The continuous label must be generated as one strip in this order:

1. **Front-left ingredient panel**
2. **Front oval product panel**
3. **French ingredient panel**
4. **Rear circular brand seal**
5. **Benefits / care / recycling panel**
6. **Net weight area**
7. **Optional overlap / glue zone**

The exact horizontal position of the front oval may be adjusted per soap-bar dimensions, but the order must remain consistent.

Recommended default:

```text
| Ingredients EN | Front Oval | Ingredients FR | Back Seal | Claims + Weight | Overlap |
```

---

## 4. Visual Identity Rules

### 4.1 Brand Name

Always display:

```text
Rosevear Creations
- Devil n Dove -
```

### 4.2 Website Stamp

Always display:

```text
devilndove.com
```

The website may appear:

- inside the front oval stamp; and/or
- inside the rear circular seal.

### 4.3 Rose Requirement

A rose must always be used as the primary flower because Rosevear is part of the company name.

Never replace the rose with:

- jasmine;
- generic flowers;
- an earth globe;
- unrelated botanical artwork.

The rose may change colour to match the product theme.

Examples:

| Product | Rose Colour Direction |
|---|---|
| Glacial Purple | lavender / purple rose |
| Earth Shea & Pumice | earthy green rose |
| Health Oatmeal & Goat Milk | oatmeal / cream / beige rose |
| Sea Breeze | blue-green or ocean-blue rose |
| Charcoal | charcoal-grey rose |
| Honey | warm amber / honey-gold rose |
| Rose | natural red or pink rose |

### 4.4 Background

Default background:

- warm ivory or cream;
- subtle damask or floral texture;
- low contrast;
- no pattern beneath small ingredient text that reduces legibility.

### 4.5 Borders

Default borders:

- thin gold rule;
- product accent colour;
- optional dark edge for contrast.

### 4.6 Typography

Recommended hierarchy:

- brand: elegant script or high-contrast serif;
- product family: prominent serif;
- product variant: script or elegant serif;
- ingredients: clean sans-serif;
- legal/weight text: compact sans-serif;
- bilingual text: matched size and hierarchy.

Do not use decorative scripts for ingredient text.

---

## 5. Product Data Model

Each soap product should have one structured record.

```json
{
  "product_id": "soap-glacial-purple",
  "product_family": "Glacial Purple",
  "soap_type": "Aloe Soap",
  "brand_line_1": "Rosevear Creations",
  "brand_line_2": "- Devil n Dove -",
  "website": "devilndove.com",
  "made_in": "Made in Canada",
  "net_weight_oz": 4.5,
  "net_weight_g": 127,
  "accent_colour": "#6E3FA3",
  "secondary_colour": "#B88A2F",
  "rose_colour_name": "lavender purple",
  "rose_asset_id": "rose-purple-v1",
  "ingredients_en": [
    "Aloe Soap Base - SLS/SLES free",
    "No Palm Oil",
    "Organic Soap Base",
    "Bulk Aloe Melt and Pour Soap Base",
    "Natural Soap Base for Soap Making Organic",
    "Soap Making Supplies"
  ],
  "ingredients_fr": [
    "Base de savon à l'aloès - sans SLS/SLES",
    "Sans huile de palme",
    "Base de savon biologique",
    "Base de savon à fondre et à verser à l'aloès en vrac",
    "Base de savon naturelle pour fabrication de savon biologique",
    "Fournitures pour fabrication de savon"
  ],
  "claims": [
    {
      "en": "Natural Ingredients",
      "fr": "Ingrédients naturels",
      "icon": "leaf"
    },
    {
      "en": "Handmade with Care",
      "fr": "Fait à la main avec soin",
      "icon": "hands"
    },
    {
      "en": "Gentle & Moisturizing",
      "fr": "Doux et hydratant",
      "icon": "leaf"
    },
    {
      "en": "Please Recycle",
      "fr": "Veuillez recycler",
      "icon": "recycle"
    }
  ],
  "front_tagline": "Handcrafted with Care",
  "back_tagline": "Handmade in Small Batches",
  "print_status": "draft",
  "compliance_status": "needs_review"
}
```

---

## 6. Required Database Tables

### 6.1 `soap_label_templates`

Stores reusable layout definitions.

Suggested fields:

- `template_id`
- `template_name`
- `version`
- `artboard_width_in`
- `artboard_height_in`
- `band_height_in`
- `front_oval_width_in`
- `front_oval_height_in`
- `rear_circle_mm`
- `bleed_in`
- `safe_margin_in`
- `background_style`
- `default_font_set`
- `default_gold_colour`
- `is_active`
- `created_at`
- `updated_at`

### 6.2 `soap_products`

Stores product-level content.

Suggested fields:

- `product_id`
- `product_name`
- `product_family`
- `soap_type`
- `description_en`
- `description_fr`
- `net_weight_oz`
- `net_weight_g`
- `accent_colour`
- `rose_colour`
- `rose_asset_id`
- `website`
- `made_in_text_en`
- `made_in_text_fr`
- `active`
- `created_at`
- `updated_at`

### 6.3 `soap_ingredients`

Stores ingredient order and bilingual text.

Suggested fields:

- `ingredient_id`
- `product_id`
- `sort_order`
- `inci_name`
- `display_name_en`
- `display_name_fr`
- `organic_flag`
- `allergen_note`
- `required_on_label`
- `created_at`
- `updated_at`

### 6.4 `soap_label_claims`

Stores product claims and bilingual icon rows.

Suggested fields:

- `claim_id`
- `product_id`
- `sort_order`
- `claim_en`
- `claim_fr`
- `icon_name`
- `is_approved`
- `compliance_note`

### 6.5 `soap_label_exports`

Tracks generated files.

Suggested fields:

- `export_id`
- `product_id`
- `template_id`
- `version`
- `svg_url`
- `pdf_url`
- `png_url`
- `webp_url`
- `checksum`
- `generated_at`
- `generated_by`
- `approval_status`
- `print_test_status`
- `notes`

---

## 7. End-to-End Workflow

### Step 1: Create or Select Soap Product

Admin chooses:

```text
Products
→ Soap
→ Create New Soap
```

Required fields:

- product name;
- soap type;
- English ingredients;
- French ingredients;
- rose colour;
- accent colour;
- net weight;
- claims;
- fragrance or variant;
- optional notes.

### Step 2: Validate Content

System checks:

- English ingredients are present;
- French ingredients are present;
- ingredient counts roughly match;
- net weight is present in oz and g;
- `Made in Canada` is included;
- `devilndove.com` is present;
- brand name is exact;
- front flower is a rose;
- no text box exceeds safe area;
- no line is too small for print;
- no unsupported claims are included without review.

### Step 3: Generate Rose Asset

The system selects or generates a rose illustration based on:

- rose colour;
- product family;
- accent palette;
- background contrast;
- established Devil n Dove style.

The rose asset should be saved separately and linked by ID.

AI-generated artwork may be used for the rose illustration, but the final label layout must be composed in SVG/PDF using deterministic dimensions.

### Step 4: Compose Front Oval

Front oval includes:

```text
Rosevear Creations
- Devil n Dove -

[Rose Illustration]

[Product Name]
[Soap Type]

Handcrafted with Care

Made in Canada

[devilndove.com stamp]
```

The product name must be the visual focus.

### Step 5: Compose English Ingredient Panel

Rules:

- preserve ingredient order;
- use compact sans-serif;
- allow multi-column layout when required;
- do not shrink below minimum print size;
- wrap long ingredients cleanly;
- include `*Organic ingredients` where applicable.

### Step 6: Compose French Ingredient Panel

Rules mirror English panel.

French text must not be treated as secondary or optional.

### Step 7: Compose Rear Seal

Rear 50 mm circular panel includes:

```text
Rosevear Creations
- Devil n Dove -

Handmade in Small Batches

devilndove.com

Made in Canada
```

### Step 8: Compose Claims Panel

Default rows:

```text
Natural Ingredients / Ingrédients naturels
Handmade with Care / Fait à la main avec soin
Gentle & Moisturizing / Doux et hydratant
Please Recycle / Veuillez recycler
```

Claims must remain editable by product.

### Step 9: Compose Net Weight

Default:

```text
NET WT. APPROX. 4.5 OZ / 127 G
POIDS NET APPROX. 4,5 OZ / 127 G
```

### Step 10: Add Fold and Overlap Guides

The production file should optionally include non-printing guides for:

- front centre;
- left side fold;
- rear centre;
- right side fold;
- overlap zone;
- glue zone;
- safe area;
- bleed.

### Step 11: Generate Preview

Generate:

- full-layout PNG;
- wrapped soap mockup;
- front preview;
- back preview;
- close-up of ingredient panels.

### Step 12: Human Review

Admin reviews:

- spelling;
- ingredient order;
- bilingual accuracy;
- rose colour;
- product name;
- net weight;
- claims;
- print size;
- label overlap;
- barcode or SKU where applicable.

### Step 13: Print Test

Print one at 100% scale.

Verify physically:

- total strip is 11.00 inches;
- band is 0.75 inch;
- front oval is 2.00 × 1.50 inches;
- oval is centred on the band;
- text is legible;
- no important text folds around edges;
- overlap does not cover key content;
- label fits the actual soap bar.

### Step 14: Approve and Archive

After approval:

- lock the version;
- record checksum;
- archive source SVG;
- archive print PDF;
- save web preview;
- store a print-test photo;
- mark product label approved.

---

## 8. Rendering Rules

### 8.1 SVG Is the Master

The master source should be SVG because it preserves:

- exact physical dimensions;
- editable text;
- reusable vectors;
- clean print output;
- product-by-product variation.

### 8.2 PDF Is the Print Delivery Format

Generate print PDF from SVG.

PDF must preserve:

- 11.00-inch width;
- 1.50-inch artboard;
- vector text where possible;
- embedded fonts or converted outlines;
- bleed where required;
- no automatic page scaling.

### 8.3 PNG and WebP Are Previews Only

PNG/WebP are not the authoritative print files.

They are for:

- admin preview;
- website;
- product gallery;
- customer approval;
- archive thumbnails.

---

## 9. Automated Quality Checks

The generator must block approval when:

- total artwork is not exactly 11.00 inches wide;
- band is not exactly 0.75 inch high;
- front oval is not exactly 2.00 × 1.50 inches;
- rear seal is not 50 mm;
- required bilingual content is missing;
- ingredient text overflows;
- text is smaller than configured minimum;
- front flower is not a rose;
- website is missing;
- `Made in Canada` is missing;
- net weight is missing;
- print file lacks vector dimensions;
- approval screenshot differs from production output.

Warnings should be shown when:

- ingredients require very small type;
- French copy is substantially longer than English;
- safe margins are tight;
- overlap zone covers content;
- rose colours have poor contrast;
- too many claims are shown.

---

## 10. Template Variants

Create one master template and controlled variants.

### 10.1 Standard Soap Ribbon

- 11.00 × 1.50 artboard
- 0.75 band
- 2.00 × 1.50 front oval
- 50 mm rear seal

### 10.2 Compact Ribbon

For smaller bars:

- configurable strip length;
- same visual hierarchy;
- smaller rear seal if required;
- never shrink text below minimum.

### 10.3 Gift Edition

Adds:

- batch number;
- seasonal line;
- gift-message area;
- QR code;
- limited edition marker.

### 10.4 Market / Retail Edition

Adds:

- barcode;
- SKU;
- batch number;
- price sticker zone;
- retailer contact information if needed.

---

## 11. Admin Interface

Suggested route:

```text
/admin/packaging/soap-labels/
```

### Main Screen

Show:

- all soap products;
- label status;
- current template;
- rose colour;
- bilingual completeness;
- print-test status;
- last export date.

### Product Label Editor

Tabs:

1. Product
2. Ingredients
3. French
4. Rose & Colours
5. Claims
6. Layout
7. Preview
8. Print Test
9. Versions

### Preview Tools

- ruler overlay;
- actual-size preview;
- bleed view;
- fold view;
- safe-area view;
- wrapped soap simulation;
- 100% print test button.

---

## 12. File Naming Convention

Use predictable names.

```text
soap-label-glacial-purple-v1.0.svg
soap-label-glacial-purple-v1.0-print.pdf
soap-label-glacial-purple-v1.0-preview.png
soap-label-glacial-purple-v1.0-preview.webp
soap-label-glacial-purple-v1.0-proof.jpg
```

---

## 13. Repository Structure

Recommended project structure:

```text
docs/
  packaging/
    soap-label-system/
      README.md
      SOAP_LABEL_AUTOMATION_SPEC.md
      LABEL_COMPLIANCE_CHECKLIST.md
      PRINT_TEST_CHECKLIST.md

assets/
  packaging/
    soap/
      templates/
        master-soap-ribbon.svg
      roses/
        purple-rose.svg
        green-rose.svg
        oatmeal-rose.svg
      icons/
        leaf.svg
        hands.svg
        recycle.svg
      products/
        glacial-purple/
        earth-shea-pumice/
        health-oatmeal-goat-milk/

src/
  packaging/
    soap-labels/
      renderer/
      validators/
      templates/
      exports/
      preview/
```

---

## 14. Initial Product Records

### 14.1 Glacial Purple Aloe Soap

- rose: purple;
- accent: purple;
- product name: Glacial Purple;
- type: Aloe Soap.

### 14.2 Earth Goat Milk & Sea Breeze

- rose: blue-green;
- accent: ocean blue;
- product name: Earth;
- type: Goat Milk & Sea Breeze.

### 14.3 Earth Shea & Pumice

- rose: green;
- accent: forest green;
- product name: Earth;
- type: Shea & Pumice.

### 14.4 Health Oatmeal & Goat Milk

- rose: oatmeal / cream;
- accent: warm burgundy or brown;
- product name: Health;
- type: Oatmeal & Goat Milk.

---

## 15. Implementation Phases

### Phase 1 — Template Foundation

- build exact SVG master;
- add true dimensions;
- add front oval;
- add rear seal;
- add bleed and safe zones;
- add fold guides;
- export PDF.

### Phase 2 — Product Data

- create soap product schema;
- create bilingual ingredient schema;
- create claims schema;
- create rose asset selector.

### Phase 3 — Admin Editor

- create form;
- create preview;
- create validations;
- create version history.

### Phase 4 — Export Engine

- SVG export;
- PDF export;
- PNG/WebP preview;
- naming conventions;
- checksum and archive.

### Phase 5 — Packaging Automation

- connect finished product record;
- auto-generate label draft;
- create review queue;
- approve;
- publish product listing assets.

---

## 16. Definition of Done

The subsystem is considered production-ready when:

- a user can create a soap product;
- enter English and French ingredients;
- select a rose colour;
- select an accent palette;
- generate one continuous 11-inch label;
- confirm a 0.75-inch band;
- confirm a 2 × 1.5-inch front oval;
- confirm a 50 mm rear seal;
- preview at actual size;
- export SVG and PDF;
- print at 100% without scaling;
- physically wrap the label around the soap;
- archive the final approved version.

---

## 17. Development Directive for the Devil n Dove Build Chat

Use the following directive when adding this specification to the main Devil n Dove development conversation:

> Add the Devil n Dove Soap Label & Packaging Automation subsystem as a first-class CAIP packaging workflow. Use the attached specification as the authoritative design. The system must generate true physical-size SVG/PDF labels, not AI mockups, and must preserve the approved visual language used in the Glacial Purple, Earth, and Health label concepts. Implement documentation first, then data model, then SVG renderer, then admin editor, then PDF export, then print testing. Maintain bilingual English/French ingredient support, always use a rose as the primary flower, and validate exact dimensions before approval.

---

## 18. Important Compliance Note

This specification defines software, layout, and production workflow. It does not replace product-labelling, cosmetic, consumer-packaging, bilingual, ingredient, claim, or net-quantity compliance review.

Before selling printed products, have the final labels checked against the requirements that apply to the specific product and sales channel.

---

## Build 225 maintenance directive
During every future packaging change:
1. Update this file first or in the same commit as code/schema changes.
2. Keep the compatibility pointer files short; never recreate a second full copy.
3. Update `DATABASE_SCHEMA_REFERENCE.md`, aggregate schemas, current migration, `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, and the build validation record.
4. Re-run exact-dimension, one-H1, CSS, JavaScript, local-reference, schema, XML/SVG, and ZIP-integrity checks.
5. Never describe an untested browser PDF, label, formula, claim, or notification as production/legal approval.
