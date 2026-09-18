# Release 467 — Build 184 Product & Tool/Supply Image Repair Workflow

## Purpose

Build 184 turns the image findings from Builds 181–183 into a focused repair workflow without recreating a large all-in-one media page.

The review lives in **Catalog Health** because it spans more than one authority. It does not become a new media mutation surface.

The owners remain:

- finished Product gallery, alt text, image roles, featured selection, crop/resize and Product image mutation -> **Product Media & Image Editor**;
- Tool/Supply operational image URL and catalog reconciliation -> **Inventory Operations**;
- static Home/About/Gallery/banner/page imagery -> **Media & Content Studio**;
- R2 object mutation -> existing guarded Product/Inventory media services only.

## New Catalog Health workspace

Catalog Health now includes **Product & Tool/Supply Image Repair**. It remains paused during page startup.

The operator explicitly chooses **Load image health**, **Load 40 repair records**, or **Check R2 object** for one selected image/reference. No Build 184 image request polls, observes the entire page, or runs in the background.

## API authority

The new read-only endpoint is `GET /api/admin/catalog-image-repair` with modes `summary`, `products`, `inventory`, and `r2_evidence`.

### D1 summary and repair queues

The Product review covers missing featured image, no canonical gallery, gallery depth under three useful views, gallery alt text shorter than 12 useful characters, gallery images without an explicit Product image role, a featured-image pointer that does not resolve to the canonical gallery, and Product image URLs outside the canonical Devil n Dove asset origin.

The Tool/Supply review covers blank operational `image_url`, a catalog image reference that can be reviewed when Inventory is blank, Inventory/catalog image-authority drift, and operational image URLs outside the canonical Devil n Dove asset origin.

The review does **not** automatically copy a catalog image into Inventory and does not automatically choose one side of an authority mismatch.

## R2 evidence

Build 184 adds one-object-at-a-time R2 evidence. For a selected Product image or Tool/Supply Inventory row, the current D1 image reference is read, an existing `media_assets.object_key` is preferred for Product media when available, otherwise a canonical `https://assets.devilndove.com/...` reference is converted to its R2 object key, and the bound `PRODUCT_MEDIA_BUCKET` performs a single `head()`.

This evidence path performs no bucket listing, no object-body read, no copy, no upload, no delete, and no automatic retry loop. External or unmapped image URLs are reported as source-review work rather than being treated as R2 objects.

## Product repairs

Product repair records route directly to `/admin/catalog-media/?product_id=<id>`. The existing Product Media & Image Editor continues to own add/replace/remove, alt text, gallery order, image role, public-use status, focal point, title/caption/notes, selected featured-image change and selected-image scoring. Build 184 does not duplicate those writes.

## Tool/Supply repairs

Tool/Supply repair records route to Inventory Operations with the reviewed identity placed in the ordinary Inventory search. Inventory Operations now accepts a bounded `?q=` deep-link value for this purpose. It only prefills the existing search before its normal bounded list request. It does not save or change the Inventory row.

The operator still chooses **Full edit** and reviews the record before changing its operational image URL or catalog relationship.

## Static-site media boundary

Build 184 deliberately does not attach Product/Inventory image repair to Media & Content Studio. Static-site media remains responsible for page slots, banners, galleries and other non-catalog presentation imagery.

## D1 acceptance

D1 is fully functional and remains the live catalog authority. The Build 184 Development workflow reads exact `devilndove-dev` evidence for active Products, Product gallery rows, Product alt-text attention, Product explicit-role attention, active Tool/Supply Inventory rows, blank Tool/Supply image URLs, and Inventory/catalog image-authority drift.

The workflow also proves that the tracked Development configuration binds `PRODUCT_MEDIA_BUCKET` to the Development Product media bucket. No Development business data is copied wholesale to Production.

## Safety boundary

Build 184 introduces no canonical schema migration, no request-time DDL, no Product mutation in the diagnostic endpoint, no Inventory mutation in the diagnostic endpoint, no automatic catalog-to-Inventory image copy, no automatic featured-image change, no automatic alt-text or role write, no R2 list/upload/copy/delete in the diagnostic endpoint, no provider/publication execution, no payment/refund action, and no accounting posting.

The only R2 execution added by this build is a user-triggered, single-object `head()` evidence check.

## Acceptance

Build 184 is GREEN only when the Build 184 source contract is GREEN; exact Development D1 image-evidence proof is GREEN; retained Builds 183, 182, 181, 180 and Product/Inventory media regressions remain GREEN; exact-SHA Development System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene are GREEN; that exact Development SHA is promoted non-force to `main`; and Production Pages, Live Resource Integrity, Products Production Browser, Products Route Production and Build 184 are GREEN on that exact SHA.

## Next planned build

**Build 185 — Product Resource / Cost / Usage Linkage** will repair Product-to-Tool/Supply links, missing Inventory matches, quantity-per-use/batch semantics, lot/usage behavior and cost evidence against the cleaned Product and Inventory authorities.
