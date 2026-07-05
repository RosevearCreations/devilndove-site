# Devil n Dove AI Handoff — Build 207

## Start here

Use only these two cross-project documents for new work:

1. `AI_HANDOFF.md` — technical operating boundaries, deployment/testing, current incident notes, and release rules.
2. `PROJECT_STATUS_AND_ROADMAP.md` — business priorities, product/SEO rules, completed work, and the active backlog.

`MARKDOWN_INDEX.md` explains which specialized documents remain authoritative. Do not promote older Build 154–205 notes above this handoff unless a live deployment needs historical context.

## Current release

Build 207 completes the next safe handoff step without a required D1 migration:

- `/admin/catalog/` can filter and sort the existing-product picker by store status, review status, product ID/name/SKU/slug, recent update, and image attention.
- Loading a product now resolves its featured-image field from the product record first, then its ordered product-image gallery, then its non-deleted `media_assets` record. The editor visibly says where the image came from and shows a local preview.
- `/admin/catalog-media/?product_id=<id>#product-media-workflow` now opens with a persistent product context card: product ID, name, SKU, slug, status, tax summary, media counts, featured-image source, search, and direct Product Editor / CAIP / storefront preview links.
- The media context broadcasts its selection to product-images, annotations, role scoring, listing facts, story, and SEO panels.
- `/admin/creative-assets/?product_id=<id>` now resolves an existing CAIP project for that product when one exists and shows a return link to the media workspace. It does not auto-create, alter, render, publish, or grant rights to source media.
- Tax APIs now normalize historic whole-number values such as `13` and current fraction values such as `0.13` to one consistent API contract: `tax_rate` is a fraction and `rate_percent` is the display percentage.

### Build 207 product-content handoff

- `/admin/catalog-media/?product_id=<id>#product-media-workflow` now shows a **Content Studio → CAIP handoff** card for the selected product. It names the product, shows source-media counts, Content Studio package status, CAIP status, evidence/review counts, and links to both workspaces.
- An administrator can explicitly create/refresh an eligible Approved/Published product’s Content Studio package and its CAIP reference record, or refresh CAIP only after a package exists. Both actions are audited.
- These actions are source-safe: they do not copy, delete, reorder, transform, publish, grant rights, or change source media. They do not create a public release or a derivative.
- Public catalog-card and featured-product endpoints now use the product-media review gate: `blocked` / `consent_needed` images are omitted; a linked consent record must permit public use before it can appear. Unannotated first-party product images retain the existing safe compatibility behavior.

## Architecture and deployment facts

- Hosting: Cloudflare Pages + Pages Functions.
- Database: Cloudflare D1 binding `DB`.
- Media: R2 binding `PRODUCT_MEDIA_BUCKET`.
- Cloudflare project files must deploy from a root that directly contains `functions/`, `index.html`, `_routes.json`, and `wrangler.toml`.
- Product media remains source-led: `products.featured_image_url`, `product_images`, and `media_assets` may coexist. Build 206 reads safely across them; saving the Product Editor writes the resolved URL back to the product record when appropriate.

## No-migration rule for Build 207

Build 207 has **no required D1 SQL migration**. The live D1 table listing already confirmed current `users` and `sessions` tables. Do not rename or rebuild the authentication tables because of a catalog-media update.

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
- Build 207 adds an explicit catalog-media package/refresh handoff. It does not activate providers or output media.

## Required post-deploy proof

1. Open `/admin/catalog-media/?product_id=<approved-product-id>#product-media-workflow` and confirm the new Content Studio → CAIP card identifies the product and shows an accurate stage.
2. On one approved product, use **Create content package + CAIP**. Confirm Content Studio and CAIP receive linked records but original media, product facts, rights, and public release remain unchanged.
3. Use **Refresh CAIP only** and confirm it creates a reviewed metadata/evidence refresh without a derivative or publication.
4. On a Draft/Revision product, confirm creation stays locked until the product becomes Approved or Published.
5. Mark one product image blocked/consent-needed and confirm it is omitted from `/api/products` and `/api/featured-products`; test a legitimate public-use consent record separately.
6. Re-run the Build 206 catalog/tax checks and the Build 207 responsive phone/tablet/desktop checks in `BUILD207_VALIDATION.md`.
7. Re-run all product/login smoke tests in `POST_DEPLOY_SMOKE_TEST.md`.

## First next work after Build 207

1. Capture the actual safe login response/log code and fix only that verified route fault.
2. Run deployed verification for the Build 207 public-image gate using real approved, blocked, consent-needed, and explicitly permitted media records.
3. Add a separate operator-confirmed “sync resolved featured image” action only if normal product-save behavior proves insufficient in live use.
4. Add a post-package workflow checklist that lets operators review factual copy, image roles, public permissions, and release prerequisites before passing a deliverable to the Release Board.
5. Add a real controlled derivative worker only after source checksum, rights, output namespace, cost, review, output verification, retry, and rollback controls are approved.
