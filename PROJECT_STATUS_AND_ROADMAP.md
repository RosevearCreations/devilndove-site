# Devil n Dove Project Status and Roadmap — Build 195

This is the primary human/business roadmap. Read `AI_HANDOFF.md` for technical deployment details and `MARKDOWN_INDEX.md` for specialist references.

## Executive sanity check

Devil n Dove is now a full small-business platform: storefront, handmade/vintage presentation, product/media workflows, inventory/cost groundwork, marketplace exports, customer proof, local SEO, deployment controls, and mobile/desktop administration.

The strongest remaining value is **calm daily use and truthful real data**. Build 195 removes three recurring points of confusion: incorrect-product cleanup, system numbering/SKU behaviour, and unreadable inventory item cards.

## Build 195 completed — product lifecycle and readable inventory

1. Added a safe **Delete unused** flow for mistakenly entered products.
2. Permanent deletion now requires current admin password, reason, and exact `DELETE PRODUCT` confirmation.
3. Any product referenced by orders or other business/history tables is blocked from deletion and must be archived instead.
4. Added `product_deletion_audit` so an intentional delete retains an internal factual record without restoring the product to storefront data.
5. Added persistent `catalog_product_number_sequence` so product system numbers do not move backwards or get reused after a delete.
6. Kept `products.product_number` unique and made blank SKU entry generate a readable unique `DND-xxxxx` SKU.
7. Made desktop and mobile creation use the same permanent-number allocation path.
8. Improved product editor wording so staff can distinguish internal System # from SKU.
9. Added a plain-language product lifecycle guide inside desktop catalog/product screens.
10. Added `site_inventory_item_descriptions` as a safe sidecar table rather than duplicating inventory names.
11. Added an inventory description field that renders below the item image.
12. Reworked tool/consumable table layout so long names wrap as normal readable phrases rather than one word per row.
13. Added mobile responsive behaviour for inventory cards/table scrolling.
14. Preserved current one-H1, title/meta, canonical, alt-text, and local-page checks.
15. Preserved approved-media/placeholders and did not claim placeholder art is real product proof.
16. Updated all current schema references and migration controls for Build 195.
17. Updated command-center and handoff documentation with lifecycle and inventory test priorities.
18. Added a detailed owner test guide for deletion, numbering, SKU, inventory descriptions, phone, and desktop checks.
19. Kept historical Markdown as archive/specialist reference rather than deleting context needed by a future AI.
20. Revalidated JS, JSON, public-page H1, CSS balance, full schema, migration rerun, preflight, blockers, and ZIP integrity.

## Current strengths

- One-H1, title/meta, canonical, structured-data, image-alt, and local-page guardrails.
- Product readiness, cost/margin gates, marketplace validation, and reviewed override foundations.
- Buyer-facing product stories, care, quick facts, pickup/shipping notes, and media roles.
- Mobile and desktop product administration with D1 draft recovery and resumable media foundations.
- Consent-controlled public proof, customer stories, workshop journal, before/after, and real-media review foundations.
- Inventory tracking now supports concise descriptions beneath pictures instead of forcing long names into narrow cells.
- Deployment preflight, release control, smoke tests, fallback handling, and Cloudflare environment checklists.
- Two canonical Markdown handoff files with specialist/historical references retained.

## Current limits

1. Actual payment/marketplace fees and real material/labour/packaging/overhead/waste costs still need owner entry.
2. Product listing profiles, media roles, and inventory descriptions need truthful item-by-item data.
3. R2 derivative generation must still create real WebP/AVIF files and final `srcset` output in deployed Cloudflare.
4. Real workshop/product photography remains more valuable than placeholder graphics.
5. Search Console imports and Google Business Profile evidence need regular real owner input.
6. Stripe webhook, email delivery, R2 signed reads, and Cloudflare API actions require live evidence.
7. Customer duplicate suggestions must remain human-reviewed.
8. Low-use admin pages should not be removed until Command Center usage evidence supports consolidation.

## SEO and competitive direction

Keep these public-site habits:

- One visible H1 per public route.
- One clear, unique page title and useful meta description.
- Descriptive alt text for meaningful images; empty alt text for decorative art.
- Real approved images near relevant copy.
- Accurate local wording; never imply locations or services we do not offer.
- Product structured data that matches visible price, stock, and product facts.
- Equivalent useful content on mobile and desktop.
- Helpful product facts in scannable sections rather than dense unstructured paragraphs.

## Next 20 highest-value steps

1. Run `database_build195_product_lifecycle_sku_inventory_cards.sql` after Build 194.
2. Create one clearly marked test product, leave SKU blank, and confirm its System # and automatic `DND-xxxxx` SKU.
3. Delete that unused test product through the guarded UI and verify the audit row exists.
4. Create a second test product and confirm its System # is higher, not reused.
5. Add a description to one long-name tool/supply and verify it sits below the photo on desktop and phone.
6. Record actual payment and marketplace fees with effective dates.
7. Enter real material, labour, packaging, overhead, and waste costs for one product family.
8. Test a low-margin marketplace export and a time-limited reviewed override.
9. Add one approved product listing profile with truthful materials, dimensions, care, and pickup/shipping details.
10. Assign complete roles for one well-photographed product: main, close-up, scale, process, packaging, and social/share.
11. Replace one placeholder only with an approved real product/workshop image.
12. Run one real mobile saved-draft and resumable upload test.
13. Run one R2 derivative, signed-read, and cleanup check in Cloudflare.
14. Import one real Search Console export and create one evidence-based content action.
15. Complete one monthly Google Business Profile evidence record using factual business information.
16. Test Stripe webhook signatures and a manual email-provider send to an owner address.
17. Capture narrow-phone, tablet, laptop, and large-desktop screenshots for catalog and inventory views.
18. Review low-use admin page data in Command Center before retiring any route.
19. Review every public product claim and care note annually or when materials/processes change.
20. Keep the two canonical Markdown files current and move only historical superseded detail into `docs/archive/`.

## Deployment/testing references

- `BUILD195_PRODUCT_LIFECYCLE_INVENTORY_GUIDE.md` — exact owner steps for deletion, archive vs delete, System #, automatic SKU, and inventory descriptions.
- `BUILD194_TESTING_GUIDE.md` — homepage, shop filters, product Quick Facts, media roles, Workshop Journal, and SEO checks.
- `LIVE_TESTING_GUIDE.md` — live R2, Stripe, email, Search Console, GBP, and real-device test procedures.
- `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md` — bindings, encrypted variables/secrets, and where values come from.

## Release readiness opinion

Build 195 is ready for deployment after its D1 migration and normal preflight checks. Business readiness still depends on real costs, approved media, and saved live evidence. Do not claim guaranteed local rankings, automated financial accuracy, or completed provider checks without supporting evidence.
