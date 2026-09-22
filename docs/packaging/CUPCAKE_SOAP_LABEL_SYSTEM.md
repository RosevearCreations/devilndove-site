# Cupcake Soap Label System — Build 234

## Owner-supplied visual references

Five square PNG references were supplied on 2026-09-22. They are visual direction only; they are not editable legal-label masters and are not treated as evidence of ingredients, formula, claims, weight or regulatory approval.

| Direction | Source SHA-256 | Source size |
|---|---|---:|
| Sweet Orange | `974b29be1d35c8b34fe81098550d367d85ce162b90754c6c8b76bb9835ccf266` | 1254 × 1254 |
| Charcoal | `ea5d838f82d5717c77ccec7099a14bd4bda47337091fb01b806bcc1be7c398b5` | 1254 × 1254 |
| Oatmeal & Goat Milk | `d8ace63bf31f146c43e165411ebd83e09d70ea60cadabbe75eb66a50a37db2f4` | 1254 × 1254 |
| Sea Breeze | `37087b770f00c721da1fac339b03d3d3d243399bde0fa1f1cd352287af3dc748` | 1254 × 1254 |
| Lavender Dream | `c6df245f87c28b3320583056056b414ee451d55f28c3464ece7c1dc0d2642811` | 1254 × 1254 |

The supplied image order is preserved in the owner conversation; the hashes are the immutable identity check for later comparison.

## Physical template

The editable master is **50.8 mm × 50.8 mm (2.00 in × 2.00 in)**.

- Design profile: `cupcake_soap_square_v1`
- Packaging type: `product_label`
- Safe margin: 2 mm
- SVG exports preserve the physical size.
- Raster preview/export at 300 DPI resolves to 600 × 600 px.
- A 100% physical print test remains required before an approved production version.

## Included reusable system themes

The five supplied visual directions are installed as reusable system templates:

1. Sweet Orange
2. Charcoal
3. Oatmeal & Goat Milk
4. Sea Breeze
5. Lavender Dream

Build 234 also adds:

6. Rose Petal
7. Lemon Honey
8. Eucalyptus Mint
9. Vanilla Cream
10. Berry Bliss

All ten use the same editable layout contract. Colours and front wording can still be changed per project, and an owner-created variant can be saved through the existing **Save as reusable template** workflow.

## Editable fields

The Cupcake Soap layout reuses existing Packaging authority rather than creating another label editor.

- Product identity / large title (normally **Cupcake Soap**)
- Cupcake / scent / collection name
- Purpose / front-use wording
- Structured ingredients and INCI source rows
- Made in Canada wording
- website/contact/business wording
- background, border, trim and accent colours
- exact width/height, bleed and safe area
- print/finishing notes
- review versions, export evidence and physical print tests

Applying a visual theme **does not overwrite structured ingredients, INCI facts, claims, warnings, net quantity, Product data or review evidence**.

## Compact-front-label boundary

A 2-inch square is intentionally a compact front label. Packaging Studio must not claim that every Canadian cosmetic declaration will fit on this face at a legible size.

If complete required ingredient/INCI, bilingual, metric quantity, dealer/contact, warning or other reviewed wording cannot fit, retain it on a companion/back label or other compliant package surface. Do not drop required facts just to preserve the decorative design.

The preview explicitly warns when the ingredient summary is too long and directs the operator to a companion/back label. Regulatory/physical approval remains review-first.

## Authority

- Template rows: canonical D1 migration `0023_release467_build234_cupcake_soap_label_templates.sql`
- Editor/renderer: `public/js/admin-packaging-studio.js`
- Server persistence: existing Packaging project `theme_json` / `artwork_json`
- Structured ingredients: existing Packaging structured ingredient authority
- Versions/exports/print tests: existing Packaging evidence authority

No parallel Product, Inventory, Finance, Media or label database is introduced.
