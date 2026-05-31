# Build 156 schema reference update

Build 156 adds payment-share gating, checkout handoff records, private order-status links, marketplace CSV metadata, and public consent-response fields.

New tables:

- `custom_request_payment_link_approval_gates` — records pass/fail gate checks before payment links are externally shareable. Important fields: `custom_request_id`, `payment_request_draft_id`, `order_draft_id`, `order_id`, `gate_status`, `gate_notes`, `gate_snapshot_json`, `checked_by_user_id`, `checked_at`.
- `custom_request_payment_checkout_records` — records Stripe/PayPal/Square/manual checkout preparation attempts from private custom payment pages. Important fields: `custom_request_id`, `payment_link_id`, `order_id`, `payment_id`, `provider`, `checkout_status`, `provider_order_id`, `provider_payment_id`, `redirect_url`, `mode`, `source_payload_json`.
- `custom_request_order_status_links` — stores private customer order-status tokens for converted custom-request orders. Important fields: `custom_request_id`, `order_id`, `order_status_token`, `link_status`, `customer_email`, `customer_name`.

Runtime-guarded column additions:

- `custom_request_payment_links`: `order_id`, `payment_id`, `external_share_status`, `gate_status`, `gate_checked_at`, `gate_notes`, `preferred_provider`, `checkout_redirect_url`.
- `custom_request_marketplace_export_packs`: `csv_status`, `etsy_csv_row_json`, `facebook_csv_row_json`, `pinterest_csv_row_json`.
- `custom_request_fulfillment_prompts`: `prompt_token`, `public_response_status`, `public_use_scope`, `review_text`, `customer_response_note`, `responded_at`.

The SQL files include the Build 156 reference block. Existing-table column additions are guarded in runtime functions with `PRAGMA table_info` checks to avoid duplicate-column failures on Cloudflare D1.

# Build 154 schema update

New/expanded custom request tables:

- `custom_request_quote_line_items` — editable quote lines for material, labour, pickup/shipping, custom charges, quantity, taxable flag, and calculated line amount.
- `custom_request_quote_revisions` — revision/change history for quote creation, sharing, line item changes, customer decline, and accepted follow-through.
- `custom_request_payment_request_drafts` — review-needed payment request drafts created from accepted private quotes.
- `custom_request_order_drafts` — review-needed order drafts created from accepted private quotes.

Expanded table:

- `custom_request_quote_drafts` now self-heals these planning columns when the functions run: `material_cost_cents`, `labor_cost_cents`, `pickup_shipping_cents`, `tax_estimate_cents`, and `quote_total_cents`.

Related behavior:

- `custom_request_reference_uploads` now mirrors uploaded reference images into `media_consent_records` with `source_type='custom_request_reference_upload'`, `consent_status='requested'`, `consent_scope='internal_only'`, and no public/social approval by default.
- `accounting-close-workflow?format=zip` now emits a text/CSV ZIP bundle for accountant handoff.
- Static SEO override baking uses `data/site/seo-page-overrides.json` and `scripts/bake_approved_seo_overrides.py`.

# Build 153 schema reference update

Build 153 adds `custom_request_quote_share_links` for private quote preview tokens, quote status, customer accept/decline timestamps, and response notes. It also adds `custom_request_reference_uploads` for request-bound R2 reference image uploads. Runtime APIs self-heal `custom_requests.upload_token` and `custom_requests.reference_upload_count` for older D1 installations.

# Build 152 schema reference update

Build 152 extends the custom request bridge from intake/drafts into practical follow-up and payment planning.

New tables:

- `custom_request_reply_templates` — stores manual email/copy templates generated from a custom request and quote draft. Nothing is sent automatically. Key fields: `custom_request_id`, `quote_draft_id`, `template_key`, `template_status`, `channel`, `subject`, `body_text`, `copied_at`, `sent_manually_at`.
- `custom_request_payment_candidates` — stores internal deposit/final-invoice candidates from a request/quote draft. Key fields: `custom_request_id`, `quote_draft_id`, `candidate_key`, `candidate_type`, `candidate_status`, `amount_cents`, `currency`, `due_date`, `customer_email`, `source_payload_json`.

Reminder support:

- `notification_outbox` is now guaranteed by the accounting close workflow before queuing HST/GST reminders. The workflow uses `notification_kind='hst_gst_reminder'` and stores period/month/remittance metadata in the payload.

