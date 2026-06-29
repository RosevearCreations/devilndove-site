# Devil n Dove AI Handoff — Build 198

Read this file first in a new chat, then `PROJECT_STATUS_AND_ROADMAP.md` and `MARKDOWN_INDEX.md`. Those two files remain the canonical current direction; retain specialist runbooks and historical context rather than deleting it.

## What Build 198 changes

Build 198 resolves the reported Tools & Supplies Inventory editing failure and closes the featured-image loss path.

- **Inventory is now a true full-record editor.** `Edit full record` is visible inside the first table column as well as in the action area. On narrow phones the hidden far-right action column no longer prevents editing.
- **Save now uses the correct operation.** Loading an item into the form sets edit mode and sends `PATCH`; adding a new item sends `POST` and leaves the new record open for additional edits instead of clearing the form.
- **Full operational fields are editable:** name, description, category, image/source URLs, on-hand/reserved/incoming quantities, reorder controls, unit costs, units, supplier details, reuse status, notes, and active status. Source type and external key remain stable after creation to avoid breaking existing product-resource links.
- **First retained product image is canonical.** Create/update paths set a blank featured URL to the first image. Product updates preserve omitted media and reorder retained rows after an explicit featured image so only one first image is authoritative.
- **Approval repairs, rather than loses, a missing featured field.** Before product review, a blank `products.featured_image_url` is recovered from the first retained `product_images` row. No photo/video row or R2 file is removed.
- `database_build198_inventory_editor_featured_media_integrity.sql` safely backfills blank featured image fields in D1 and adds an ordering index.

## Deployable files and order

1. Back up production D1.
2. Confirm Builds 196 and 197 are applied.
3. Run `database_build198_inventory_editor_featured_media_integrity.sql`. It is safe to rerun.
4. Deploy this complete Pages build, including `functions/` and static assets.
5. Use `POST_DEPLOY_SMOKE_TEST.md` before calling the live site fixed.


---

## Build 197 retained context
## What Build 197 changes

Build 197 targets the live admin failures and the product-entry problems reported from the deployed Pages site.

- The product detail API now reads schema variations safely instead of assuming every newer media/SEO column exists.
- Community Content, Custom Requests, Social Post Queue, and Live Readiness dashboard reads now avoid routine schema/seed work where possible and return a stable degraded response instead of breaking the page when optional data is not yet ready.
- Product update 409 conflicts are treated as permanent review items, not transient outages. The editor no longer places duplicate SKU, slug, or system-number conflicts into its retry queue.
- The unused-product correction panel now keeps its handlers scoped to the currently loaded product, preventing a stale first deletion action from disabling later corrections.
- A normal product save preserves existing media. The dedicated media editor now removes only rows that the admin explicitly deletes and confirms with Save Images; ordinary saves, sorting, featured-image selection, SEO/OG changes, and partial editor views do not clear unrelated media.
- Product-media audit records are added by `database_build197_application_resilience_media_catalog.sql`.
- Additional Colours accepts the editor field name and normalizes a simple comma/newline list.
- Soap and Candles are included in default categories. `/admin/catalog/` now has **Manage product categories**, which writes reusable category choices to `app_settings`.
- Shop product cards are image-first with the facts, price, and actions beneath the picture. Missing product imagery uses a labelled visual placeholder, not a fake product photograph.
- Phone navigation is a compact popup with closed accordion groups rather than a full-height list.

## Deployable files and order

1. Back up the production D1 database.
2. Confirm Build 196 is applied.
3. Run `database_build197_application_resilience_media_catalog.sql` once. It is safe to rerun.
4. Deploy this complete Pages build, including static files and `functions/`.
5. Purge only normal edge/browser cache if the old JavaScript is still served; do not delete R2 media as part of this release.
6. Run `POST_DEPLOY_SMOKE_TEST.md` before treating the fixes as live.

## D1 migration order

Run only migrations that the production migration ledger does not already list. Do not rerun older non-idempotent migrations merely because this list exists.

