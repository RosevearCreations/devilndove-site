# Build 156 accounting/template note

Build 156 did not change close CSV math, but custom request payments now create provider checkout preparation records. Future accountant exports should include `custom_request_payment_checkout_records`, `custom_request_payment_links`, and related `payments` rows when custom work is paid through Stripe, PayPal, Square, or manual fallback.

# Accounting Templates

Current sync: 2026-05-14 — Build 125.

## Purpose
This folder holds safe accounting template/reference files. Private statement exports, Amazon CSVs, accountant packages, and receipts should not be deployed publicly.

## Current statement provider profile support
The admin app now has saved provider profiles for:
- bank CSV
- PayPal activity
- Stripe balance transactions
- Square transactions
- Etsy payment account
- manual CSV

These profiles are stored in D1 table `accounting_statement_provider_profiles` and surfaced in `/admin/accounting/`.

## Next template work
- Add sanitized sample headers for each provider.
- Add manual CSV templates for expenses, payouts, refunds, fees, and HST review.
- Add accountant export manifest templates once the export package is complete.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Build 129 note

Amazon purchase rows should be imported to private D1 staging and reviewed before any costs are used in inventory, COGS, HST, or accountant export workflows.

## Build 131 note

Accounting templates remain public sample/template files only. Do not place real Amazon orders, bank statements, PayPal/Stripe exports, or customer/order transaction data in this public template folder.

## Build 155 maintenance note

This Markdown file was reviewed during the Build 155 pass. The active roadmap/schema/gaps documents carry the detailed implementation notes for custom request payment links, order conversion, marketplace export packs, proof filters, and post-fulfillment prompts.

## Build 158 documentation review

Reviewed during the catalog/media repair pass. No accounting-template or Amazon matching schema change was required for this pass, but the new `IMAGES.md` product-media checklist should be used before marketplace/image-heavy product exports.

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