Compatibility note: these additions are idempotent `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` changes and do not remove older custom request draft tables.

# Build 151 schema reference update

Build 151 adds the first D1-backed bridge from public custom request intake into internal work planning.

New tables:

- `custom_request_quote_drafts` — quote planning rows seeded from a custom request.
- `custom_request_job_drafts` — job/work planning rows seeded from a custom request.
- `custom_request_product_drafts` — product draft planning rows seeded from a custom request.
- `custom_request_conversion_events` — event trail showing when a request was converted to a quote/job/product draft.

Runtime-safe optional columns:

- `custom_requests`: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `visitor_token`, `browser_session_token`.
- `site_visitor_sessions` and `site_page_views`: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
- `accounting_hst_gst_reviews`: `remittance_evidence_url`, `reminder_date`.

The Functions self-heal these optional columns with PRAGMA checks so older D1 databases do not fail from duplicate-column migrations. The current pass SQL also documents the expected tables and ledger marker.

# Build 150 schema reference update

## `trust_block_items`

Purpose: stores approved testimonial, local proof, product proof, and supporter trust blocks for public display after admin/privacy review.

Key fields: `trust_block_item_id`, `source_review_id`, `item_kind`, `display_context`, `title`, `body`, `attribution_label`, `rating_label`, `related_product_id`, `related_product_slug`, `locality_label`, `block_status`, `is_public`, `privacy_status`, `approved_by_user_id`, `approved_at`.

## `seo_page_overrides`

Purpose: stores reviewed Search Console action output so page title, meta description, and internal-link note improvements can be applied through D1 with a public fallback script.

Key fields: `seo_page_override_id`, `page_path`, `source_action_id`, `source_query_text`, `override_status`, `title_override`, `meta_description_override`, `internal_link_note`, `approved_by_user_id`, `approved_at`.

## Accounting close workflow tables

- `accounting_payment_applications`: records payment/order application notes, amounts, fees, tax components, provider references, and review status by month.
- `accounting_hst_gst_reviews`: stores monthly HST/GST collected, input tax credits, net payable, filing reference, due date, remittance status, and review notes.
- `accountant_export_packages`: stores generated export manifest records for accountant handoff packages by period/month/year.

## Compatibility note

`seo_opportunity_actions` now includes `applied_override_id` and `applied_at` in the current schema. Existing D1 tables are self-healed by the Search Console admin endpoint to avoid duplicate-column migration failures.

# Build 149 schema reference update

## `custom_requests`

Purpose: stores public custom-request intake for engraving, personalized gifts, handmade jewelry, sublimation, and workshop-made commissions before they become quotes/jobs/products.

Important fields:

- `custom_request_id`
- `request_key`
- `name`, `email`, `phone`
- `request_type`
- `product_interest`
- `deadline_date`
- `budget_cents`
- `message`
- `attachment_urls_json`
- `consent_to_contact`
- `status`
- `admin_notes`
- `created_at`, `updated_at`

Indexes:

- `idx_custom_requests_status` on `status, created_at`
- `idx_custom_requests_email` on `email, created_at`

## `social_caption_templates` behavior

Caption templates are still seeded when missing, but Build 149 stops overwriting edited templates on each schema pass. Admin edits now persist through Social Posting Queue actions.

# Database Schema Reference

## Build 140 schema update

Build 140 expands `social_post_queue` with dry-run and scheduling support: `platform_caption_overrides_json`, `media_quality_warnings_json`, `duplicate_signature`, `do_not_repost`, `schedule_timezone`, `dry_run_payload_json`, and `last_dry_run_at`. The queue also has an index for duplicate/repost review. The endpoint self-heals older D1 installs before use, and `database_upgrade_current_pass.sql` includes the Build 140 ledger marker.


## Build 139 schema update

Build 139 extends the social posting schema reference. `social_post_queue` now includes `last_publish_attempt_at` and `api_publish_mode`. `social_post_attempts` now includes `platform_response_id`, `published_url`, `request_mode`, and `http_status`. Existing D1 installations are self-healed by `/api/admin/social-post-queue` before use because SQLite/D1 does not safely repeat unguarded `ALTER TABLE ADD COLUMN` statements. `database_upgrade_current_pass.sql` includes a Build 139 ledger marker.

# Database Schema Reference

## Build 137 schema update

