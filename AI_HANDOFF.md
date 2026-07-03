# Devil n Dove AI Handoff — Build 206

## Start here

Use only these two cross-project documents for new work:

1. `AI_HANDOFF.md` — technical operating boundaries, deployment/testing, current incident notes, and release rules.
2. `PROJECT_STATUS_AND_ROADMAP.md` — business priorities, product/SEO rules, completed work, and the active backlog.

`MARKDOWN_INDEX.md` explains which specialized documents remain authoritative. Do not promote older Build 154–205 notes above this handoff unless a live deployment needs historical context.

## Current release

Build 206 fixes the catalog-media handoff without a D1 migration:

- `/admin/catalog/` can filter and sort the existing-product picker by store status, review status, product ID/name/SKU/slug, recent update, and image attention.
- Loading a product now resolves its featured-image field from the product record first, then its ordered product-image gallery, then its non-deleted `media_assets` record. The editor visibly says where the image came from and shows a local preview.
- `/admin/catalog-media/?product_id=<id>#product-media-workflow` now opens with a persistent product context card: product ID, name, SKU, slug, status, tax summary, media counts, featured-image source, search, and direct Product Editor / CAIP / storefront preview links.
- The media context broadcasts its selection to product-images, annotations, role scoring, listing facts, story, and SEO panels.
- `/admin/creative-assets/?product_id=<id>` now resolves an existing CAIP project for that product when one exists and shows a return link to the media workspace. It does not auto-create, alter, render, publish, or grant rights to source media.
- Tax APIs now normalize historic whole-number values such as `13` and current fraction values such as `0.13` to one consistent API contract: `tax_rate` is a fraction and `rate_percent` is the display percentage.

## Architecture and deployment facts

- Hosting: Cloudflare Pages + Pages Functions.
- Database: Cloudflare D1 binding `DB`.
- Media: R2 binding `PRODUCT_MEDIA_BUCKET`.
- Cloudflare project files must deploy from a root that directly contains `functions/`, `index.html`, `_routes.json`, and `wrangler.toml`.
- Product media remains source-led: `products.featured_image_url`, `product_images`, and `media_assets` may coexist. Build 206 reads safely across them; saving the Product Editor writes the resolved URL back to the product record when appropriate.

## No-migration rule for Build 206

Build 206 has **no required D1 SQL migration**. The live D1 table listing already confirmed current `users` and `sessions` tables. Do not rename or rebuild the authentication tables because of a catalog-media update.

## Login incident — accurate current state

The known `POST /api/auth/login` 500 remains a separate issue. The confirmed D1 schema contains current `users` and `sessions` tables; there is no `members` table in the selected database. Do not run an old `members` migration or any `PRAGMA foreign_keys = OFF` batch. The next evidence needed is the sanitized response JSON from the failed POST or the matching Cloudflare Function log; never include passwords, cookies, Bearer tokens, or session values in notes.

## Public-content / SEO guardrails

- Exactly one visible H1 per public page.
- Use plain search language in page titles, H1s, product names, headings, and descriptions where it genuinely describes the item.
- Keep title/meta/visible copy/canonical URL/structured data/price/availability/featured image/alt text consistent.
- Use contextual, descriptive image alt text; do not stuff keyword lists into alt text.
- Only approved, public-use-cleared real product media may replace public placeholders or be included in product schema, Open Graph images, Gallery, Release Board, Content Studio, or social handoffs.
- Admin pages stay `noindex,nofollow`.

## CAIP operating rules

- CAIP is reference-only and review-first. It does not modify a source image, video, R2 object, gallery order, listing field, or publication.
- A media score, derivative plan, technical probe, or CAIP approval never creates public rights.
- Evidence precedes public prose. A future renderer/OAuth publishing connection needs its own budget, consent, preview/approval, output-verification, retry, and rollback design.
- Build 206 adds a catalog-to-CAIP context bridge only. It does not activate providers or output media.

## Required post-deploy proof

1. Open `/admin/catalog/`, search `34`, and filter by Draft / Revision / Approved / Archived.
2. Load a product with a `media_assets` image but blank `products.featured_image_url`; confirm the field fills, its source label says Media library asset, and the preview is visible.
3. Save the product once; reopen it and confirm the product record has the featured URL.
4. Open `/admin/catalog-media/?product_id=34#product-media-workflow`; confirm every panel sees Product ID 34 and the context card gives the right product name/media counts.
5. Confirm the tax dropdown and product table display HST as `13%`, not `0.13%` or `1300%`.
6. Open `/admin/creative-assets/?product_id=34`; confirm it selects a linked CAIP project if present, otherwise clearly says that no project exists yet.
7. Re-run all product/login smoke tests in `POST_DEPLOY_SMOKE_TEST.md`.

## First next work after Build 206

1. Capture the actual safe login response/log code and fix only that verified route fault.
2. Add an explicit “sync resolved featured image” action/indicator in the Product Editor only if operators want a separate save from normal product updates.
3. Extend public product list/detail endpoints to use a safe approved-media fallback after live verification and consent checks.
4. Add Content Studio → CAIP creation status to the catalog-media context card.
5. Add a real controlled derivative worker only after source checksum, rights, output namespace, cost, review, and verification controls are approved.
