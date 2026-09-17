# Release 467 — Build 172 Product Media Save Reliability

Build 172 repairs the Product Media & Image Editor failure reported on `/admin/catalog-media/?product_id=50`: image edits could return HTTP 500, newly added images could appear not to persist, and recovered/stale media references could drive `GET /api/admin/product-image-editor?product_image_id=...` into HTTP 404.

## Root causes repaired

1. The Build 164 client kept `state.inFlight=true` while calling `loadProduct()` after Add/Replace/Remove. `loadProduct()` refused to execute while `state.inFlight` was true, so a successful mutation could not refresh the authoritative gallery or reload the new image.
2. Product image add/replace mixed core `product_images` persistence with optional legacy annotation columns. A later optional annotation write could fail after R2/core work had already started, making the user-visible result ambiguous.
3. The media workspace treated any recovered role/asset reference carrying a historical `product_image_id` as an editable canonical gallery image. If the referenced `product_images` row no longer existed, selecting it produced `Product image was not found`.
4. Successful metadata saves only updated the page-level status area; there was no persistent local receipt beside the Save action.

## Build 172 behavior

- Add/Replace/Remove use internal authoritative `fetchProduct()` / `fetchImage()` refresh functions that are permitted during the explicit mutation lifecycle.
- A successful Add or Replace is not reported until the canonical `product_images` row is committed.
- If a new R2 object is written but the canonical `product_images` insert fails, the new R2 object is deleted on a best-effort rollback path.
- Optional `product_image_annotations` fields use bounded read-only schema discovery on an explicit image action. Existing columns are written; unavailable optional fields return a warning instead of turning the core Product image save into HTTP 500.
- There is no request-time schema DDL.
- Canonical gallery rows are loaded before featured/media-role/media-asset recovery. Recovered references are display-only and never sent to the image editor as if they were canonical rows.
- Successful Save/Add/Replace/Remove/Reorder/Score actions show a local `Saved ✓` receipt with the image ID or action and local time.
- The old `body data-admin-page="product-media-v164"` marker is retained for compatibility with older proof surfaces while the page loads `admin-product-media-editor-v172.js?v=172`.

## D1 / R2 boundary

Build 172 remains low-read and explicit-action-only. There is no Product catalog scan, no R2 listing, no autosave, no observer, and no background refresh. Read-only `PRAGMA table_info(product_image_annotations)` is bounded to explicit image detail/save compatibility and is cached per Worker isolate. No canonical D1 migration is introduced.

R2 mutation occurs only when the administrator explicitly chooses Add or Replace. Remove preserves the R2 source object as before.

## Acceptance

Development must pass:

- `scripts/release467_build172_gate.py`
- retained `scripts/release467_build164_gate.py`
- retained `scripts/release467_build165_gate.py`
- JavaScript syntax for the Product Media client and four Product Media API/helper modules
- normal repository/Application/System/Cloudflare Development gates

Production may be promoted only from the exact fully-green Development SHA. This is a zero-canonical-migration runtime repair; Production D1 business data must not be rewritten as part of promotion.