Build 137 adds `seo_opportunity_actions`, a private admin table for Search Console-derived SEO tasks. It stores page URL, query text, priority score, suggested title, suggested meta description, suggested internal-link note, action status, source batch key, user, timestamps, and notes. Supporting indexes were added for action status/priority and page URL. Search Console CSV rows remain in `search_console_page_queries`; import batches remain in `search_console_import_batches`.

## Build 135 schema reference note

No new structural tables are required for Build 135. The media diagnostics and image-health checks use existing `media_assets`, `product_images`, `product_image_annotations`, `products`, `runtime_incidents`, and `schema_migration_ledger` tables. `database_upgrade_current_pass.sql` includes the Build 135 ledger marker.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

## New or expanded tables in recent passes

### `schema_migration_ledger`
Tracks which SQL files/passes have been applied, skipped, failed, or left pending review. Use `/admin/operations/` to mark the current pass after D1 is updated.

### `accounting_statement_provider_profiles`
Stores import-column mappings for bank, PayPal, Stripe, Square, Etsy, and manual CSV statements.

### `amazon_purchase_import_staging`
Private staging table for Amazon order rows that may match tools or supplies. Build 125 adds review/apply columns:
- `applied_inventory_id`
- `applied_cost_history_id`
- `applied_at`
- `reviewed_by_user_id`

### `site_item_inventory_cost_history`
Tracks inventory unit-cost changes from catalog sync, manual inventory edits, bulk cost edits, and approved Amazon purchase staging rows. This prevents cost updates from being silent overwrites.

### `accounting_reconciliation_exceptions`
Build 125 queue fields include assigned user, accountant review flag, resolved/reopened metadata, and richer statuses.

### `accounting_journal_entries`
Build 125 adds posting/validation metadata:
- `posted_by_user_id`
- `posted_at`
- `validation_message`

## Current money convention
- Store money as integer cents in D1.
- Show dollars in admin forms.
- Convert dollars back to cents before saving.

## Inventory convention
- Current owned tools and supplies are in stock by default with at least `on_hand_quantity = 1`.
- Package consumables are modeled as stock unit plus usage unit count, for example `1 package = 100 sheets`.

## Apply order
1. Deploy the build.
2. Apply `database_upgrade_current_pass.sql`.
3. Use `/admin/operations/` to mark Build 125 applied.
4. Use `/admin/catalog/` to sync tools/supplies and review Amazon staging rows.

## Runtime incident review fields - Build 126

`runtime_incidents` now supports admin review fields in addition to the original incident log columns:

- `review_status` - `open`, `reviewing`, `resolved`, or `ignored`.
- `admin_note` - short internal explanation for the review action.
- `reviewed_by_user_id` - admin user that last changed the review state.
- `reviewed_at` - timestamp of the latest review action.

The runtime endpoint safely backfills these columns after checking `PRAGMA table_info`, then creates supporting indexes. This avoids unsafe duplicate-column failures on older D1 databases.


## Build 127 schema compatibility note

No destructive schema change was required in Build 127. The public `/api/products` endpoint now treats several product, tax, and SEO columns as optional compatibility fields and inspects D1 with `PRAGMA table_info` before referencing them. This specifically prevents older `tax_classes` schemas with `tax_rate` but without `rate_percent` from breaking the storefront query.

## Build 128 schema compatibility note

No destructive D1 schema change is required for Build 128. This is a code compatibility pass for older or partially migrated product schemas.

The public product endpoints now verify optional columns with direct no-row selects before referencing them:

```sql
SELECT merchandise_origin FROM products LIMIT 0;
```

If the select fails, the endpoint omits that column from SQL and returns a safe default such as `handmade` or `onsite` in the API payload. This protects public pages while the full product schema migration is checked/applied.


## Build 129 schema notes

### `amazon_purchase_import_batches`
Tracks private admin imports of Amazon CSV rows before review/apply.

Important columns:
- `import_batch_id`
- `source_file`
- `imported_row_count`
- `skipped_row_count`
- `created_by_user_id`
- `created_at`
- `notes`

### `amazon_purchase_import_staging` additions expected by Build 129
The runtime API safely backfills missing columns after checking the live table. Expected optional/current columns now include:
- `amazon_url`
- `applied_inventory_id`
- `applied_cost_history_id`
- `applied_at`
- `reviewed_by_user_id`
- `updated_at`

### Schema drift report
`/api/admin/schema-drift-report` does not change schema. It compares live D1 columns to the columns the current build expects and classifies gaps as required, recommended, or optional.

