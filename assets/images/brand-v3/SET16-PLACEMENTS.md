# Devil n Dove Brand V3 — Set 16 / Images 151–160

Ten **standalone, non-composite** 1712 × 324 WebP Admin page banners in one ZIP. **Upload the ten .webp files** to `devilndove-site/assets/images/brand-v3/` on branch `dev` (hyphen, never underscore).

| # | Exact filename | Admin destination |
|---|---|---|
| 151 | `151-admin-workshop-capabilities.webp` | `/admin/workshop-capabilities/` |
| 152 | `152-admin-workshop-knowledge.webp` | `/admin/workshop-knowledge/` |
| 153 | `153-admin-workshop-readiness.webp` | `/admin/workshop-readiness/` |
| 154 | `154-admin-project-work-orders.webp` | `/admin/project-work-orders/` |
| 155 | `155-admin-production-release.webp` | `/admin/order-production-release-readiness/` |
| 156 | `156-admin-inventory-fulfillment.webp` | `/admin/order-inventory-fulfillment-readiness/` |
| 157 | `157-admin-project-profitability.webp` | `/admin/project-profitability-reconciliation/` |
| 158 | `158-admin-mobile-workshop.webp` | `/admin/mobile-workshop-assistant/` |
| 159 | `159-admin-maker-stories.webp` | `/admin/maker-story-coverage/` |
| 160 | `160-admin-inventory-intelligence.webp` | `/admin/inventory-creator-intelligence/` |

## Wiring and safeguards
- Every target Admin page includes `/public/js/admin-brand-v3-set16.js?v=16` and `/css/admin-brand-v3-set16.css?v=16`.
- The loader maps exact page routes to exact filenames and inserts its decorative banner only after the actual WebP successfully loads. No empty images when an upload is missing.
- CSS uses `object-fit:contain`, full-image framing and horizontal scrolling at narrow widths to avoid clipping text or the artwork.
- `public/js/brand-v3-auto.js` registers IDs 151–160 as a shared filename manifest.
- All existing Admin forms, live metrics, API calls, permissions and read-only safety controls stay unchanged. No product, tools, supplies or showcase photo is replaced.
- Successful `dev` checks do **not** imply `main` or Cloudflare Production promotion.
