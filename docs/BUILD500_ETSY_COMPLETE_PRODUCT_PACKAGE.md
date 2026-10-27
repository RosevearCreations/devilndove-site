# Build 500 — Verified Etsy linking and complete Product package

## Owner workflow

1. Save the canonical Product (name, description, CAD price, inventory, shared tags) and attach original photos in **Media**. Every gallery image must have store/Etsy/Marketplace public-use permission, alt text, verified dimensions of at least 800×800, and a supported original JPEG/PNG in Product R2. No subset selection for Etsy.
2. Open **Etsy**. Its first card displays the saved Product's Etsy listing ID, if one exists. If an Etsy draft was already made outside this flow, enter its exact Etsy listing number once and approve the verified link. For Product #53, the owner's photographed candidate `4603838854` is prefilled as a suggestion only; live shop, draft state, title and Canada-only shipping must be checked before the link is saved.
3. For a new listing, complete the one-time Etsy category, Canadian shipping/processing and actual packed parcel settings. They are validated afresh against the authorized shop. A single **Create complete Etsy draft + all photos** owner approval records the receipt, creates one unpublished draft, saves Etsy's returned listing ID, transfers all approved gallery originals sequentially, syncs native tags and changed advanced fields, then performs live readback.
4. For a linked listing, a single **Update this Etsy listing + all photos** owner approval updates the same draft's saved fields, transfers only as-yet-untransferred originals, syncs tags and advanced metadata, and verifies the final photo inventory and tags. No second draft is created.
5. The old six-section controls remain under **Advanced Etsy troubleshooting**, closed by default. HOLDs explain the precise issue and never auto-retry an uncertain provider write.

## Acceptance and limitations

- A **complete package** includes every canonical gallery photo, not only manually selected export images. Any unapproved, missing, over-limit, non-R2 or previously uncertain photo holds the entire send before a new provider write.
- Product #53 must match canonical original image IDs `344`, `345`, and `346` for this particular three-photo acceptance. A different gallery requires owner re-review.
- New Etsy IDs are returned by the existing `create_draft` response, persisted in the existing `marketplace_syndication_drafts.external_reference` row, checked by a fresh local read, and displayed on the Product identity card. SKU and slug remain Product-owned; remote updates use the linked listing ID, not a guessed SKU/slug lookup.
- Etsy API image uploads are separate sequential calls after draft creation. Each already has a durable at-most-once image claim, a confirmed Etsy image ID and live photo readback. Unknown results halt the sequence, leaving previously completed steps visible in audit receipts.
- Remote photo inventory must match local confirmed receipts before another image may be sent. Existing untracked Etsy photos require human reconciliation, not blind duplicate uploads or deletions.
- Final Etsy acceptance needs an exact linked listing ID, approved gallery count, all image receipt IDs present on the draft, and matching native Etsy tags on live readback. The store is checked against the same canonical gallery; Facebook Marketplace is a **manual-only** handoff until authorized Meta capabilities exist. It is never claimed as an automated Facebook upload.
- Creation and updates remain **unpublished**, Canada-only, verified-Admin and explicit owner-action only. A completed code deploy does not prove that live Product #53 passed acceptance. The signed-in owner must review the Product's live media/permissions and execute the transfer.
- No schema migration or new D1 database is required. The existing `admin_action_audit`, `marketplace_syndication_drafts`, `products`, `product_images`, and `product_image_annotations` remain authoritative.

## Verification

`node scripts/release467_build500_etsy_complete_package.test.mjs`

Run earlier Build 493–499 Etsy regression scripts, JavaScript syntax checks, Cloudflare Preview and Production Pages deployment checks, then a signed-in owner acceptance for Product #53. Do not mark its live transfer complete without corresponding provider readbacks and audit receipts.

**Next expected Build 501 — Etsy Package Resume Diagnostics, Verified Listing-ID Recovery and Owner Mobile Usability Retest.**
