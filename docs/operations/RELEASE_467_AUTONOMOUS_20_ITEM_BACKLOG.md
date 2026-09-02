# Release 467 — Autonomous 20-Item Development Backlog

This document records the exact next 20 Devil n Dove improvements that can be completed autonomously in Development without further business input.

Current baseline: Release 467 Build 13, merged `dev` `794fd5b36191fff4c9e8376197f968d9c6d6da80`, tree `9c2bcdcb12bcbf2f00aeb19345329cdce39c65d9`, with canonical Development System Gate `33643833623` SUCCESS.

The sequence is intentionally grouped as **Builds 14–17**, five improvements per build.

1. **Build 14 — Product Release Quality Command Center.** Create a ranked “fix next” queue covering product name, description, category, price, cost, margin, stock, hero image, gallery, alt text, SEO title/meta, canonical/slug, structured data, shipping eligibility and release readiness. The system already has many of these signals; we should consolidate them rather than invent another product authority.

2. **Add visual readiness badges directly to Product Editor cards.** Hero-image quality, image dimensions, alt-text quality, consent/public-use status, inventory readiness and publish status should be visible without opening specialist screens.

3. **Add one-click image crop/focal-point editing from product thumbnails.** Preserve the original R2 asset; store/use the approved presentation crop rather than destructively modifying source media.

4. **Add automatic marketplace-image readiness checks.** Before Etsy/Facebook/Pinterest/manual CSV export, validate hero dimensions, aspect ratio, file availability, consent/public-use status, alt/title information and duplicate images.

5. **Add product-specific proof-image recommendations.** Based on product type/material/process, suggest the missing photographs buyers would benefit from—for example scale, detail, packaging, engraving close-up, underside, clasp, finished candle surface or soap label.

6. **Build 15 — Product structured-data parity enforcement.** Product/Offer/Breadcrumb/schema facts must agree with visible product facts—price, availability, currency, SKU, images and canonical URL. Never create schema-only marketing facts.

7. **Run a full automated public SEO quality pass.** Every public/product/category page: exactly one H1, useful title, meta description, canonical, crawlable internal links, valid images, meaningful alt text and applicable structured data.

8. **Normalize buyer-facing product facts.** Surface dimensions, material, finish, care, personalization limits, availability and relevant handmade limitations consistently across Catalog, Product Detail and schema. Missing facts become admin remediation items rather than silent omissions.

9. **Strengthen Shop/Collection internal linking.** Add related products and proof/examples by material, process and product type so useful relationships aren't limited to individual product pages.

10. **Audit shipping/pickup/policy consistency.** Ensure public products, cart/checkout preparation, custom quotes, marketplace exports and structured data all consistently respect our current shipping rules—including the existing U.S. sales/shipping suspension—without changing that business policy.

11. **Build 16 — Custom-request journey consolidation.** Make the customer path visibly consistent: **request → review/proof → quote → making → pickup/shipping → complete**.

12. **Improve private order-status stage messages.** Automatically provide customer-safe messaging for planning, making, curing/finishing, ready, shipped/pickup and complete while keeping internal/private production notes hidden.

13. **Build candle and soap example blocks from approved existing data.** Where real records/media exist, surface scent, base/wax, colour, batch, ingredient/safety facts and approved photography. Do not manufacture examples or claims where source evidence is absent.

14. **Add consent-approved customer proof blocks.** Approved reviews/photos/project evidence can become reusable public trust blocks on candle, soap, custom-gift and appropriate product pages. Requested/internal-only media stays private.

15. **Create a fast mobile “Made Today” capture workflow.** From a phone: choose/create project/product, capture finished photos, process notes, batch/material facts and story candidates, then hand them into review rather than publishing anything automatically.

16. **Build 17 — Creative Project → Content Studio completeness bridge.** A completed Creative Project should present material usage, actual cost/profitability where available, finished outputs, approved evidence, lessons and possible story assets in one handoff package.

17. **Create a CAIP “story candidates” review queue.** Rank reviewed evidence by usefulness—technique, problem, result, lesson, material proof, process proof, safety/quality—and turn approved ranges into Content Studio candidates without social/provider publication.

18. **Add Media & Content Studio assignment/orphan diagnostics.** Show which static/public images are assigned to Home, About, Gallery, Workrooms, Showcase, banners, product areas, etc.; identify unassigned assets and duplicate/fallback usage. Any destructive removal remains explicit and safe—no raw R2 deletion.

19. **Build editable marketplace presets.** Admin-managed category, shipping-profile and tag presets for Etsy/Facebook/Pinterest/manual export, combined with a full export preflight. This prepares listings but **does not publish them**.

20. **Enforce a site-wide “no silent placeholder/fallback” quality gate.** When an approved real image/content asset exists, a public page should not quietly display a generic fallback. Produce an actionable remediation board for missing hero images, galleries, static-page media, banners, alt text and broken assignments.

## Autonomous execution boundary

All 20 items may be implemented without further business input by using existing approved facts and current rules and failing closed wherever source evidence is absent. Each bounded build should follow implementation → source gate → regression proofs → PR → merge → exact Development deployment → D1/binding/smoke acceptance.

The following are **not** part of this autonomous 20-item run and remain separate deliberate acceptance/promotion work:

- Stripe Development acceptance;
- PayPal sandbox acceptance;
- Social/OAuth provider acceptance or publication;
- real Cloudflare Access service-token acceptance;
- Production promotion or `main` mutation.

These lanes remain `HOLD_EXTERNAL` unless deliberately proven. Production remains separately governed by Production Promotion Readiness.

## Recommended execution order

Start with **Build 14 — items 1–5, Product Release Quality Command Center**. It creates the measurable product-quality authority that the remaining Storefront/Creator work can build on.
