# Devil n Dove — Brand V3 Set 14 (Images 131–140)

Ten actual individually cropped standalone 1712 × 274 WebP banners. The ZIP contains each WebP and two placement instructions; no composite board.

Upload only WebP files to `devilndove-site/assets/images/brand-v3/` on the `dev` branch (hyphen, not underscore).

| Image | Exact filename | Admin application placement | Page URL |
|---|---|---|---|
| 131 | `131-admin-product-media-photography.webp` | Product Photography Manager | `/admin/product-image-quality/` |
| 132 | `132-admin-design-creative-development.webp` | Creative Project Development | `/admin/creative-project-pilot/` |
| 133 | `133-admin-task-management-work-orders.webp` | Today Tasks | `/admin/today-tasks/` |
| 134 | `134-admin-shipping-logistics.webp` | Order Fulfilment & Care | `/admin/order-fulfillment-care/` |
| 135 | `135-admin-customer-support-communications.webp` | Client Documents | `/admin/customer-documents/` |
| 136 | `136-admin-finance-accounting.webp` | Finance | `/admin/finance/` |
| 137 | `137-admin-sales-business-analytics.webp` | Finance & Unit Economics | `/admin/finance-product-inventory-unit-economics/` |
| 138 | `138-admin-integrations-api-connections.webp` | I.T. Operations | `/admin/it-platform/` |
| 139 | `139-admin-website-brand-customization.webp` | Content Studio | `/admin/content-studio/` |
| 140 | `140-admin-system-health-maintenance.webp` | Reliability & System Health | `/admin/reliability/` |

## Wiring
- Each of the ten real Admin HTML pages loads `/public/js/admin-brand-v3-set14.js?v=14`.
- Route-to-file mapping is explicit in that loader; it adds a banner only when the WebP loads successfully, so absent files never create broken image frames.
- The shared `css/brand-v3-theme.css` supplies dark navy/purple/gold panel styling and object-fit:contain; mobile devices may scroll the banner horizontally to avoid cutting off decorative words.
- The `public/js/brand-v3-auto.js` manifest contains IDs 131–140 for bookkeeping. The artwork is illustrative and must never substitute for a genuine product, tool, supply, customer or showcase photograph.

## Release
The filenames and Admin page CSS/JS are committed on dev. The ZIP's WebP binaries require owner upload to the same directory unless GitHub already lists them. No main or Cloudflare Production success is inferred from dev CI alone.