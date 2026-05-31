# Build 159 note

Catalog Product Editor image UX was repaired: existing saved images now appear as draggable thumbnail cards in Product pictures, the first card syncs to the featured image, gallery URL slots are de-duplicated from the featured image, and advanced media metadata remains in Product Media Workflow. No schema migration required for this front-end pass.

# Build 156 repo rules update

Continue the same rules: update Markdown and schema files on every pass, keep one H1 per exposed page, avoid indexing private token pages, keep customer images private until consent is reviewed, and keep payment links behind admin approval gates. Payment/order/consent links must have void/resend/expiry controls before broader customer rollout.

# Build 154 repo rule reminder

When updating custom request quote workflows, keep every payment/order action review-first. Customer acceptance may create drafts, but it must not charge, publish, or create a live order without an admin review step. Uploaded reference images must remain private/internal until Media Consent Records explicitly allow public or social use.

# Build 153 repo rules update

Private quote preview links must remain noindex and manual-share only. Customer quote acceptance records intent but must not auto-charge, auto-invoice, or auto-publish work. Uploaded reference images must remain private-review-only until media consent and public-use review are implemented.

# Build 152 repo rule additions

- Custom request reply templates are internal drafts until a human reviews/copies/sends them. Do not auto-send them in a future pass without an explicit approval gate.
- Deposit and invoice candidates are planning records, not customer-payable invoices. Do not expose them publicly until quote acceptance and payment-request controls exist.
- HST/GST reminders may queue to `notification_outbox`, but live dispatch must continue to respect notification exclusions, cooldowns, and admin review rules.

# Build 151 repo rules note

Continue the pass rule: every feature change must update active Markdown and schema references. Public pages must keep exactly one H1, and private/customer/accounting data must stay out of public `/data/` JSON files.

# Build 150 rule reminder

Trust blocks and SEO overrides must remain review-first. Do not publish private customer details, private Amazon/order data, or unapproved photo/story consent into public trust blocks. Search Console CSV exports and generated SEO action rows are admin/private data; only approved title/meta/internal-link outcomes should become public copy.

# Repo Rules — Devil n Dove

## Build 139 rule reminder

Never commit social platform access tokens, page tokens, OAuth refresh tokens, app secrets, or API keys. Social publisher credentials belong only in Cloudflare environment variables. Keep generated social captions and public post URLs in D1; keep secrets out of D1 and public files.

# Repo Rules

## Build 137 rule reminder

Search Console CSV exports, Amazon order CSVs, and generated review queues are private working data. Do not place them under public `/data/`. Public pages still require exactly one H1, a clear title, and a meta description.

## Build 135 rule reminder

When changing product media or product editor workflows, update `/admin/products/`, Operations diagnostics, schema notes, and Markdown together. Do not place private Amazon/order CSV reports under public `/data/`.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

## Required rules for future passes
1. Update Markdown when code/schema changes.
2. Update schema references when D1 tables, columns, indexes, or constraints change.
3. Keep one H1 per exposed public/admin HTML page.
4. Run JavaScript syntax checks before ZIP handoff.
5. Keep private import/accounting data out of public `/data/` paths.
6. Prefer D1 for operational truth; keep JSON as fallback/seed/export until migrated.
7. Store money as integer cents in D1 and show dollars in the UI.
8. Do not overwrite inventory costs blindly; use review and cost history where possible.
9. Do not claim tax/accountant readiness until reconciliation, close, HST review, and export validation are complete.
10. Keep retired files in `/archive/` and active files in predictable paths.

## Deployment rules
- Apply `database_upgrade_current_pass.sql` before relying on new D1-backed admin panels.
- Record applied SQL in the Migration Ledger.
- Run Release Sanity before declaring a build ready.
- Re-run Tools/Supplies inventory sync after catalog JSON/D1 changes.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Runtime incident review rule - Build 126

Do not clear Release Sanity runtime warnings by marking everything resolved blindly. Group incidents first, fix the recurring endpoint or schema drift, then resolve only the rows tied to the fixed cause. Use `ignored` only for known harmless stale incidents.

## Build 128 rule addition

Public storefront endpoints must not hard-reference optional D1 columns. If a column may not exist on the deployed D1 database, verify it before building SQL and provide a safe default in the response payload.

## Build 129 repo rule additions

- Do not add private Amazon order/cost CSVs or match reports under public static folders such as `/data/`.
- New D1-sensitive endpoints should either verify optional columns before use or degrade safely with a clear runtime incident.
- Any new admin import workflow must be review-first and must update Markdown plus schema references in the same pass.

## Build 130 rule reminder

Before referencing a newer D1 column from a public endpoint, confirm it exists. Public pages should degrade safely instead of creating repeated runtime incidents.

## Build 131 repo rule update

Do not add private Amazon order exports, match reports, cost reports, or transaction CSV/XLSX files under public `/data/`. Use private D1 staging/admin import tools instead. Before deploy, run the local predeploy sanity script or equivalent checks for H1/meta, CSS drift, local references, and public-data privacy.

## Build 132 rule addition

For mobile navigation, keep the shared menu compact and grouped. Avoid adding more always-visible top-level mobile links; place secondary links inside grouped expandable sections so phone screens do not become a long menu wall.

## Build 133 note

Build 133 rule reminder: do not expose private Amazon/order CSV files under public `/data/`; Search Console imports should go to D1 staging tables, not public JSON.


## Build 134 note

This pass fixes the Product editor draft workflow: drafts require only name/type, image upload is available from the editor when R2 media storage is configured, create-product failures return JSON instead of HTML 500 pages, and the create endpoint adapts to live D1 product/media/SEO columns.
## Build 138 social posting rules

