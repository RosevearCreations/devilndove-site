# Devil n Dove Brand V3 — Set 12 Admin workspace cards (111–120)

**Asset directory:** `devilndove-site/assets/images/brand-v3/` (hyphen, not underscore).

The owner-provided files are **ten individual 1200 × 620 WebPs**, not a composite board. All ten files are present on `dev` as checked during the October 19, 2026 installation. Created using illustrative existing Devil n Dove brand imagery; no fake totals, state badges or controls are baked into the art.

| Number | Exact filename | Admin Dashboard workspace link |
|---|---|---|
| 111 | `111-admin-dashboard-overview-card.webp` | Dashboard Overview → `/admin/` |
| 112 | `112-admin-product-management-card.webp` | Product Management → `/admin/products/` |
| 113 | `113-admin-inventory-operations-card.webp` | Inventory Operations → `/admin/inventory-operations/` |
| 114 | `114-admin-orders-fulfillment-card.webp` | Orders & Fulfillment → `/admin/orders/` |
| 115 | `115-admin-production-calendar-card.webp` | Production Calendar → `/admin/project-resource-calendar/` |
| 116 | `116-admin-workstations-capacity-card.webp` | Workstations & Capacity → `/admin/project-capacity-planner/` |
| 117 | `117-admin-materials-costing-card.webp` | Materials & Costing → `/admin/project-material-planner/` |
| 118 | `118-admin-commissions-quotes-card.webp` | Commissions & Quotes → `/admin/commission-workbench/` |
| 119 | `119-admin-cross-project-accounting-card.webp` | Cross-Project Accounting → `/admin/cross-project-accounting/` |
| 120 | `120-admin-system-operations-card.webp` | System Operations → `/admin/system-operations/` |

**Mapped UI:** `admin/index.html` renders ten real native anchor elements under the Workspaces section. The corresponding CSS image rules are in `css/brand-v3-theme.css`; the numbered manifest is in `public/js/brand-v3-auto.js`. Images have `background-size: contain`, dark fallback backgrounds and responsive 3/2/1-column layout.

**Safety:** Original Admin actions, authenticated permissions, live figures and bounded read-only safe-home behaviour remain unchanged. No new API requests or scheduled background work. Real product, tool and supply photos are untouched.

**Deployment:** `dev` code and image checks do not establish `main` or Cloudflare Production GREEN; promote only after required release checks and deployment validation.
