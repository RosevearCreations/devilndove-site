# Devil n Dove Project Status and Roadmap — Build 191

This is the primary human-readable project file. For deployment order and technical handoff, read `AI_HANDOFF.md`. `MARKDOWN_INDEX.md` explains the remaining supporting files.

## Executive sanity check

Devil n Dove is now a broad small-business operating platform rather than a simple storefront. It includes public shopping, handmade/vintage separation, custom requests, member tools, product/media workflows, accounting groundwork, gift cards, marketplace exports, recalls, local SEO, analytics, deployment controls, mobile capture, and consent-controlled public proof.

Build 191 deliberately improves **integration and real operating controls** rather than creating another isolated admin department. The strongest remaining business value comes from entering accurate real data, publishing approved real photography, testing live provider connections, and simplifying daily owner use.

## Build 191 completed — 20 value-added steps

1. Added editable channel-specific marketplace fee settings without assuming account-specific rates.
2. Added product-family cost defaults for materials, labour, packaging, overhead, and waste.
3. Updated Product Readiness margin calculations to use configured cost defaults/direct costs and channel fee settings.
4. Added marketplace CSV hard blocking for unknown/low/negative margin.
5. Added temporary margin override requests with approval, expiry, and audit history.
6. Added customer timeline search and private admin notes.
7. Added a customer-story wizard that creates product-story, trust-block, gallery-caption, and social-snippet drafts.
8. Added direct consent-evidence URLs to customer-story output records.
9. Added Search Console CSV header mapping and sample-row preview before import.
10. Added monthly Google Business Profile task reminders for accuracy, photos, reviews, posts, and local-page freshness.
11. Added fulfilled/paid review-request eligibility rows while keeping permission and cooldown separate.
12. Added an approved before/after/process gallery data model, public read endpoint, and public progressive-enhancement module.
13. Added product image-role prompts to both phone and desktop product editors.
14. Upgraded mobile product recovery from browser-only storage to authenticated D1-backed field snapshots.
15. Added deployed performance measurement imports for mobile/desktop route evidence.
16. Added a guarded responsive-image derivative publication queue and `srcset`/`sizes` storage.
17. Added one-click Owner Daily summary generation and history.
18. Added campaign readiness checks for inventory, real media, SEO, pickup/shipping, and social work.
19. Added local-page freshness reminders plus real-device screenshot/QA evidence records.
20. Added live-environment configuration verification for D1, R2, Stripe, webhooks, email mode, and Cloudflare API setup.

## Current application strengths

- One-H1, title/meta, canonical, image-alt, structured-data, sitemap, and local-page guardrails.
- D1-backed products, orders, customers, custom requests, gift cards, evidence, SEO actions, costing, and release controls.
- Responsive desktop/mobile admin surfaces and phone product capture.
- Product readiness, channel-aware cost/margin review, marketplace validation, and approval gates.
- Consent-controlled customer stories, public proof, and before/after gallery groundwork.
- Deployment preflight, safe packages, smoke tests, rollback controls, and environment checks.
- Two canonical Markdown files with archived historical context.

## Current business-value gaps

1. Real approved photographs still provide more trust and image-search value than placeholders.
2. Fee and cost rows remain advisory until actual account-specific values are entered.
3. Search Console import is manual CSV preview/import; it is not yet an OAuth/API connection.
4. GBP activity remains a manual observation/task process because Google does not provide a simple public ranking-position feed.
5. Mobile D1 recovery saves form fields but not selected image file bytes.
6. Responsive derivative jobs are queued but still need a real R2 image worker.
7. Review eligibility is not customer-contact permission.
8. Real-device QA requires actual devices/screenshots.
9. Environment verification currently checks configuration presence; live transactions/provider signatures still need deployed tests.
10. The number of older admin pages remains high, although Command Center now aggregates most daily work.

## Current SEO and competitive direction

Google Search Console supports exporting report data to CSV, Excel, or Google Sheets; Build 191 therefore validates headers and samples before import rather than assuming one fixed file shape.

Google Business Profile continues to describe local results primarily around relevance, distance, and prominence/popularity. No code change can guarantee first-page placement. The practical work remains accurate profile details, useful local pages, current products, real photographs, reviews, links, and consistent proof.

