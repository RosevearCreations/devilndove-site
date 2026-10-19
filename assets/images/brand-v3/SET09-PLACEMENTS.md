# Devil n Dove — Brand V3 Set 09 (images 81–90)

The ten individually named WebP files are installed under `assets/images/brand-v3/` on the `dev` branch by `scripts/generate_brand_v3_set09.py` and the successful Set 09 GitHub workflow. They are 1440 × 640 decorative background compositions derived from our approved AI-generated brand assets, not photographs of our real merchandise or functioning Admin screenshots.

| No. | Exact filename | Placement |
|---|---|---|
| 81 | `81-workshop-process-header.webp` | Home: background behind the “Made in our workshop” section, **not** a replacement for its real owner-selected image |
| 82 | `82-our-story-banner.webp` | About: existing promotional card area |
| 83 | `83-contact-care-banner.webp` | Contact: existing promotional card area |
| 84 | `84-custom-request-banner.webp` | Custom Work: promotional inspiration card |
| 85 | `85-admin-dashboard-header.webp` | `/admin/` hero background |
| 86 | `86-admin-product-management-header.webp` | `/admin/products/` hero background |
| 87 | `87-admin-inventory-header.webp` | `/admin/inventory-operations/` hero background |
| 88 | `88-admin-orders-header.webp` | `/admin/orders/` hero background |
| 89 | `89-admin-production-calendar-header.webp` | `/admin/project-resource-calendar/` heading background |
| 90 | `90-admin-workstations-header.webp` | `/admin/project-capacity-planner/` heading background |

Mapping source: `public/js/brand-v3-auto.js` for public routes and image manifest. Placement styling: `css/brand-v3-theme.css` for admin header background images and all site cards.

## Framing and functionality safeguards
- The real “Made in our workshop” photograph remains unchanged. Its display is now height-constrained and uses `object-fit:contain`; no image portion is cut off
- AI-generated category images (01–90) use **contain**, not **cover**, in promotional and category card frames so their content remains visible
- The existing product, tools, supplies, and showcase image URLs are untouched, with updated framing and layout only; stock/pricing/cart/permissions are not fabricated or changed
- The original 01–50 and 71–80 filename mappings continue to work
- All fourteen customer HTML pages now load the cache-busted brand-v3 mapping `?v=90`
- Product cards and Admin panels use dark navy/purple/gold card treatments with real data and functional controls

Production note: A successful `dev` push or workflow does **not** by itself establish `main` promotion or Cloudflare Production GREEN. Release checks and actual rendered-page verification remain separate.
