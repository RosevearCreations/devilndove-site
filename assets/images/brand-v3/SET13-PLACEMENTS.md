# Devil n Dove — Brand V3 Set 13 (121–130)

Ten individually named 1712 x 274 WebP banners. Upload each WebP extracted from the ZIP directly to `devilndove-site/assets/images/brand-v3/` on the `dev` branch; the folder is hyphenated.

| Number | Exact filename | Admin page |
|---|---|---|
| 121 | `121-admin-users-management.webp` | `/admin/users/` |
| 122 | `122-admin-security-access-control.webp` | `/admin/membership/` |
| 123 | `123-admin-system-configuration.webp` | `/admin/it/` |
| 124 | `124-admin-media-library-assets.webp` | `/admin/media-content-studio/` |
| 125 | `125-admin-tools-consumables.webp` | `/admin/inventory-operations/` |
| 126 | `126-admin-suppliers-purchases.webp` | `/admin/project-material-planner/` |
| 127 | `127-admin-workflow-production.webp` | `/admin/project-workflow-routing/` |
| 128 | `128-admin-reports-analytics.webp` | `/admin/project-discovery-overview/` |
| 129 | `129-admin-backup-maintenance.webp` | `/admin/operational-continuity/` |
| 130 | `130-admin-marketplace-integrations.webp` | `/admin/it-integrations/` |

## Implementation
- Each of the ten Admin HTML routes loads `/public/js/admin-brand-v3-set13.js?v=13`.
- The route-to-filename loader first checks the WebP can load and then adds a decorative banner before the native page header. Missing uploads show no blank banner.
- `css/brand-v3-theme.css` styles the banner and Admin panels; all artwork remains visible via object-fit:contain and mobile horizontal scrolling.
- `public/js/brand-v3-auto.js` catalogs the filename map. The middleware stylesheet cache query was refreshed.
- Genuine products, tools, supplies, private imagery, real stats, forms, permissions and safe-read operational boundaries are unchanged.

## Release
WebP file upload and any main/Cloudflare Production promotion are separate from these dev code changes. Check repository assets, CI, and deployed pages before calling Production GREEN.