Current Etsy guidance continues to emphasize a compelling origin/workshop story and strong behind-the-scenes photos/video. Current Shopify guidance emphasizes product details, imagery, reviews/social proof, clear calls to action, mobile usability, page speed, and measuring conversion changes.

Primary verification sources:

- https://support.google.com/webmasters/answer/12919797
- https://developers.google.com/search/blog/2020/02/data-export
- https://support.google.com/business/answer/7091
- https://www.etsy.com/seller-handbook/article/22636178725
- https://www.shopify.com/sg/blog/ecommerce-product-page-seo

## Next 20 recommended steps after Build 191

1. Enter actual reviewed fee settings for every enabled sales channel.
2. Enter actual cost defaults, then override individual products where needed.
3. Connect cost defaults to product editor preview cards and accounting cost rollups.
4. Add effective-date/version history for fee and cost changes.
5. Add an R2 derivative worker that creates WebP/AVIF widths and writes final `srcset`.
6. Add resumable/retryable mobile image uploads separate from field autosave.
7. Add browser/D1 draft conflict detection and a choose-local/choose-server merge screen.
8. Add approved gallery placement controls by public route and product family.
9. Add public product/customer story blocks only after consent and placement approval.
10. Connect Search Console through its API or scheduled export workflow after OAuth/service credentials are chosen.
11. Add GBP task completion trends and monthly evidence summaries.
12. Add customer duplicate/merge suggestions with reversible audit history.
13. Add review-request opt-in/permission evidence and send cooldowns before outbox queueing.
14. Add route-level Cloudflare Web Analytics import.
15. Add PageSpeed Insights/Lighthouse import automation for mobile and desktop.
16. Add real-device QA templates for narrow phone, large phone, tablet, laptop, and large desktop.
17. Run live Stripe webhook signature tests and store pass/fail evidence.
18. Run live email provider test-send/delivery-log verification while customer automation remains disabled.
19. Run live R2 upload, signed-read, derivative, and delete health tests.
20. After stable usage telemetry, consolidate or retire low-use legacy admin destinations.

## Release readiness opinion

Build 191 is structurally ready for deployment after its D1 migration and normal preflight checks. Business readiness still depends on accurate costs/fees, approved real media, live payment/email/R2 tests, consent evidence, and real-device screenshots.


## Build 192 — Operational data connection and live proof follow-through

Build 192 keeps the project moving toward real business usefulness instead of adding another disconnected admin page. The new work is integrated into `/admin/command-center/` through `/api/admin/value-ops-next` and `public/js/admin-value-ops-next.js`.

Completed in this pass:

1. Added fee/cost change-audit rows so actual Stripe/Etsy/PayPal/local fee changes can be recorded with a reason and effective date.
2. Added R2 derivative worker readiness checks for bindings, WebP, AVIF, srcset writeback, and cleanup.
3. Added resumable mobile upload session rows and draft-conflict review rows beyond browser-only autosave.
4. Added approved real-media replacement plan rows for key public placeholders.
5. Added scheduled Search Console import rows for monthly pages/queries, weekly top pages, and quarterly image-search review.
6. Added Google Business Profile evidence records for monthly observations, photos, reviews, posts, and local-page proof.
7. Added customer duplicate/merge candidate rows and a Command Center action to refresh duplicate email candidates.
8. Added live provider test records for Stripe, email, R2, and Cloudflare checks without exposing secret values.
9. Added Lighthouse/PageSpeed import schedules for mobile and desktop routes.
10. Added legacy admin usage and consolidation recommendation rows so older admin pages are not retired until real usage data supports it.
11. Added extra visual placeholders to business-relevant public pages that still lacked visual enrichment.
12. Updated schema, release, roadmap, handoff, SEO, image, sanity, and deployment documentation.

Current opinion: the app is now past the “add structure” stage. The next business value comes from entering real costs/fees, uploading approved photographs, importing live evidence, and using the Command Center daily.

### Build 192 D1 migration

Run after Build 191:

```text
database_build192_operational_data_connection.sql
```
