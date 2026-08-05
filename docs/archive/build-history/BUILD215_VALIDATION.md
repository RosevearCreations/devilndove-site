# Build 215 Validation — Creative Intelligence Integration

## Scope

- Reviewed Creative Project timeline evidence can be selected and packaged for Content Studio.
- A primary linked product allows the package to create/link the existing review-first Content Studio record.
- Projects without products still receive a standalone reviewed evidence package.
- Material entries require explicit review; Build 215 never consumes inventory.
- Profitability separates reviewed materials, labour, packaging, overhead, channel fees, shipping, revenue, and estimated content value.
- Catalog products may remain independent; the full Catalog editor links to the optional Creative Project workspace.
- Social OAuth remains credential-dependent and review-first. No automatic public posting was enabled.

## Test

1. Open `/admin/creative-process/` and choose a project.
2. Add timeline entries including media, a mistake, repair, lesson, and material usage.
3. Select two or more entries as evidence.
4. Create a reviewed package. With a primary product, verify the Content Studio link appears.
5. Review a material row and verify inventory quantities do not change.
6. Save profitability assumptions and verify the calculated summary remains after reload.
7. Open `/admin/catalog/?product_id=<id>` and confirm the optional Creative Project shortcut preserves the product ID.
8. Test at 360, 390, 430, 768, and desktop widths.
