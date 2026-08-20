# Database Schema Reference — Build 277

## Current migration and production-parity boundary

The retained broad/current-pass migration remains Build 264. Focused additive migrations are applied after it in release order:

- broad/current-pass boundary: `database_upgrade_current_pass.sql` (Build 264; intentionally retained)
- focused CAIP integrity/dedupe: `database_build269_caip_social_project_dedupe_integrity.sql`
- Creative Process correction lifecycle: `database_build274_creative_process_lifecycle_corrections.sql`
- Packaging ingredient Inventory-reference support: `database_build276_packaging_inventory_inci_capacity.sql`

Use the matching read-only `BUILD269_D1_VERIFICATION.sql`, `BUILD274_D1_VERIFICATION.sql`, and `BUILD276_D1_VERIFICATION.sql` after those focused migrations. `database_full_schema.sql`, `database_schema.sql`, `database_store_schema.sql`, and `functions/api/_lib/fullSchemaRequirements.js` are synchronized through Build 276 for fresh-install/runtime parity. Focused migrations are **not** copied over `database_upgrade_current_pass.sql`; production applies them after the retained Build 264 broad boundary.

## Build 277 code-only schema note

Build 277 changes Packaging Studio rendering/readiness only: separate English/French ingredient panels and wider claim spacing. It adds no table, column or index. **Build 276 remains the Packaging schema migration boundary** and `functions/api/_lib/fullSchemaRequirements.js` correctly remains at schema build 276.

## Build 276 Packaging schema delta

`packaging_project_ingredients` gains nullable `site_item_inventory_id` plus `idx_packaging_project_ingredients_inventory`. The field is deliberately **reference-only**: Packaging Studio resolves source/INCI identity through Inventory/Material Library but does not create Inventory movements or change stock. Aggregate schema authorities and `fullSchemaRequirements.js` are synchronized to Build 276.

## Build 274 Creative Process schema delta

`creative_work_events` gains `entry_status`, `void_reason`, `voided_by`, and `voided_at` plus a project/status index. Posted material usage is never hard-deleted: corrections/voids reverse stock through existing compensating inventory tables and preserve superseded timeline history for audit.

## 2026-08-17 auth/blog production-parity maintenance

Production authentication now uses `users` and `sessions`. The live migration preserved historical member IDs and session data while retiring the old auth names to `members_legacy` and `member_sessions_legacy`. Historical `blog_posts.author_member_id` and `blog_comments.member_id` still reference `members_legacy`, so those compatibility tables are preservation dependencies rather than current auth authorities.

Rules:

- new auth/session writes use only `users` / `sessions`;
- never recreate active `members` / `member_sessions` auth tables;
- never drop `members_legacy` / `member_sessions_legacy` while blog foreign keys or historical evidence still depend on them;
- the retired `database_auth_legacy_to_current_repair*.sql` files are safety stubs and must not mutate production;
- fresh aggregate schemas retain the legacy/blog compatibility tables so a rebuild does not silently erase the production dependency graph.

## Build 269 CAIP schema delta

`caip_media_upload_files` adds `content_fingerprint`, `content_fingerprint_version`, and `recovery_of_file_id`, plus indexes for strong content-fingerprint lookup and recovery lineage. Multipart completion is fail-closed against actual persisted part rows and exact byte totals; duplicate handling is performed before binary transfer wherever a strong or transitional fingerprint match is available.

---

## Build 256 — Media & Content Management Studio

Build 256 adds `managed_media_metadata`, `media_content_slots`, `media_content_assignments`, `managed_content_blocks`, and `media_content_change_audit`. Existing `media_assets` remains the physical/public media record; the new tables add owner-authored metadata, explicit page placement, selected page-text publication and audit history without creating a second R2 inventory. `media_content_assignments` permits only one active media assignment per page slot. Public page manifests are bounded D1 reads and never enumerate R2; explicit admin R2 sync only registers media assets and never creates assignments.

# Build 247 schema delta

- `packaging_formula_library`: reusable soap/product formulas with product identity, default rose direction and ordered structured ingredient JSON.
- `packaging_content_library`: reusable `ingredient`, `fragrance_oil`, `colourant` and `claim` entries with bilingual/INCI/icon metadata.
- Build 247 seeds one Health Oatmeal & Goat Milk formula, 16 ingredient library rows and four bilingual claim rows.
- Existing `packaging_templates` soap layouts are updated to `soap_reference_v2`/`truth_reference_oval` and no longer contain a fixed purple `artwork_asset`.

# Database Schema Reference — Build 246

## Current migration boundary

Build 246 is the current additive production migration:

- numbered: `database_build246_product_project_production_packaging.sql`
- current pass: `database_upgrade_current_pass.sql`
- read-only post-migration check: `BUILD246_D1_VERIFICATION.sql`

The numbered/current-pass SQL files are byte-identical. Back up production D1 and apply **one**, never both. Build 245 is the prerequisite production boundary. Build 246 is additive/idempotent, uses no TEMP-table or destructive table-removal operation, and records ledger key `build246_product_project_production_packaging`.

