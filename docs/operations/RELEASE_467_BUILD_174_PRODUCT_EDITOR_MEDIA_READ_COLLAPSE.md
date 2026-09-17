# Release 467 — Build 174 Product Editor Media Read Collapse

Build 174 reduces D1 work when an administrator opens the **Media** tab in the single-Product editor.

## Change

The Product Editor already establishes authority with one bounded Product + SEO read. The Media tab no longer calls the full Product Media recovery workspace after that.

Instead it calls the existing dedicated Product Editor media route, tightened to Build 174:

- reads only canonical `product_images` rows for the selected Product
- hard limit: 12 rows
- does not re-read `products`
- does not read `product_media_role_assignments`
- does not read `media_assets`
- does not read image-quality or annotation tables
- does not list R2
- does not retry or poll in the background

If the Product's already-loaded featured URL is not present in the canonical gallery, the browser displays that one featured-only reference directly from Product authority with **zero additional D1 rows**.

The full **Product Media & Image Editor** retains the deeper role/media-asset recovery path. That work occurs only when the operator explicitly opens that workspace.

## Safety

No canonical migration is added. No Product/image write behavior changes. No D1 business-data, R2, payment, provider, refund or accounting mutation is introduced by this build.

## Acceptance

Build 174 must pass its dedicated read-collapse proof, retained Builds 173/169/168/165 Product proofs, normal source/quality/System Gate checks, exact Development Preview deployment, then identical-tree Production promotion and post-deploy Product/live-resource proofs.