## Build 130 schema compatibility note

Build 130 does not require a destructive D1 schema change. It is a code-first compatibility patch for public product reads. The important implementation change is that candidate optional product columns are no longer treated as verified columns. The endpoint now trusts only actual table metadata/sample rows and has a final `SELECT * FROM products` fallback before logging an incident.

This protects older product schemas that do not yet have fields such as `merchandise_origin`, `sale_channel`, `condition_summary`, or similar storefront enrichment fields. Those columns can still be added later through reviewed migrations, but they are no longer required for the public product list to work.

## Build 131 schema reference update

- `tax_classes.rate_percent` is now included in fresh schema files so older and newer storefront/accounting code paths can agree on tax rate naming.
- Storefront repair expects these compatibility areas:
  - `products`: product number/SKU, category/color fields, status/review fields, product type, merchandise origin, sale channel, external listing fields, condition/era/sourcing notes, price/currency/tax/shipping/inventory fields, image/sort/timestamp fields.
  - `tax_classes`: `code`, `name`, `tax_rate`, `rate_percent`, `is_active`, timestamps.
  - `product_seo`: product link, meta title/description, keywords, H1 override, canonical URL, schema type, Open Graph fields, timestamps.
- `database_upgrade_current_pass.sql` records Build 131 as a pending-review ledger marker. The actual ADD COLUMN actions are intentionally handled by `/api/admin/storefront-schema-repair` after checking live D1 because unconditional `ALTER TABLE ADD COLUMN` is unsafe to rerun in D1/SQLite.

## Build 132 schema note

Build 132 does not add or remove D1 tables/columns. It is a code/CSS/mobile UX pass. The schema files were still touched with a no-structure-change note, and `database_upgrade_current_pass.sql` contains a Build 132 ledger marker so the release can be recorded in the migration ledger.

## Build 133 schema update

Build 133 adds Search Console CSV staging tables: `search_console_import_batches` and `search_console_page_queries`. These support future imports of page, query, clicks, impressions, CTR, average position, country, and device data.

The pass also adds `/api/admin/storefront-value-backfill`, which performs runtime-safe product default backfills only after checking live D1 columns. This avoids unconditional `ALTER TABLE` patterns that are unsafe in D1/SQLite.

## Build 134 schema note

No structural D1 schema change is required for Build 134. The product create endpoint now inspects live `products`, `product_images`, and `product_seo` columns before inserting, which protects older D1 databases while Storefront Schema Repair remains the preferred long-term schema alignment tool.

## Build 136 status — 2026-05-18

- Added Operations > Search Console CSV Import.
- Added `/api/admin/search-console-import` for private D1 staging of Search Console CSV exports.
- Added top-page and SEO-opportunity summaries for manual title/meta/internal-link review.
- Added Release Sanity coverage and current-pass SQL table/index self-healing for the Search Console staging tables.
- Keep Search Console CSV exports private; do not store them in public `/data/`.

Next deployment checks: apply/record `database_upgrade_current_pass.sql`, open `/admin/operations/`, import a tiny Search Console CSV sample, then run Release Sanity and Public API Health.


## Build 138 schema additions

- `social_platform_connections` tracks platform readiness, profile URLs, required scopes, and manual/API readiness.
- `social_post_queue` stores reviewed social captions, target platforms, source/job reference, media URLs, status, and schedule notes.
- `social_post_attempts` records manual posted URLs now and future API attempts later.


## Build 141 schema note — social caption templates and UTM links

Build 141 adds/updates these social queue schema pieces:

- `social_caption_templates`
- `social_post_queue.caption_template_key`
- `social_post_queue.content_pillar`
- `social_post_queue.call_to_action`
- `social_post_queue.utm_source`
- `social_post_queue.utm_medium`
- `social_post_queue.utm_campaign`
- `social_post_queue.utm_url`

The `/api/admin/social-post-queue` endpoint self-heals the optional columns before use so older D1 databases do not fail immediately after deployment. The current migration includes the Build 141 ledger marker.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.


## Build 143 — Social Media Privacy Guard + Competitive Execution

Completed in this pass:

