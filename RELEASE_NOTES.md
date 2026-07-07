# Build 209 — Inventory Operations Desk and Read-only Maker-input Context

- Repaired `/admin/inventory-operations/` contrast, nested-card backgrounds, table/action-column visibility, and responsive overflow behavior.
- Added desktop-contained tables plus labelled mobile inventory, movement, and stock-report cards.
- Added product context support through `/admin/inventory-operations/?product_id=<id>`.
- Added a non-blocking Inventory & maker-input context stage to Product Release Preflight.
- Added `assets/inventory-operations-placeholder.svg` for internal admin use only.
- Added `BUILD209_VALIDATION.md`.
- No D1 migration is included.
- The evidence-first login incident remains separate and unresolved.

---

# Build 208 — Product Release Preflight

- Added read-only cross-workflow product release preflight.
- Added explicit audited featured-image URL synchronization from existing retained media.
- Added Build 208 CAIP release-preflight specification and validation guidance.
- No mandatory schema migration is included.
- Legacy D1 login migration files remain inert safety stubs; do not run schema repair from a generic login error.

---

# Release Notes — Build 208

## Product Release Preflight

- Added `/admin/release-preflight/`, a protected, read-only product release checklist.
- It combines catalog facts, product-media review/consent signals, Content Studio package state, CAIP governance/evidence, and Content Release Board checks.
- It distinguishes **Ready to pass to Release Board** from **Ready to publish** so a finished upstream package is never misrepresented as a live public item.
- Destination-aware publication checks support Workshop Journal, Website Gallery, or both.
- Each blocker links to its owner workflow; the preflight itself does not create, approve, publish, transform, or grant rights.

## Featured-image resilience

- Added explicit `product-featured-image-sync` for the existing three-layer catalog-media resolver.
- The Catalog Media button appears only when a known gallery/media-library source resolves but `products.featured_image_url` is empty.
- Confirmation and audit are required. Only the product field changes; source media, R2 objects, image order, roles, annotations, consent, Content Studio, CAIP, and publication state remain untouched.

## Mobile, visual, and documentation

- Added responsive mobile/tablet/desktop layout for the new decision workspace.
- Added an admin-only release-preflight placeholder SVG.
- Consolidated Build 208 technical and business state in `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.
- Added `BUILD208_VALIDATION.md`.

## Deployment note

No D1 migration is required for Build 208.

## Known separate incident

The login `POST /api/auth/login` 500 remains evidence-first. Do not run a legacy auth migration without the sanitized endpoint response or matching Cloudflare log.
