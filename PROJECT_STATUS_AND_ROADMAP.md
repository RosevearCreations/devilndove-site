# Devil n Dove Project Status and Roadmap — Build 220

## Current position
Devil n Dove is in **launch-readiness and operational-polish**, not early feature discovery. The application now covers catalog, product media, tools and supplies, purchase evidence, Creative Projects, Content Studio, CAIP, social review queues, orders, payments and accounting foundations. The remaining work is primarily deployed proof, inventory settlement, business-rule verification and completing launch content.

## Completed in Build 220
- Added a visible **Remove duplicate draft** action to draft product rows, backed by preflight checks, typed confirmation and administrator step-up.
- Added minimum-quantity price breaks with server-side checkout price resolution.
- Added limited product sets with complete-set reservation and shortage status.
- Subtracted set reservations from component-product storefront availability so reserved units cannot also be sold individually.
- Added set and quantity-special context to Product Release Preflight.
- Added purchase-lot tracking for repeated Amazon/supplier purchases, including dates, order reference, costs, expiry and storage.
- Added explicit content-only Creative Project types and product-free Content Studio package creation.
- Updated Content Studio language and controls for both product-backed and content-only projects.
- Added visual placeholders and mobile/Desktop CSS for offers, sets, lots and content-only workflows.
- Consolidated current Markdown authority into this file and `AI_HANDOFF.md`.

## How the requested workflows now operate

### Duplicate drafts
Filter the product editor to **Drafts**, locate each duplicate row, and select **Remove duplicate draft** on the two incorrect records. The server refuses deletion when business history exists. The surviving draft is not changed.

### Soap quantity specials
Load the soap product in Catalog, open **Special pricing & limited sets**, and add rows such as:
- minimum 3 — lower unit price
- minimum 6 — another lower unit price

The product page and cart show the applicable price; checkout recalculates it from the database.

### Limited sets
Create a normal product record for the set, then select its component products and the quantity required per set. Enter the number of sets you want to reserve. The system exposes only the number of complete sets supported by all components. When no complete set can be reserved, the set shows zero available.

### Repeated material purchases
Open Tools & Supplies Inventory Operations and select **Lots** beside the inventory item. Record one row per purchase occasion. Use lot codes that remain understandable, for example `AMZ-2026-07-24-GOATBASE-01`.

### Content-only projects
In Creative Process choose **Content-only project / no store item**. Add timeline evidence and media references, select reviewed evidence, then create the Content Studio package. No product ID is required. This is the correct path for Laurie’s hair video, tutorials, experiments, personal projects and educational content.

## Launch sanity check

### Green — structurally ready
- Public catalog and product-detail foundations
- Product gallery capability: one featured plus six supporting images
- SEO title/meta/canonical and one-H1 guardrails
- Review-first product/media/content workflows
- Privacy, terms, data deletion and social-connection policy pages
- Draft cleanup with historical-record protection
- Tools & Supplies table editing and lot evidence
- Quantity-special server validation
- Content-only Creative Projects

### Yellow — requires deployed proof or operating completion
- Stripe/PayPal test and low-value live payment paths
- Payment webhook idempotency
- Inventory reduction on paid orders and restoration on cancellation/refund
- Limited-set order consumption/release behaviour
- Tax, pickup, Canada/US shipping and refund calculations
- Transactional email delivery
- R2 transformations/fallbacks and mobile uploads under weak connections
- Seven-image completion, alt text and rights review for actual launch products
- Accessibility and device testing
- Backup and restore rehearsal

### Red — do not assume complete
- Provider-approved social OAuth with production token lifecycle
- Fully automated TikTok/YouTube publishing
- Accountant-approved month-end/export workflow
- Automatic lot depletion selection (FIFO/FEFO) tied to material consumption
- Proven oversell prevention across concurrent checkout/payment events

## Next 20 steps
1. Apply and verify `database_build220_quantity_sets_lots_content_only.sql` in production D1.
2. Remove the two unused duplicate drafts and confirm product numbers are not reused.
3. Test one soap product with 1-unit, 3-unit and 6-unit cart quantities; compare browser and order-item prices.
4. Create a two-component test set and verify set availability equals the lowest complete-component count.
5. Confirm reserved component units disappear from the components’ individual storefront availability.
6. Complete transactional paid-order inventory settlement for regular products and sets.
7. Add cancellation, failed-payment, expiry and refund restoration for those inventory reservations/consumptions.
8. Add idempotency and concurrency tests so repeated webhook/order events cannot consume stock twice.
9. Add reviewed reconciliation between purchase-lot totals and the main Tools & Supplies on-hand count.
10. Add optional FIFO/FEFO lot selection when approved material usage posts to inventory.
11. Complete up to seven reviewed images for every launch product, including descriptive alt text and image roles.
12. Run Product Release Preflight on every launch product and fix required blockers.
13. Prove login, logout, password reset, session expiry and role boundaries on the deployed site.
14. Run Stripe test mode and one low-value live payment through receipt, webhook, order and accounting evidence.
15. Verify cancellation, partial refund, full refund, gift-card and failed-payment paths.
16. Verify Ontario/Canada tax and pickup/Canada/US shipping rules with accountant/business-approved expectations.
17. Test order, payment, shipping, refund and review-request email delivery.
18. Run iPhone, Android, tablet, desktop, keyboard, contrast, focus and screen-reader tests.
19. Complete per-product realized-margin comparisons, reversal/accounting-export roles, CAIP-summary selection and cost-template management.
20. Complete social OAuth only after each provider grants credentials/approval and encrypted token lifecycle controls are proven.

## SEO and competitive guardrails
- Keep one clear H1 on each public page.
- Use descriptive buyer language in titles, headings, visible copy and alt text; avoid keyword stuffing.
- Keep Product structured data aligned with visible price and availability.
- Quantity specials must remain visible and understandable to buyers, while the base product remains the canonical product page.
- Treat a set as its own product with clear included components and truthful availability.
- Do not create duplicate thin pages for every quantity tier.
- Continue local relevance for Southern Ontario where truthful, without implying unavailable storefront locations or service areas.

## Documentation consolidation
The authoritative pair is:
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`

`MARKDOWN_INDEX.md` classifies specialist and historical files. `NEW_CHAT_STATUS.md` and `KNOWN_GAPS_AND_RISKS.md` are compatibility pointers only. Build validation files remain retained evidence, not current planning authority.
