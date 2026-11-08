# Release 467 — Devil n Dove Build 634: Product Image Selection & Gallery Review Usability

## Scope and owner acceptance

- Open an existing saved Product and choose **Photos**. Only the Product-authority GET and the on-demand canonical gallery GET are performed; a featured-only Product reference is reused from that authority when missing from the gallery.
- The photo grid shows larger, uncropped images at desktop and phone widths, a count, clear featured selection, saved alt text or an honest missing-alt prompt, and the source of each photo.
- Select a thumbnail to open the native keyboard-compatible review dialog. Previous/Next navigate existing images. Close or Escape returns to the editor. No new media reads, crops, uploads or publication occur in the dialog.
- Select **Use as featured** on a different photo. The Product draft changes and **Save Product** remains required to commit the new featured URL; the existing uncertain-save recovery, server authority and validation rules are unchanged.
- Open **Edit image details** to reach existing Media requirements. The Product Editor gallery **does not verify image rights or channel approvals**. Review the source originals, alt text and genuine owner authorization there before public or provider use.
- New Product mode remains gallery-disabled until a saved Product ID exists. Existing featured-only reference is labelled as such and is never portrayed as canonical gallery media.

## Verification

1. `node --test scripts/release467_build634_product_gallery_review.test.mjs`
2. `node --test scripts/release467_build633_product_guided_entry.test.mjs scripts/release467_build632_product_save_confidence.test.mjs`
3. `node scripts/release467_build556_admin_interface_inventory.mjs --check`
4. `python3 scripts/current_application_quality_gate.py`
5. `python3 scripts/migration_policy_gate.py`
6. `python3 scripts/release465_performance_budget_gate.py`
7. `node --check public/js/admin-product-editor-v163.js`
8. GitHub protected `dev` and `main` checks and live Pages deployment must show green separately.

## Boundaries

No Product schema/database migration, auth entitlement, source signature, external connection, Etsy/Meta send, publication, automatic photo mutation, new network endpoint or media permission changes. Native dialog is presentation-only. Runtime source file count stays 1,839; a measured +4,772 source bytes motivates a reviewed +5,500 limit increase, from 18,426,500 to 18,432,000 (all other limits unchanged). Build 634 passing CI does not attest to original image rights or live marketplace publication.

**Next proposed Build 635:** Product Catalog List Filtering, Sorting & Quick Image Readiness.