- Social posting remains review-first. Queue, review, copy/manual-post, then record the public post URL.
- Do not store Facebook, Instagram, TikTok, X, YouTube, Pinterest, or other platform secrets in Markdown, JSON, D1 public tables, or front-end JavaScript.
- Future direct API posting must use Cloudflare environment variables for secrets, platform OAuth diagnostics, and explicit admin approval before any publish action.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.

## Build 155 maintenance note

- Updated alongside the latest custom request payment/order/marketplace/proof-filter pass.
- Schema, roadmap, gaps, SEO, and sanity notes now reflect the new Build 155 workflow direction.

## Build 157 update — payment readiness, link controls, stages, candle/soap specs, marketplace presets, and consent proof review

Completed in this pass:

- Hardened `/api/admin/mobile-create-product` so Save Partial retries duplicate SKU/product-number/slug conflicts and returns a recoverable JSON response instead of a raw D1 500 when identity generation collides.
- Added admin link lifecycle controls for custom quote, payment, order-status, and consent links: resend marker, expire, and void.
- Added customer custom-order stage tracking for planning, making, curing/finishing, ready, shipped/pickup, and complete.
- Added candle/soap intake fields for scent profile, wax/base, colour notes, batch, ingredient notes, and allergen/safety notes.
- Added `custom_candle_soap_product_specs` so candle/soap details can be tracked outside the general message text and later linked to product drafts or finished products.
- Added marketplace channel presets and richer CSV rows for Etsy, Facebook Marketplace, Pinterest, and manual listings, including category and shipping-profile review fields.
- Added payment provider readiness records for Stripe, PayPal, and Square configuration checks. This records configuration readiness only; real production checkout still requires a live low-value test order with credentials in Cloudflare.
- Added consent-to-public-proof candidates and an admin approval action that can turn an approved response into a public trust block.
- Updated private order-status pages to show custom work stage history.
- Updated schema files and handoff Markdown for the new workflow.

Next strongest steps:

1. Add editable UI fields for candle/soap scent, wax/base, colour, batch, ingredients, allergen/safety notes, and cure-ready date inside product drafts and mobile product capture.
2. Add explicit Stripe/PayPal/Square live-test result buttons after production credentials are configured in Cloudflare.
3. Add per-link customer copy templates for resend actions so quote/payment/order/consent links can be manually resent with consistent wording.
4. Add public-safe trust block moderation filters so approved consent proof can be scheduled by page/context.
5. Add stage-specific customer messages for custom work: planning, making, curing/finishing, ready, and shipped/pickup.
6. Add marketplace preset editing UI instead of relying on seeded defaults.

## Build 158 — Catalog action and image workflow repair

- Added `IMAGES.md` with the complete image/video placement checklist, required sizes, allowed video use, target paths/data fields, and product image role workflow.
- Repaired `/admin/catalog/` so it now includes the full product editor form required by Edit, product picker, image fields, SEO fields, marketplace fields, and the media/resource modules.
- Changed Product table Approve/Publish buttons so they are clickable even when blocked; the backend now returns the exact missing fields instead of silently doing nothing through a disabled button.
- Improved Needs Changes so admins are prompted for what needs changing and that note can be saved into the product review history/readiness notes.
- Hardened product review actions by ensuring support tables exist before review/publish checks run and by returning human-readable readiness labels.
- Repaired Reserve Resources and Release Resources UI feedback so it handles the actual inventory API response shape and reports affected, skipped/story-only, and missing inventory links.
- Improved Product Media Workflow so loading a product for editing auto-loads its image rows, each row shows a thumbnail, Delete image row is clearer, and saving an empty image set clears `featured_image_url`.
- Continued SEO/H1 discipline: one H1 per scanned public page, private/admin pages kept separate from public SEO goals, and local/product image guidance documented.

### Build 158 next steps

1. Add admin dashboard counters for products missing hero image, missing image roles, missing alt text, blocked public-use status, and missing OG image.
2. Add static example images for custom candle making, custom soap making, custom requests, and About/workshop story.
3. Add a backend endpoint that returns product readiness blockers separately from review actions so the UI can show a checklist before clicking Approve/Publish.
4. Add CSV/export image validation for Etsy/Facebook/Pinterest before marketplace export.
5. Add video poster image fields to product story notes and custom candle/soap pages.

## Build 160 — Catalog editor URL validation and publish image sync repair

- Fixed the Product Editor canonical URL field so relative site paths such as `/shop/product/?slug=desert-succulents-100` are accepted. The input is now text with helper guidance instead of browser `type=url` validation.
- Clarified External Listing URL: leave it blank for normal Devil n Dove shop products; only add a full `https://` Etsy/Facebook/marketplace URL when Sale Channel is Hybrid or External-only.
- Hardened update/create product image syncing so the featured image is also stored in `product_images` at sort order 0, gallery rows follow after it, duplicates are removed, and existing image rows/annotations are preserved when the URL already exists.
- Fixed Clear editor so the visual image cards and Product Media Workflow panel clear along with the form fields.
- Improved publish/approve readiness consistency by making the editor’s image fields and backend `product_images` rows agree before review actions run.
- No new D1 table is required in this pass; this is a code/data-sync behavior repair against the existing products, product_images, product_seo, and product_image_annotations tables.

Next recommended checks:
1. Edit a product with a relative canonical path and click Update Product.
2. Confirm External Listing URL is blank for normal onsite listings.
3. Save, reload, and confirm the first visual image is the featured image and appears in Product Media Workflow.
4. Run Approve/Publish; any blocker should now be a real readiness issue such as missing image role, missing SEO, missing price, or blocked public-use status.
