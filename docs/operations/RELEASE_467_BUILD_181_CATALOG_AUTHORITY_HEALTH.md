# Release 467 — Build 181 Product / Inventory / Tool / Image Authority Health

## Why this build exists

Build 180 removed browser-freeze pressure from Product detail, Media Studio and Inventory Operations. Build 181 returns to the catalog rework itself now that Development D1 is fully functional again.

The catalog has several established specialist authorities, but the operator still needs one place to answer a simpler question: **what should we fix next?** This build adds a bounded, read-only D1 health workspace that connects Products, finished-product images, Product-to-Tool/Supply links, operational Inventory rows and catalog image-reference drift without recreating the retired all-in-one Product editor.

## New operator surface

- Admin page: `/admin/catalog-health/`
- API: `GET /api/admin/catalog-health`
- Module owner: Storefront
- Startup behavior: summary only; issue rows are explicit operator-triggered reads
- Maximum issue rows per request: 40
- Polling/timers: none
- Automatic repair: none

The page exposes two live D1 summary groups:

### Product health

- active Product count;
- missing featured image;
- no gallery images;
- gallery depth under three images;
- Product images with alt text below the current 12-character quality threshold;
- Product resource links whose Tool/Supply identity does not resolve to active Inventory;
- finished Products with inventory tracking enabled but zero recorded quantity.

### Inventory, Tools and Supplies

- active Tool/Supply Inventory rows;
- Tool count;
- Supply count;
- blank operational image URLs;
- Inventory-vs-`catalog_items` image reference drift;
- duplicate active identities sharing the same `source_type + external_key`;
- zero-on-hand Supply rows.

## Repair workflow

The health page does not become another mutation authority. It routes each issue to the existing specialist owner:

- Product facts -> `/admin/product-editor/`
- Product images -> `/admin/catalog-media/`
- Inventory / Tool / Supply facts -> `/admin/inventory-operations/`
- buyer-facing result -> `/shop/product/`

This preserves the Build 162-180 low-read architecture while making cross-authority gaps visible.

## D1 policy

The user confirmed that D1 is fully functional again. Build 181 therefore restores useful Development D1 acceptance for catalog work rather than treating D1 as unavailable.

The Build 181 workflow performs **read-only Development D1 proof** against the exact configured Development database:

- database name: `devilndove-dev`
- database id: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- required tables: `products`, `product_images`, `product_resource_links`, `site_item_inventory`, `catalog_items`
- representative live counts are read and recorded;
- no DDL or business-data mutation is permitted.

Production promotion remains exact-SHA controlled. Build 181 introduces no schema migration, so Production does not receive a schema/data copy from Development.

## Safety boundary

Build 181 is a code-only catalog-observability and operator-navigation build.

It performs:

- no canonical migration;
- no request-time DDL;
- no Product mutation;
- no stock/count mutation;
- no Tool/Supply mutation;
- no R2 write, delete or bucket scan from the new endpoint;
- no publication;
- no social/provider execution;
- no payment/refund action;
- no accounting posting.

## Acceptance

Build 181 is GREEN only when all of the following are true:

1. Build 181 source gate passes.
2. JavaScript syntax passes for the new API and client.
3. the exact Development D1 read-only probe succeeds against `devilndove-dev`.
4. retained Build 180, 179, 166 and Inventory regressions remain GREEN.
5. exact-SHA Development System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene are GREEN.
6. the same Development SHA is promoted non-force to `main`.
7. Production Pages, Production Live Resource Integrity, Product Production Browser, Product Route Production and Build 181 proof are GREEN on that exact SHA.

## Next build

Build 182 should use this new health surface to improve **Product record completeness and buyer-facing facts** without increasing Product Browser startup reads. Image, Inventory and Tool/Supply cleanup remains visible as a parallel queue rather than being hidden behind Product editing.