1. Added Operations > Social Media Privacy Guard.
2. Added `/api/admin/social-media-privacy-guard`.
3. Added `social_media_privacy_rules` and `social_post_privacy_reviews` schema support.
4. Added default rules for customer/private identifiers, workshop background leaks, product-only media, personal wording review, and visible children/visitors.
5. Added privacy columns to `social_post_queue` through runtime-safe self-healing.
6. Blocked API publishing from Social Posting Queue until the queued post is privacy-approved or marked no-private-media.
7. Added Release Sanity checks for the Social Media Privacy Guard endpoint and open posts needing privacy review.
8. Expanded `COMPETITIVE.md` with competitive execution details, product-page direction, social calendar, trust/privacy posture, marketplace direction, accounting/margin priorities, and immediate/next/later implementation waves.
9. Expanded `data/site/competitive-opportunities.json` with social privacy, product story, and local trust block opportunities.
10. Updated schema files and active Markdown handoff docs.

Next strongest directions:

1. Render product-story blocks publicly on product detail pages.
2. Add a reusable local trust block to Home, About, Shop, Contact, product, and local pages.
3. Add “post this product” from Product editor into Social Posting Queue.
4. Add admin-editable caption templates.
5. Add social analytics rollups from UTM links and manual/API post URLs.
6. Add product media role checklist: main/detail/scale/process/packaging/video.
7. Add customer media consent records for job/customer-specific posts.
8. Add testimonials/review approval workflow.
9. Add marketplace export readiness checks.
10. Continue payment application, HST review, period close, and accountant export packaging.

## Build 144 schema addition — product story notes

### `product_story_public_notes`

Purpose: stores approved or publish-ready public storytelling copy for product detail pages without mixing private supplier, Amazon, accounting, or raw admin notes into public rendering.

Important fields:
- `product_story_public_note_id`
- `product_id`
- `story_heading`
- `story_summary`
- `story_body`
- `process_notes`
- `care_notes`
- `local_pickup_note`
- `display_status` — expected values are draft, approved, or published.
- `created_by_user_id`, `updated_by_user_id`, `created_at`, `updated_at`

Public `/api/product-detail` now attempts to read the latest approved/published note. If the table or row is missing, the public page safely falls back to existing product fields.

## Build 146 schema reference update

### `product_story_public_notes` additions

The product story notes table now includes optional review/support columns in the reference schema:

- `story_source`
- `privacy_status`
- `review_notes`
- `internal_notes`

These support the admin Product Story Notes editor. The endpoint also attempts safe runtime column backfills for older D1 databases so the editor can work even if a previous Build 144 table exists without these optional columns.

Recommended statuses:

- `display_status`: `draft`, `review`, `approved`, `published`, `archived`
- `privacy_status`: `needs_review`, `safe`, `private_detail_removed`, `blocked`



## Build 147 schema note — media consent records

Added `media_consent_records` for private tracking of product/job/customer/social media approval.

Main fields:

- `consent_record_id`
- `consent_key`
- `subject_label`
- `source_type`
- `source_id`
- `media_url`
- `consent_status`
- `consent_scope`
- `public_use_allowed`
- `social_use_allowed`
- `privacy_notes`
- `reviewed_by_user_id`
- `expires_at`
- `created_at`
- `updated_at`

This table is private D1 data and should not be mirrored into public `/data/` JSON.


## Build 148 Schema Notes

Build 148 adds `product_image_role_reference` and extends the runtime product-image annotation model with optional fields: `image_role`, `public_use_status`, `consent_record_id`, and `role_review_notes`. Existing D1 databases are self-healed by `/api/admin/product-images` because SQLite/D1 migrations cannot safely re-add already-existing optional columns without live introspection. The current pass SQL seeds the role reference table and records the migration ledger marker.

## Build 155 schema additions

New/expanded custom request tables and fields:

- `custom_request_payment_links` stores approved private payment review links for reviewed payment-request drafts.
- `custom_request_order_drafts.order_id`, `converted_by_user_id`, and `converted_at` connect reviewed order drafts to real order records.
- `custom_request_payment_request_drafts.approved_payment_link_id` and `approved_payment_link_url` connect reviewed drafts to approved payment review links.
- `custom_request_quote_share_links.version_number`, `supersedes_share_link_id`, `resent_at`, and `resend_note` support revision/resend links.
- `custom_request_marketplace_export_packs` stores Etsy, Facebook Marketplace, Pinterest, and manual listing copy.
- `custom_request_fulfillment_prompts` stores draft review/photo/consent prompts for completed custom work.
- Product/shop APIs now expose proof fields derived from product/material/process/locality columns and public story notes.

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

