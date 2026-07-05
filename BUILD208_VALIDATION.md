# Build 208 Validation Notes

## Scope

Build 208 adds a **read-only Product Release Preflight** and an explicit **Featured Image Sync** operator control.

- New admin page: `/admin/release-preflight/`.
- New read-only API: `/api/admin/product-release-preflight`.
- New confirmation-gated write API: `/api/admin/product-featured-image-sync`.
- New admin-only artwork: `assets/release-preflight-placeholder.svg`.

No D1 migration is required.

## Automated checks completed

- `node --check` passes for the new preflight endpoint, the explicit sync endpoint, the preflight browser client, and the Catalog Media context client.
- New route/page is admin-only and `noindex,nofollow`.
- The preflight endpoint has no DDL, migration, package-create, CAIP-sync, publication, provider, R2, or media mutation calls.
- The only new write endpoint requires an authenticated admin, confirmation in the UI, a retained product-image/media-library candidate URL, and audit attempts. It updates only `products.featured_image_url`.
- CSS includes phone/tablet/desktop fallbacks for controls, stage cards, two decision cards, and product summary without horizontal overflow.
- Admin page H1 and overall public-page one-H1 scan are required again after deployment.

## Required deployed checks

1. Sign in as admin and open `/admin/release-preflight/?product_id=<known-id>`.
2. Search by numeric Product ID, product number, name, SKU, and slug.
3. Confirm `destination=both`, `workshop_journal`, and `website_gallery` apply the matching Content Studio deliverable and Release Board decision checks, without writing anything.
4. Use a Draft/Needs Changes product. Confirm handoff blocks on Catalog approval/status.
5. Use an Approved/Active product with real media but no Content Studio package. Confirm the page does not create one automatically and shows the Content Studio owner link.
6. Use a content package with no CAIP project. Confirm the page does not create one automatically and blocks only the CAIP stage.
7. Use a package with approved Content Studio/CAIP records but no Release Board public draft. Confirm handoff can pass while publish remains blocked.
8. Use a draft that passes Release Board readiness but is not approved. Confirm publish remains blocked until an operator approves it in Release Board.
9. Verify a `blocked`/`consent_needed` lead image cannot pass Featured-image safety.
10. Verify an explicit public-use consent record is respected. Verify legacy unannotated media appears as a compatibility candidate plus a non-blocking request for explicit review.
11. Locate a product where the featured URL resolves from `product_images` or `media_assets` but the stored product field is empty. Use **Sync resolved featured image**:
    - accept the browser confirmation;
    - confirm `products.featured_image_url` is populated after reload;
    - confirm gallery order, media files, roles, annotations, consent, Content Studio, CAIP, and public-release state stay unchanged;
    - confirm a product-media/admin audit row when the associated tables are present.
12. Test Catalog Media and Release Preflight at 360px, tablet width, and desktop width.
13. Re-run Build 206/207 validation plus `POST_DEPLOY_SMOKE_TEST.md`.

## Safety boundary

A passing preflight is an operator decision aid, not a public release. Only the Release Board can approve/publish its prepared draft, and every source/right/output boundary remains human-controlled.
