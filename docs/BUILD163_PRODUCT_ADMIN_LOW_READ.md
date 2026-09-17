# Build 163 — Product Admin low-read architecture

Build 163 separates the Product Browser, Product Editor, Product Media workspace and selected-image scoring so opening one product no longer wakes the entire Product admin stack.

## Runtime contract

- `/admin/products/` is a bounded browser and routes directly to `/admin/product-editor/?product_id=<id>`.
- Product Editor startup loads one selected Product and does not autosave, scan readiness, refresh the full catalog, scan media, or wake inventory/resource tooling.
- Product saves are explicit and limited to the selected Product plus its SEO row.
- `/admin/catalog-media/` loads only the selected Product gallery, capped at 20 image rows, with no R2 library listing.
- Image metadata and image quality scoring are explicit selected-image operations.
- Primary-image scoring keeps the existing acceptance thresholds: at least 1200x1200, alt text length at least 12, quality score at least 70.
- No automatic gallery rescoring, MutationObserver polling, interval polling, or request-time DDL is part of the current Product admin path.
- Service Worker handling stays out of Admin/API authority paths.

## D1 read policy

Normal Product admin activity is expected to use bounded key-based reads. Product media transport remains separate from D1-backed Product metadata. Heavy catalog rollups, whole-library media scans, automatic quality scans, and background readiness sweeps are not allowed on Product Editor startup.

## Release acceptance

The Build 163 gate must prove the direct editor contract, explicit save/scoring operations, bounded media projection, zero request-time schema mutation and syntax validity. Release 461 image-quality compatibility must remain GREEN.
