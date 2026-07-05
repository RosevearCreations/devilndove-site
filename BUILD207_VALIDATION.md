# Build 207 Validation Notes

## Scope

Build 207 strengthens the review-first workflow at the product-media boundary:

- adds a **Product Media → Content Studio → CAIP** status panel;
- adds explicit, auditable package creation / refresh and CAIP refresh actions;
- keeps source media, public release, rights, gallery order, and derivative outputs unchanged by those actions;
- applies the existing public media consent rule to public catalog-card image selection and curated featured-product cards;
- retains the two-main-document handoff model: `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.

## Automated checks completed

- `node --check` passes for `functions/api/admin/product-content-bridge.js`, `functions/api/products.js`, `functions/api/featured-products.js`, and `public/js/admin-product-content-bridge.js`.
- CSS brace balance is zero after the responsive bridge layout was added.
- Public product-card image handling still allows an unannotated first-party product image, rejects `blocked` / `consent_needed`, and requires an attached consent record to explicitly permit public use.
- The bridge endpoint uses admin authentication and records completed actions through the existing admin audit helper.
- No SQL migration is required to deploy the UI/endpoint. The explicit package action uses the existing Content Studio / CAIP additive schema routines only when an approved product is intentionally chosen.

## Deployed checks still required

1. Sign in as an administrator and open `/admin/catalog-media/?product_id=<approved-product-id>#product-media-workflow`.
2. Confirm the new **Content Studio → CAIP handoff** card names the selected product and accurately shows `Not started`, `Content package ready`, or `CAIP connected`.
3. On an Approved or Published product, use **Create content package + CAIP** once. Confirm:
   - Content Studio receives one source-linked package;
   - CAIP receives the linked reference project;
   - original `product_images`, `media_assets`, product fields, R2 objects, gallery order, public release status, and rights records stay unchanged.
4. Use **Refresh CAIP only**. Confirm a new CAIP run/event appears without generating a derivative or public post.
5. On a Draft or Revision product, confirm package creation remains disabled.
6. Mark a product image as `blocked` or `consent_needed` in the media review workflow and confirm it does not appear in `/api/products` results or the featured-products card response.
7. Use a valid public-use consent record for a reviewed product image and confirm it can remain in public product-card results.
8. Test the catalog-media page on a phone-width viewport, tablet width, and desktop. The bridge card should collapse to one column without horizontal overflow.
9. Keep the separate login troubleshooting path unchanged until the failed POST response code or Cloudflare Function log is available.
