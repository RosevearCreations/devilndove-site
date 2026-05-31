# Build 156 API note

New or expanded API surface:

- `/api/custom-request-payment` — public private-token payment page API. It now blocks links that did not pass admin share gates and can prepare Stripe/PayPal/Square/manual checkout records.
- `/api/custom-request-order` — public private-token order-status API for converted custom-request orders.
- `/api/custom-request-consent` — public private-token review/photo/consent response API.
- `/api/admin/custom-requests?format=marketplace_csv&channel=...` — authenticated CSV export for Etsy, Facebook Marketplace, Pinterest, or all/manual listing review.
- `/api/admin/custom-requests` — expanded with payment-share gate checks, checkout record visibility, order-status links, consent prompt tokens, and stricter approved payment link rules.

Do not expose private token URLs in sitemap or public navigation. Keep all external payment sharing behind admin approval gates.

# Functions API Notes

Current sync: 2026-05-14 — Build 125.

## Active API surface
Cloudflare Pages Functions are under `/functions/api/`. Admin endpoints require admin authentication through the existing admin audit/auth helpers.

## Added/updated admin endpoints this pass
- `/api/admin/migration-ledger` — record and list SQL migration status.
- `/api/admin/release-sanity` — run public page, D1, accounting, incident, and migration checks.
- `/api/admin/accounting-statement-provider-profiles` — seed/list/save statement CSV provider mappings.
- `/api/admin/accounting-statement-imports` — now returns provider profiles for the import UI.
- `/api/admin/db-sanity` — now includes critical checks and count summaries.
- `/api/admin/site-item-inventory` — normalizes movement types, returns dollar display values, and guards current stock defaults.

## Money rule
APIs should store cents in D1 and return display helpers where needed. Admin forms should accept dollars and convert to cents before saving.

## Private data rule
Do not expose raw CSV imports, Amazon order history, or accounting reports through public static files. Use authenticated admin endpoints and D1 staging tables.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Build 129 admin endpoints

- `/api/admin/schema-drift-report` checks live D1 tables/columns against the current build expectations.
- `/api/admin/public-api-health` tests public JSON endpoints after deploys.
- `/api/admin/amazon-purchase-import` imports pasted Amazon CSV rows into private D1 staging.
- `/api/admin/runtime-incidents` now supports cleanup of old resolved/ignored incidents.

## Build 131 API note

New admin endpoint: `/api/admin/storefront-schema-repair`. It requires admin auth and can inspect/apply non-destructive storefront compatibility columns for `products`, `tax_classes`, and `product_seo`. Public API Health was expanded to treat `authority: "error"` as a failure and to check sitemap/robots/page HTML health.

- `/api/admin/social-post-queue` — admin review-first social post queue for job/process photos and summaries.

## Build 155 maintenance note

This Markdown file was reviewed during the Build 155 pass. The active roadmap/schema/gaps documents carry the detailed implementation notes for custom request payment links, order conversion, marketplace export packs, proof filters, and post-fulfillment prompts.

## Build 157 API note

Build 157 adds safer custom request operations across the admin and public APIs: mobile product save fallback handling, lifecycle controls for quote/payment/order/consent links, order-stage history, candle/soap product-spec fields, richer marketplace CSV preset data, payment provider readiness records, and consent-to-public-proof approval records.

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