```text
database_build171_ledger_repair.sql only when its schema exists but its marker is missing
database_build173_deployment_preflight.sql
database_build174_deployment_preflight_detail.sql
database_build175_release_control.sql
database_build176_release_safety_controls.sql
database_build177_deploy_score_and_controls.sql
database_build178_promote_live_controls.sql
database_build179_promotion_control.sql
database_build180_go_live_execution.sql
database_build181_live_ops_followthrough.sql
database_build182_mobile_visual_polish.sql
database_build183_visual_enrichment_studio.sql
database_build184_sanity_check_and_value_roadmap.sql
database_build185_admin_command_center_value_dashboards.sql
database_build186_markdown_consolidation_visual_placeholders.sql
database_build189_value_ops_live_counts.sql
database_build190_integrated_value_operations.sql
database_build191_value_operations_followthrough.sql
database_build192_operational_data_connection.sql
database_build193_live_readiness_playbook.sql
database_build194_storefront_discovery_product_facts_media_roles.sql
database_build195_product_lifecycle_sku_inventory_cards.sql
database_build196_product_correction_material_returns.sql
database_build197_application_resilience_media_catalog.sql
```

Builds 187 and 188 were routing/environment hotfixes without a D1 migration.

## Immediate verification targets

The following deployed calls should return JSON and a status appropriate to authentication/data state—not a Cloudflare Pages 503:

```text
GET  /api/admin/community-content
POST /api/admin/live-readiness-playbook (action: record_usage)
GET  /api/admin/custom-requests
GET  /api/admin/social-post-queue
GET  /api/admin/product-detail?product_id=<known product ID>
```

A 401 while signed out is expected. A 200 with `degraded: true` is an intentional safe dashboard fallback and should be followed by checking migration/deployment logs; it is preferable to an unusable admin page.

## Product and media rules

- `products.product_number` is the permanent internal **System #**. Do not reuse it after deletion.
- A blank SKU is generated as `DND-xxxxx`; a custom SKU must still be unique.
- Products with customer, order, or other business history are archived rather than deleted.
- Permanent unused-product correction requires password, reason, confirmation phrase, and reviewed material actions.
- `product_images` represents product image records. A normal save may add or update them but may not remove an existing record unless `media_sync_mode: explicit_remove` and an approved `removed_image_ids` list are supplied.
- Do not delete source R2 files automatically: a file may be referenced elsewhere. R2 deletion stays an explicit asset-library action.
- Treat videos independently from images. Editing an OG/featured image must not overwrite a product video URL.
- First image remains the preferred featured candidate; visual scoring is guidance, not evidence that a photo is accurate.

## Category administration

Open `/admin/catalog/`, expand **Manage product categories**, add one category per line, and save. Categories are stored in `app_settings` under `site.catalog.product_category_options`, combined with existing product categories, and then appear in the product editor. Soap and Candles are already supplied as defaults.

## SEO and storefront rules

- One visible H1 per public route; it should state the page’s main purpose.
- Keep title, meta description, canonical URL, visible price/availability, and product structured data aligned.
- Use descriptive alt text for meaningful product images and empty alt text for decorative placeholder art.
- Mobile and desktop must expose the same meaningful product facts and paths to purchase.
- Product cards should show the image, name, price, short truthful facts, and a clear action together.
- Never present a placeholder as a finished product or proof of a service.

## Current limits / not yet claimed complete

This build fixes the failure paths and improves the visible workflows, but deployment is still required before a live 503 can be declared resolved. External systems also need live owner evidence: R2 derivative generation, Stripe webhooks, transactional email, Search Console/GBP imports, real fee/cost data, marketplace delivery, and device screenshots. Do not claim these as completed merely because UI foundations exist.

## Documentation policy

Canonical files:

1. `PROJECT_STATUS_AND_ROADMAP.md` — human/business priority and release decision source.
2. `AI_HANDOFF.md` — technical current-state and deployment source.

Keep specialist markdowns until their unique instructions have either been moved into these two files or archived. Do not create more general-roadmap files; update the canonical pair instead.
