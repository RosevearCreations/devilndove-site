# Release Notes — Build 207

## Product-media workflow

- Added a product-specific Content Studio → CAIP status card to Catalog Media.
- Added explicit, audited create/refresh and CAIP-refresh actions for Approved/Published products.
- Kept all actions reference-only: no public publishing, source-media overwrite, file movement, rights elevation, gallery reorder, or derivative generation.

## Storefront media safety

- Public product-card and featured-product selections now omit images explicitly marked blocked or consent-needed.
- Where a consent record exists, it must permit public use before the associated image is selected.

## Mobile and documentation

- Added a responsive two-column-to-one-column layout for the new bridge card.
- Added a private admin visual placeholder for the package-review handoff.
- Updated the two main handoff documents and added `BUILD207_VALIDATION.md`.

## Deployment note

No D1 migration is required for Build 207 deployment. The package creation control only calls existing additive Content Studio / CAIP schema routines after an administrator explicitly selects an eligible product.

## Remaining known issue

The login `POST /api/auth/login` 500 remains intentionally separate until its response body or Cloudflare Function log supplies an exact safe error code.


## Build 206 retained highlight

- Added catalog filtering/sorting, Product ID search, featured-image resolution across product/media layers, tax-rate display normalization, and product context in Catalog Media.
- The Build 207 handoff extends these controls; it does not replace the Build 206 validation checks.
