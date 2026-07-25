# Devil n Dove AI Handoff — Build 220

## Read these two files first
1. `AI_HANDOFF.md` — current architecture, safety boundaries, deployment requirements and active workflows.
2. `PROJECT_STATUS_AND_ROADMAP.md` — business status, launch gates, SEO guardrails, next 20 steps and current risks.

All other root Markdown files are specialist references or retained build history. They must not override this canonical pair.

## Build 220 outcome
Build 220 adds four connected operating workflows:

1. **Duplicate-draft cleanup** — draft product rows now show **Remove duplicate draft**. The action performs a server preflight, refuses any ordered/referenced/reserved product, requires the exact phrase `DELETE PRODUCT`, and requires current-admin password confirmation. Products with business history must be archived instead.
2. **Quantity specials** — a saved product can have minimum-quantity price breaks such as one soap at the regular price and three or more at a lower price per bar. Browser displays are advisory; `checkout-create-order` resolves the valid unit price again from D1.
3. **Limited product sets** — a product may reserve finished component products. Only complete sets are exposed as available. Component products have set reservations subtracted from their own storefront availability, preventing the same units from being offered both individually and in a set.
4. **Inventory purchase lots** — Tools & Supplies rows now open a Lots editor for separate purchase date, received date, order number, supplier/SKU/ASIN, source URL, quantity, remaining quantity, cost, shipping, tax, expiry, storage, status and notes.

Build 220 also makes **content-only Creative Projects** explicit. A project such as Laurie’s hair-colouring video can create its own Content Studio package and CAIP review path without creating or linking a storefront product.

## Deployment
Apply:

`database_build220_quantity_sets_lots_content_only.sql`

The code also uses additive `CREATE TABLE IF NOT EXISTS` guards, but the migration should be applied deliberately before production testing. Cloudflare Pages still requires the D1 binding named `DB` (or the existing supported fallback binding where already configured).

## New or changed endpoints
- `GET/POST /api/admin/product-offers`
- `GET/POST/DELETE /api/admin/inventory-lots`
- Existing `GET/POST /api/admin/delete-product` now has a clearer draft-cleanup route in the UI.
- `GET /api/product-detail` returns `quantity_price_tiers`, bundle details and effective available quantity.
- `GET /api/products` subtracts component reservations from component-product availability.
- `POST /api/checkout-create-order` revalidates quantity-tier pricing and effective set/component availability.
- `GET /api/admin/product-release-preflight` includes quantity-special and set checks.
- `POST /api/admin/creative-process` can create a product-backed or content-only Content Studio handoff.

## Safety boundaries
- Never delete an ordered, published, reserved or otherwise referenced product. Archive it.
- Quantity prices must be resolved server-side; never trust a browser-submitted price.
- A set reservation is not a physical inventory count. It allocates finished-product availability so components cannot be double-sold.
- Do not silently alter the main Tools & Supplies on-hand quantity when a purchase lot is recorded. Lots are traceability evidence until a reviewed reconciliation/posting workflow is completed.
- Content-only projects never create products automatically.
- Content Studio and CAIP remain review-first. Generated plans, summaries and media selections are not publication permission.
- Social OAuth and publishing remain staged until provider credentials, approvals, token storage, refresh and disconnect controls are proven.

## Known launch-critical limitation
The storefront now validates quantity pricing and set/component availability when an order is created, but a complete paid-order inventory settlement and cancelled/refunded-order restoration workflow still requires production proof and further hardening. Treat this as a launch gate for limited sets and scarce one-of-a-kind stock. See `PROJECT_STATUS_AND_ROADMAP.md`.

## Product media rule
The product model supports up to seven operating images: one featured image plus up to six supporting gallery images. Catalog Media remains authoritative for image order, role, alt text, rights/consent and public approval. Inventory reference images do not replace storefront product media.

## Validation
Follow `BUILD220_VALIDATION.md` after deploying the migration and Functions. Do not publish a limited set until the component-reservation, checkout conflict and cancellation/restoration tests are completed.