Build 246 adds five lower-case D1 authorities: `creative_project_deletion_audit`, `product_resource_ingredient_profiles`, `product_production_runs`, `product_production_run_materials`, and `packaging_translation_reviews`. These support audited Creative Project deletion with unreversed-inventory compensation, finished-product material/ingredient release snapshots, and review-required packaging translation evidence. `database_full_schema.sql` is the supported complete fresh-install aggregate. `database_schema.sql` and `database_store_schema.sql` remain scoped overlays and explicitly point to the current Build 246 migration.

## Runtime integrity rules added in Build 246

- Product deletion may auto-clean only unreviewed generated Content Studio/CAIP shells; meaningful project/history/output evidence still blocks deletion.
- Posted `product_production_runs` are protected product history.
- Creative Project deletion returns only unreversed raw consumption, writes correction movements, and stores a deletion audit.
- Finished Product Production Release is idempotent and stores immutable material/ingredient snapshots before the finished quantity is treated as released.
- Same-project CAIP media duplicates are skipped at intake rather than inserted a second time.
- Soap packaging uses reviewed Product Resource ingredient/INCI profiles and stores French draft/review evidence separately from approved copy.

## Retained Build 245 foundation

### Historical Build 245 migration boundary

Build 245 was the previous additive production migration and remains the prerequisite for Build 246:

- historical numbered file: `database_build245_admin_media_resilience.sql`

At Build 245 release time its current-pass file was byte-identical; `database_upgrade_current_pass.sql` now correctly points to Build 246. Back up production D1 and apply **one**, never both. Build 245 intentionally includes the complete Build 244 inventory-authority/fractional-usage transition so a Build 243-era database can upgrade directly; rerunning over an already-applied Build 244 database is designed to remain idempotent. Confirm ledger keys `build244_inventory_authority_fractional_usage` and `build245_admin_media_resilience`.

The Build 245 migration uses **no TEMP table and no DROP TABLE**, avoiding the D1 `SQLITE_AUTH` cleanup problem exposed by the Build 243 temporary helper.

## D1 catalog/inventory authority retained

`catalog_items` is the master descriptive authority for tools/supplies. `site_item_inventory` is the operational stock/cost/reservation authority. Legacy tool/supply JSON remains read-only provenance/emergency fallback. Build 244/245 migration content carries 897 legacy rows (399 tools + 498 supplies), populates missing operational inventory database-side, and retains exact/estimated/log-only/reusable fractional usage through `site_inventory_usage_profiles`, `site_inventory_usage_movements` and `creative_project_inventory_usage_details`.

Controlled classifications and database object identifiers are lower-case. Human display names, URLs, ASINs, SKUs, order numbers and currency codes preserve meaningful/external case.

## Build 245 product-media integrity

### `product_media_integrity_snapshots`

Migration-time diagnostic evidence per product:

- `product_image_count`
- `media_asset_count`
- `role_assignment_image_count`
- `annotation_image_count`
- `recoverable_unique_image_count`
- `featured_image_url`
- `featured_image_recoverable`
- notes / created timestamp

This is **not** a mutable gallery authority. `product_images` remains the preferred Product Editor gallery. Build 245 can non-destructively insert missing URLs from non-deleted `media_assets`, non-removed `product_media_role_assignments` and `product_image_annotations`, deduped and limited to the first seven canonical editor positions. Existing gallery rows are never deleted and a nonblank selected featured image is never overwritten.

New lookup indexes cover product image order, image annotations and role assignments.

### `admin_api_health_observations`

Schema foundation for bounded future endpoint-health evidence: path, HTTP status, error code, Cloudflare Ray, duration, source and notes. Build 245 does not claim this table replaces Cloudflare Observability or existing runtime incidents; it is available for a later bounded writer.

## Admin degraded-auth policy

`app_settings` includes:

- `site.admin.auth_degraded_policy = retain_cached_admin_on_5xx_v245`
- `site.product.media_integrity_policy = linked_media_recovery_v245`
- `site.inventory.bootstrap_policy = lightweight_reference_bootstrap_v245`

The browser may retain a cached admin identity during temporary 5xx/timeouts to avoid a false signed-out UI. Server APIs remain authoritative and authenticated. Only explicit 401/403 rejection may clear the cached session automatically.

## Runtime schema rule

Routine Inventory Operations, Product Resources, Product Readiness and Product Images reads/writes must not install schema. Numbered migrations own prerequisites. Missing prerequisites return structured migration-required/unavailable JSON when the Worker receives control.

## Aggregate schema scope

- `database_full_schema.sql` — complete supported aggregate including Build 244 + Build 245 foundations and the Build 246 executable block.
- `database_schema.sql` — scoped historical/core aggregate plus Build 246-safe definitions/settings where owned.
- `database_store_schema.sql` — scoped store aggregate plus Build 246-safe definitions/settings where owned.

Use `BUILD246_D1_VERIFICATION.sql` after production migration for read-only Build 246 plus retained case/media-integrity checks. Historical Build 245 verification lives under `docs/archive/build-history/`. Historical numbered migrations remain at root; historical prose belongs under `docs/archive/build-history/`.
