# Devil n Dove Project Status and Roadmap — Build 222

## Current position
Devil n Dove is in launch-readiness and operational-polish, not early feature discovery. Catalog, media, inventory, projects, Content Studio, CAIP, packaging, social review, checkout, order and accounting foundations exist. The remaining work is primarily production proof, data completion, workflow hardening and controlled opening.

Build 222 implements the soap-label automation specification as a structured CAIP packaging workflow and makes the launch blockers easier to find and complete.

## Completed implementation actions in Build 222
1. Added a dedicated `/admin/packaging/soap-labels/` route with exactly one H1 and noindex protection.
2. Added direct Soap Label Studio and Startup Readiness cards to the Admin Dashboard.
3. Reworked the soap ribbon renderer to follow the approved Glacial Purple layout order and visual hierarchy.
4. Added the approved reference image as an internal design reference rather than embedding it as production artwork.
5. Added reusable purple, green and oatmeal rose SVG assets.
6. Added a nine-tab editor: Product, Ingredients, French, Rose & Colours, Claims, Layout, Preview, Print Test and Versions.
7. Added structured bilingual ingredient rows with order, INCI, organic and allergen-review fields.
8. Added structured bilingual claim rows with icon, approval and compliance-note fields.
9. Added exact-dimension summaries and guide controls for bleed, safe areas, folds and overlap/glue zones.
10. Added a photo-fit 11 × 1.5-inch profile with a centred 0.75-inch band and 2 × 1.5-inch front oval.
11. Added a separate 50 mm rear-seal profile so the specification conflict is visible and testable rather than clipped.
12. Added normalized D1 tables for soap templates, products, ingredients, claims, exports and print tests.
13. Added synchronization between the Packaging Studio project and normalized soap-label rows.
14. Added SVG, PNG, WebP, JPG and browser-print preparation with predictable filenames.
15. Added SHA-256 export checksum recording and version/export evidence.
16. Added physical 100%-scale print-test records with measured dimensions, wrap fit, legibility, overlap and proof-image fields.
17. Blocked label approval until a passed physical print test exists.
18. Added browser-local recovery when D1 or the network is unavailable, without presenting the fallback as a successful server save.
19. Added `STARTUP_GO_LIVE_GUIDE.md` and `/admin/startup-readiness/` with 20 ordered launch gates, detailed paths, instructions and pass conditions.
20. Updated the authoritative Markdown set, Packaging Studio specification/guide, schema reference, aggregate/current migration files, release notes and validation documents for Build 222.

## Launch sanity check

### Structurally ready
- Public catalog, product detail, cart and checkout foundations.
- Product media roles, alt text, rights review and up-to-seven-image direction.
- Draft/archive cleanup with protected-history preflight.
- Tools and Supplies row editing, Amazon review draft and purchase-lot evidence.
- Quantity specials and component-set availability calculations.
- Creative Projects that may be product-backed or content-only.
- Content Studio, CAIP evidence and review-first publication foundations.
- Structured Packaging Studio and Soap Label Studio.
- One-H1 and public title/meta/canonical guardrails.

### Must be proven before unrestricted opening
1. Production login, password reset, session expiry and lower-role denial.
2. Live Stripe capture and signed webhook idempotency.
3. PayPal either fully proven or hidden.
4. Exact-once inventory consumption after payment.
5. Exact-once release/restoration after failure, cancellation and refund.
6. Concurrent final-unit and final-set checkout behaviour.
7. Launch-stock physical counts and lot reconciliation.
8. Quantity-special, coupon, tax and refund calculations.
9. Shipping and pickup destinations, rates and instructions.
10. Registration, reset, order, refund and fulfilment email delivery.
11. A small, fully green opening-day product list.
12. Real product images, rights, alt text, derivatives and fallback delivery.
13. Verified soap formula/INCI/bilingual label content and physical print proof.
14. Cosmetic notification/change-control process for applicable products.
15. Public policy accuracy and checkout/footer discoverability.
16. Analytics, Search Console, sitemap and Business Profile verification.
17. Mobile, accessibility, structured-data and launch-path performance checks.
18. D1/R2 restore and rollback rehearsal.
19. A complete real paid-order, fulfilment and separate refund rehearsal.
20. A controlled opening with conservative stock and active monitoring.

Detailed instructions are in `STARTUP_GO_LIVE_GUIDE.md` and the browser guide at `/admin/startup-readiness/`.

## Known issues and risks
- The specification states both a 1.5-inch artboard and a 50 mm rear circle. Since 50 mm is taller than 38.1 mm, both cannot be true without clipping or a taller canvas. Build 222 provides two explicit profiles; a physical test must choose the production profile.
- Browser Print/Save PDF is not yet a true server-generated CMYK prepress PDF with embedded/outlined fonts, crop marks and verified bleed boxes.
- Ingredient-panel overflow now uses a conservative eight-line approval blocker, but exact glyph-width measurement is still outstanding; visual and physical review remain mandatory, especially for long French or INCI copy.
- Rose vectors are initial reusable assets; final colour, contrast and print reproduction need proofing.
- Product formula and supplier descriptions must not be copied directly into a cosmetic ingredient declaration without review.
- Payment and inventory settlement still need deployed exact-once evidence before scarce products or sets are opened broadly.
- Automatic FIFO/FEFO lot consumption remains disabled; policies are preferences and evidence only.
- Social OAuth remains dependent on provider credentials, review and approval.
- First-page local search placement cannot be guaranteed; local SEO must be maintained through relevance, accurate business information, useful content, prominence and customer trust.

## Next 20 steps — Build 223 direction
1. Implement true server-side print-PDF generation with exact media/bleed boxes and embedded or outlined fonts.
2. Add printer calibration rulers, crop marks and a saved calibration profile per printer/paper combination.
3. Add deterministic SVG text-overflow measurement and approval blockers for each label region.
4. Add wrapped-soap front/back/side mockups generated from the same source SVG.
5. Add uploaded print-proof photo storage in R2 with checksum and version linkage.
6. Add barcode, SKU, batch/lot and optional QR zones for market/retail label variants.
7. Link a finished soap product and its verified recipe/formula to a label draft without duplicating source facts.
8. Add reviewed ingredient-translation/version control rather than free-text overwrite.
9. Add allergen and warning review queues with effective-date evidence.
10. Add approved-label lock, supersession and controlled reprint workflow.
11. Complete live Stripe/webhook exact-once settlement integration tests and saved evidence.
12. Complete failed/abandoned/cancelled/refunded inventory release and restoration tests.
13. Add a concurrency-safe stock reservation transaction for the final unit and component set.
14. Add role-specific authorization for permanent delete, inventory reversal, label approval and accounting export.
15. Add an actionable Startup Readiness database cockpit with owner, status, evidence URL, due date and blocker severity.
16. Add automated transactional-email test records and resend/failure diagnostics.
17. Add shipping/tax scenario fixtures for Ontario, other supported provinces, pickup and any enabled US destinations.
18. Add product-family realized margin trends using sales, allocated project cost, packaging, channel fees and refunds.
19. Allow deliberately approved CAIP summaries to be selected for Content Studio packages.
20. Complete social OAuth only after provider credentials, callbacks, scopes and platform approvals are available.

## Operating direction after launch
Open with a small, complete product list. Continue adding products, content, packaging variants and automation in the background only when the existing order, inventory, email, refund and fulfilment workflows remain observable and reversible.
