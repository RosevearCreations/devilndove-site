# Devil n Dove — Brand V3 Set 15 (141–150)

Ten individually named 1712 × 324 WebP art banners, prepared as separate images in a single ZIP. **The ZIP is not deployed by a code commit**: upload the ten WebP files directly to `assets/images/brand-v3/` on the `dev` branch. Do not upload the ZIP or use an underscore in the folder name.

| # | Exact filename | Existing Admin page |
|---|---|---|
| 141 | `141-admin-packaging-studio.webp` | Packaging & Gift Presentation — `/admin/packaging-studio/` |
| 142 | `142-admin-creative-process.webp` | Creative Process & Maker Workflow — `/admin/creative-process/` |
| 143 | `143-admin-creative-assets.webp` | Creative Assets & Project Files — `/admin/creative-assets/` |
| 144 | `144-admin-visual-enrichment.webp` | Visual Enrichment Studio — `/admin/visual-enrichment-studio/` |
| 145 | `145-admin-inventory-replenishment.webp` | Inventory Replenishment — `/admin/inventory-replenishment/` |
| 146 | `146-admin-tool-lifecycle.webp` | Tool Lifecycle & Maintenance — `/admin/tool-lifecycle/` |
| 147 | `147-admin-supply-sourcing.webp` | Supply Sourcing & Purchasing — `/admin/supply-sourcing/` |
| 148 | `148-admin-storefront-merchandising.webp` | Storefront Merchandising — `/admin/storefront-merchandising/` |
| 149 | `149-admin-catalog-health.webp` | Catalog Health & Readiness — `/admin/catalog-health/` |
| 150 | `150-admin-manufacturing-readiness.webp` | Manufacturing & Production Readiness — `/admin/manufacturing-adoption/` |

## Installed code mapping
- `public/js/admin-brand-v3-set15.js` maps the ten actual Admin page URLs to these exact asset filenames.
- Every target HTML page includes the dedicated Set 15 JS and CSS; the shared `public/js/brand-v3-auto.js` asset manifest also registers IDs 141–150.
- Banners are inserted before the actual page heading **only on successful image loading**; missing files leave the original page unchanged.
- `css/admin-brand-v3-set15.css` uses `object-fit:contain`; on narrow screens the banner scrolls horizontally to avoid cutting off artwork lettering.
- The photographic details are illustrative only. Actual shop product photos, supplies, tools, owner-selected showcase media, live Admin counts, actions, permissions, and protected workflows stay unchanged.

Status: mapping committed to dev; check actual WebP files in GitHub before claiming the artwork is installed. There is no claim of main or Cloudflare Production GREEN without separate promotion and deployment verification.