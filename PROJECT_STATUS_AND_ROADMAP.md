# Devil n Dove Project Status and Roadmap — Build 221

## Current position
Devil n Dove remains in launch-readiness and operational-polish. Catalog, media, inventory, projects, Content Studio, CAIP, social review, order/payment and accounting foundations exist. Build 221 improves three daily operating gaps: removing unused duplicate records, tracing repeated material purchases, and creating packaging from structured data.

## Completed implementation actions in Build 221
1. Added a dedicated Draft & Archive Cleanup Centre above the product editor.
2. Added search and Draft/Archived/All filters independent of the long product table.
3. Added row-level removal preflight with protected-history explanation.
4. Corrected safe classification for product-owned working records, including older product-reference tables without declared foreign keys.
5. Allowed unused linked recipe/material rows to be discarded with a duplicate while requiring the full review only when reserved stock may be involved.
6. Hardened Archive with DB/DD_DB compatibility, audit logging, incident fallback, typed deletion confirmation and protected-history controls.
7. Added the Packaging Studio admin route and dashboard navigation.
8. Added structured D1 packaging templates and packaging projects.
9. Added immutable packaging review versions and review states.
10. Added packaging export-history evidence.
11. Added the supplied scalloped soap-ribbon reference template.
12. Corrected the print canvas so the medallion can extend beyond the 19 mm band without clipping.
13. Added curved upper/lower text, bilingual centre title, side ornaments, badge shapes and colour controls.
14. Added a one-click reference example using Coconut milk / Luxury Soap / Savon de luxe / Sweet Vanilla.
15. Added SVG, PNG, JPG and Print/Save PDF preparation.
16. Added browser-local packaging draft fallback when the network or D1 is unavailable.
17. Added common Canadian cosmetic-label field preflight and explicit legal-review boundaries.
18. Added lot-to-main on-hand comparison, discrepancy display and reconciliation history.
19. Added deliberate audited application of lot totals to main inventory plus manual/FIFO/FEFO preferences.
20. Updated the canonical Markdown pair, Packaging Studio specialist guide, schema reference, current/full/store/core schema guidance, release notes, custom-request canonical/Open Graph metadata, validation guide and changed-file manifest.

## How the workflows now operate

### Remove the triplicate drafts or archives
Open Products and use **Draft & Archive Cleanup**. Select Drafts or Archived, search the product, and choose **Check removal**. **Permanent remove** becomes available only when the live preflight finds no protected history and no material action requiring the full correction panel. Archiving is not a prerequisite for an unused draft; an unused archived duplicate can also be checked and removed.

### Recreate the supplied soap ribbon
Open Packaging Studio, create a project and choose **Soap ribbon — scalloped medallion reference**. The photographed layout maps:
- Collection to the upper curved text.
- English and French product identity to the centre.
- Product or scent name to the lower curved text.
- Ingredients, dealer/contact, claims and net quantity to the band panels.

The built-in example reproduces the visible wording as a starting demonstration. Replace every field with the real product facts before saving a review version or printing.

### Reconcile repeated purchases
Open Tools & Supplies, choose **Lots**, and enter each purchase separately. The reconciliation panel compares remaining lot quantities with the main on-hand count. Record a review without changing inventory, or apply the lot total deliberately with typed confirmation. Choose Manual, FIFO or FEFO as a future-depletion preference.

## Launch sanity check

### Green — structurally ready
- Public catalog and product detail foundations.
- One featured plus six supporting product images.
- One-H1, title/meta/canonical and structured-data guardrails.
- Review-first product, media, content and packaging workflows.
- Draft/archive cleanup with historical-record protection.
- Tools & Supplies table editing, lots and reconciliation evidence.
- Quantity specials and limited-set availability calculations.
- Product-backed and content-only Creative Projects.

### Yellow — deployed proof or operating completion required
- Production authentication and password-reset proof.
- Stripe/PayPal payment and webhook idempotency.
- Paid-order inventory consumption and cancellation/refund restoration.
- Limited-set component settlement after payment.
- Tax, pickup, Canada/US shipping and refund calculations.
- Transactional email delivery.
- Seven real images, alt text and rights review for launch products.
- Physical packaging print proof, formula/INCI review and Canadian label review.
- Accessibility/device testing and backup/restore rehearsal.

### Red — do not assume complete
- Proven concurrent oversell protection for the final unit/set.
- Automatic FIFO/FEFO lot depletion tied to approved material consumption.
- Provider-approved production social OAuth and token lifecycle.
- Fully automated TikTok/YouTube publishing.
- Accountant-approved month-end and export package.

## Next 20 steps
1. Apply and verify `database_build221_packaging_studio_cleanup_lot_controls.sql` on staging, then production D1 after backup.
2. Use the Cleanup Centre to remove two disposable duplicate rows and confirm the surviving product and retired numbers remain correct.
3. Test an archived disposable duplicate separately to confirm Archive is not a permanent-deletion blocker by itself.
4. Create the first real soap-ribbon project from the supplied reference and measure the physical printed badge, band and wrap length.
5. Confirm the actual soap-bar dimensions and adjust template dimensions only from measured print evidence.
6. Complete formula-specific INCI, bilingual product identity, dealer address, contact, metric quantity, warnings and claims review for the first soap.
7. Save and approve a Packaging Studio version only after a physical print proof has been checked for legibility and alignment.
8. Add template-level safe-area, bleed, cut/fold guides and printer calibration marks.
9. Add approved font-family controls with embedded/outlined print fallback rules.
10. Add QR-code generation linked to the canonical product or care page without making the label depend on the QR code.
11. Reconcile all repeated goat-milk base, oils, mica and coloured-base purchases against physical stock.
12. Add explicit lot selection when approved Creative Project material usage posts to inventory.
13. Implement automatic FIFO/FEFO suggestions, while keeping the final lot choice reviewable.
14. Complete transactional paid-order inventory settlement for regular products and sets.
15. Add failed/expired payment, cancellation, refund and partial-refund inventory restoration.
16. Add idempotency and concurrency tests so payment/webhook retries cannot consume stock twice.
17. Run Product Release Preflight on every intended launch product and close required blockers.
18. Prove authentication, checkout, payment, tax, shipping, email, mobile and accessibility paths on deployed production-like infrastructure.
19. Complete realized-margin reporting, role authorization for reversals/accounting exports, CAIP-summary selection and cost-template management.
20. Complete social OAuth only after provider approval, encrypted token storage, refresh and disconnect behaviour are proven.

## SEO and local-search guardrails
Google continues to recommend helpful people-first content, using the words buyers use in prominent places such as titles and main headings, and descriptive alt/link text. Titles should remain descriptive and concise. Local results remain primarily influenced by relevance, distance and prominence; no implementation can guarantee first-page placement.

Continue:
- exactly one clear H1 per exposed page;
- unique descriptive titles and meta descriptions;
- buyer-language category/product copy rather than internal system terminology;
- truthful Southern Ontario and Tillsonburg relevance where the business actually serves or sells;
- crawlable descriptive internal links;
- consistent mobile/desktop visible content and alt text;
- Product structured data matching visible price and availability;
- no thin public pages for admin packaging templates or quantity tiers.

## Documentation authority
The authoritative pair remains `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`. `PACKAGING_STUDIO.md` is the current specialist guide. `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md` and `NEW_CHAT_STATUS.md` are compatibility pointers. Build validation files remain retained evidence.
