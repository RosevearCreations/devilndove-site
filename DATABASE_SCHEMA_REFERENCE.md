# Devil n Dove Database Schema Reference — Build 233

## Build 233 database boundary

Build 233 is code-only. It adds no table, column, index, seed or migration-ledger row. The bounded login uses the existing `idx_users_email`, `sessions` indexes and `users.last_login_at`; one D1 `batch()` creates the session and updates the login timestamp atomically. The 897-row Amazon reference remains a private compressed code payload and is demand-loaded only by authenticated inventory routes; moving its purchase identifiers to a public JSON file is prohibited. `scripts/build233_login_resource_test.mjs` proves exactly two executed D1 operations, the match round trip, no POST schema introspection and no current-migration change. Do not apply a migration merely because the application package is Build 233.

## Build 232 database boundary

Build 232 is code-only. It adds no table, column, seed or migration-ledger row. The current production schema boundary remains Build 230, and `database_upgrade_current_pass.sql` remains byte-identical to `database_build230_visual_image_manifest.sql`. Product-removal safety is implemented through a bounded code registry whose aggregate-schema coverage is validated by `scripts/build232_product_removal_test.mjs`; no migration should be applied merely because the application package is Build 232.

## Build 231 database boundary

Build 231 is code-only. It adds no table, column, seed or migration-ledger row. The current production schema boundary remains Build 230, and `database_upgrade_current_pass.sql` remains byte-identical to `database_build230_visual_image_manifest.sql`. Do not reapply that migration merely because the application package is Build 231.

## Build 230 database boundary

Back up D1 and confirm Build 229 is installed. Apply `database_build230_visual_image_manifest.sql` or the identical `database_upgrade_current_pass.sql`, not both. Build 230 adds:

- `image_manifest_items` — one current row per static or dynamic visual need, including required asset kind, current/final URL, status, rights, public-use, alt text, owner, evidence, device results, generated provenance and blocker state.
- `image_manifest_history` — append-only review changes with previous/next status and assets, rights/public/device state, evidence, note, actor and time.
- 20 idempotent manifest rows, including three generated-editorial provenance rows; repeated migration execution refreshes seed metadata without overwriting operator status/evidence.
- migration ledger key `build230_visual_image_manifest`.

`IMAGES_REQUIRED.md` remains the human capture/crop standard and `GENERATED_VISUAL_ASSET_REGISTER.md` preserves generated-file hashes/prompts. Mutable owner/status/evidence stays in D1. A generated asset never satisfies a real-photo requirement.

The migration contains no explicit SQL transaction statements. D1/Durable Object JavaScript uses `state.storage.transaction()` or `transactionSync()` when a transaction is required.

## Build 229 database boundary

Back up D1 and confirm Build 228 is installed. Apply `database_build229_packaging_reference_authority.sql` or the identical `database_upgrade_current_pass.sql`, not both. Build 229 adds:

- `packaging_reference_sources` — one registered row per adopted packaging-direction file with source key/name/type, repository path, SHA-256, authority scope, structured dimensions, notes and active/adopted review state.
- three idempotent source rows for the supplied Markdown specification, PDF guide and SVG master.
- migration ledger key `build229_packaging_reference_authority`.

This table does not duplicate editable packaging projects or label content. It registers provenance/direction; packaging projects, normalized soap rows, versions, exports and physical print tests remain their specialist authorities. `PACKAGING_REFERENCE_BASELINE.md` documents the dimensional discrepancy and approval rule.

The migration contains no `BEGIN`, `COMMIT`, `SAVEPOINT`, `RELEASE` or `ROLLBACK`. Do not add them for D1/Durable Object execution; use the JavaScript storage transaction APIs when a JavaScript transaction is required.

## Build 228 retained boundary

Build 228 added `creative_automation_workflows`, `creative_automation_stage_reviews`, `creative_automation_events` and ledger key `build228_creative_automation_prelaunch_stages`. Those orchestration tables remain additive and do not duplicate specialist Creative Process, CAIP, Content Studio, publication, social or analytics facts.

## Build 227 retained boundary

Build 227 added `packaging_components`, `customer_document_sequences`, immutable `customer_documents`, four general packaging templates and ledger key `build227_unified_business_operations`. Issued client documents remain snapshots; wrong documents are voided/replaced. Packaging BOM save does not consume stock.

## Historical Build 226 boundary

Build 226 was a code-only Startup Readiness loading repair. Build 225 created the readiness tables and 37 original item keys. Build 228 preserved those keys and seeded five additional process keys. Build 229 preserves all 42 and seeds `missing_launch_images`, for 43 expected active rows without overwriting existing operator status/evidence.

## Current schema authority

- Fresh database: `database_full_schema.sql` or the intentionally scoped aggregate schema appropriate to the deployment.
- Existing production database: confirm Build 229 is installed, then apply one Build 230 migration named above.
- The Build 225 current-pass migration creates and seeds `startup_readiness_items` and `startup_readiness_history`. It does not replay the historical Packaging Studio/Soap Label migrations.
- Production must already include the Build 221 Packaging Studio and Build 222 normalized soap-label tables before applying Build 225.
- Builds 223 and 224 were code-only product-detail/gallery compatibility repairs and required no schema migration.

## Build 225 tables and ownership

### `startup_readiness_items`
Stores one current row per launch gate, including phase, severity, blocker flag, live-binding requirement, internal route, external location, detailed instructions, pass condition, status, owner, due date, evidence URL/notes, blocked reason, completion actor/time, last updater, and active state. Seed refreshes update instructions and metadata without overwriting the operator's status/evidence.

### `startup_readiness_history`
Append-only-style evidence for each status update, including prior/next status, owner, due date, evidence, blocked reason, actor, and change time. The main item row remains the current-state authority; history remains the audit trail.

### Packaging data authority
- Broad project/template/version/export state: `packaging_templates`, `packaging_projects`, `packaging_project_versions`, `packaging_export_history`.
- Normalized soap content and proof: `soap_label_templates`, `soap_products`, `soap_ingredients`, `soap_label_claims`, `soap_label_exports`, `soap_label_print_tests`.
- Commerce price, public product identity, and sellable inventory remain in `products` and established inventory tables.
- `PACKAGING_STUDIO.md` is the current human-readable implementation map. `PACKAGING_REFERENCE_BASELINE.md` and the three adopted source files govern packaging direction; the root soap-label file is a compatibility pointer.

## Current migration boundary

`database_upgrade_current_pass.sql` is the additive Build 230 migration only and is byte-identical to its numbered file. It assumes Build 229. Do not use it as an accumulated history replay. Use numbered historical migrations to understand/repair an older database, and back up D1 before applying any production change.

---

# Historical schema notes

Builds 223–224 were code-only product-detail/gallery compatibility fixes. Their runtime schema introspection does not replace keeping D1 and aggregate schemas synchronized. Build 222 introduced the normalized soap-label schema; Build 221 introduced Packaging Studio and lot-reconciliation structures.

# Build 216 additions
- `creative_project_inventory_posts`: one idempotent inventory posting per approved material review.
- `creative_project_caip_mirrors`: tracks Creative Project evidence mirrored into CAIP.
- `creative_project_cost_templates`: reusable labour, packaging, overhead, fee and shipping assumptions.

# Build 208 schema note

Build 208 does not require a D1 migration. `/api/admin/product-release-preflight` is read-only and detects absent optional Content Studio, CAIP, and Content Release Board tables rather than creating them. `/api/admin/product-featured-image-sync` updates only `products.featured_image_url` after an explicit administrator request and an existing retained `product_images`/`media_assets` candidate match. It does not change source-media rows, annotations, consent, Content Studio, CAIP, or publication state.

---

# Build 206 schema note

Build 206 does not require D1 migration. Catalog APIs normalize a tax class stored as a fraction (`0.13`) or a historic whole percentage (`13`) into `tax_rate` (fraction) and `rate_percent` (display). Product-detail reads existing `products.featured_image_url`, `product_images`, and non-deleted `media_assets` safely; it does not create, delete, or change media rows on read.

---

# Database Schema Reference — Build 202

Use `database_full_schema.sql` for a fresh database. Use numbered migrations in order for an existing production database. The current migrations are:

```text
database_build201_creative_asset_intelligence_platform.sql
database_build202_caip_media_operations_secure_review.sql
```

Apply Build 201 after Builds 199 and 200, then apply Build 202. Both are additive and safe to rerun. Build 202 does not convert, move, copy, publish, or delete source media. It creates reference/control records only; it does not copy, move, delete, overwrite, reorder, feature, or publish product/R2/media records.

## Build 199 Content Automation Studio

- `content_projects` — one review-first content package per source (`product` now; future detailing jobs may use another source type).
- `content_project_media` — source-linked archive rows, selection score, reviewer safety state, and product/media references. No source media is deleted or relocated.
- `content_project_deliverables` — exact output plans, copy, scripts, output URLs, review states, and Social Queue link.
- `content_render_jobs` — provider-neutral rendering/export handoffs. Build 201 still uses manual export, not MP4 encoding.
- `content_project_events` — package audit activity.

## Build 200 Content Release Board

- `content_publications` — one public draft per content-project destination (`workshop_journal` or `website_gallery`), including copy, public media references, search title/description, safe path, release status, copy lock, and explainable manual metrics.
- `content_publication_events` — audit records for prepare, refresh, update, approve, publish, unpublish, and metric snapshot actions.

## Build 201 Creative Asset Intelligence Platform

- `creative_projects` — canonical CAIP project identity linked one-to-one to a `content_projects` package/source/product. Includes lifecycle/governance status, policy snapshot, and internal approval record.
- `creative_assets` — reference-only canonical asset records. Stores source IDs/URLs/fingerprint/logical archive path, inherited safety, local CAIP rights status, source role/selection/feature state, tags, notes, and source metadata.
- `creative_asset_analyses` — versioned deterministic metadata analysis/results: technical, story, reuse, total/confidence scores, reasons/evidence, and human-review requirement.
- `creative_asset_recommendations` — destination-role candidate records for website hero/gallery, YouTube thumbnail, and short-video use. They remain review candidates only.
- `creative_story_evidence` — source references and claim/fact records with verification/review/visibility/lock state.
- `creative_story_segments` — ordered editable/lockable story spine sections linked to evidence keys.
- `creative_policy_decisions` — source-integrity, rights, story provenance, and public-search readiness decision signals.
- `creative_intelligence_runs` — auditable sync/intelligence run records; Build 201 uses local metadata only.
- `creative_project_events` — immutable-style activity/event trail.

### Critical integrity boundary

`creative_assets` is **not** a media-file table. It is a reference/control layer. A source is never deleted when a CAIP asset is updated, a project is refreshed, an analysis is rerun, a recommendation is rejected, a story is edited, or a CAIP project is unapproved.

The established product-media integrity rules remain: ordinary product saves preserve media; only explicit media deletion can remove a product-image row; R2 source deletion remains a separate explicit asset-library action.

## Build 202 — CAIP media operations and secure review

- `creative_asset_probe_jobs` — bounded record of metadata/R2-head probe intent, status, retry ceiling, sanitized input/output evidence, and source fingerprint.
- `creative_asset_technical_observations` — latest recorded technical observation for a CAIP asset/probe version; no media-body/visual inference implied.
- `creative_derivative_recipes` — immutable source-specific future-output specification, including dimensions, aspect ratio, format, policy snapshot, and recipe hash.
- `creative_asset_derivatives` — planned/future verified output lineage. In Build 202, output object/URL/checksum are intentionally empty and `verification_status` is `not_created`.
- `creative_asset_access_grants` — SHA-256 hash-only short-lived authenticated review grants, expiry, view cap, user binding, and revocation state. Raw review tokens are never stored.
- `creative_asset_access_audit` — secure-review grant events/outcomes without raw token or credential data.
- `creative_provider_profiles` — disabled non-secret provider/capability registry. A row is not an active integration.
- `creative_execution_budget_controls` — disabled CAD per-project/per-capability budget policy records for future provider work.

The Build 202 schema is additive. It does not change the source-media ownership of `product_images`, `media_assets`, `content_project_media`, or R2 objects.

> Build 207 note: no D1 migration is required. The product-content bridge uses existing additive Content Studio/CAIP schema routines only after an administrator explicitly invokes a package action.

## Build 208 release-preflight schema boundary

Build 208 adds **no mandatory D1 migration**. `/api/admin/product-release-preflight` detects and reads available existing catalog, media, Content Studio, CAIP, and Release Board tables. `/api/admin/product-featured-image-sync` updates only `products.featured_image_url` after an explicit admin request using an already retained product/media URL.


## Build 210 — Product social draft automation

`product_social_automation_settings` is a singleton configuration table (`settings_id=1`) for optional **review-first** product social drafts.

- Defaults to `auto_queue_enabled = 0`.
- Controls the eligible review status, active/image prerequisites, default destinations, hashtag set, caption-template key, and UTM campaign.
- It does not contain platform credentials.
- Product-triggered queue rows use `source_type='product'` and `source_id=<product_id>`.
- New rows must start as `approval_status='needs_review'`, `post_status='draft'`, `privacy_status='needs_review'`, and `approved_for_public_post=0`.

Platform tokens, client secrets, OAuth codes, Page tokens, and refresh tokens remain Cloudflare encrypted Secrets, not D1 schema data.

## Build 214 optional project/product relationship
`creative_project_product_links` connects a Creative Project to zero, one, or many products. The relationship is optional in both directions and does not replace `products` or require legacy/direct products to be migrated.

## Build 217 additive tables
- `creative_project_inventory_reversals`: immutable reasoned compensating restorations for project inventory postings.
- `creative_project_profitability_extensions`: fee percentage and fixed-fee assumptions.
- `creative_project_cost_allocations`: reviewed project-cost shares assigned to linked products.
- `creative_project_knowledge_summaries`: review-controlled lessons and recommendations derived from CAIP evidence.

## Build 221 — Packaging Studio and lot reconciliation

- `packaging_templates` — reusable physical dimensions, layout JSON, theme defaults, template type and active/system controls. The preferred first template is `soap-ribbon-scalloped-reference-v1`; its 19 mm band sits within a 50 mm full canvas so the supplied scalloped medallion is not clipped.
- `packaging_projects` — structured bilingual packaging content, optional product link, theme/artwork settings, compliance state and review-first project status.
- `packaging_project_versions` — version-numbered structured snapshot and SVG evidence with review state.
- `packaging_export_history` — prepared export format, filename, source snapshot and actor/time evidence.
- `inventory_lot_policies` — manual/FIFO/FEFO preference, reconciliation state and last reviewed lot quantity. A policy is not automatic depletion permission.
- `inventory_lot_reconciliations` — immutable-style main-versus-lot count evidence, discrepancy, whether the lot total was applied, before/after quantity, note and reviewer.

Build 221 also changes product deletion logic rather than adding a deletion table: product-owned working rows can be removed with an unused product, while true business/history references continue to block deletion. `product_deletion_audit` and `product_material_return_audit` remain the evidence boundary.


### Build 221 aggregate-schema repair
The fresh/aggregate schema files now also include the Build 213–215 Creative Process parent tables (`creative_work_projects`, events, outputs, optional product links, evidence selections, material reviews, profitability and Content Studio handoffs). Later Build 216–217 tables already referenced these parents, so omitting them could make a fresh SQLite/D1 schema appear to create successfully but fail when a product deletion activated a foreign-key path. The dedicated numbered migrations remain the source of truth for existing databases; the aggregate repair makes fresh installs structurally complete.

### `database_upgrade_current_pass.sql`
This file is reset for Build 221 and now contains only the additive Build 221 migration. It no longer replays the accumulated Build 184–220 historical upgrade chain. Existing databases should use the numbered migrations as evidence and apply the current-pass file only after confirming Build 220 is present.

## Build 222 — normalized soap-label data and physical print evidence

Build 222 extends the Build 221 Packaging Studio rather than creating a disconnected label database:

- `soap_label_templates` — soap-specific physical profile linked one-to-one to a broad `packaging_templates` row. Stores artboard, band, oval, rear-seal, bleed, safe-margin and profile values.
- `soap_products` — normalized label identity linked one-to-one to a `packaging_projects` row and optionally to a commerce `products` row.
- `soap_ingredients` — ordered INCI/English/French ingredient rows with organic, allergen-note and required-on-label fields.
- `soap_label_claims` — ordered bilingual claim/icon rows with approval and compliance notes.
- `soap_label_exports` — versioned prepared-export evidence including format, filename, URLs, checksum, approval and print-test state.
- `soap_label_print_tests` — physical 100%-scale measurements, printer/paper, wrap fit, legibility, overlap, proof-image URL and reviewer evidence.

### Data ownership
- Commerce price, stock and public product identity remain in `products`.
- Broad package project/version state remains in `packaging_projects` and `packaging_project_versions`.
- Normalized soap content belongs in the Build 222 tables above.
- `claims_json`, `ingredients_en` and `ingredients_fr` remain compatibility/current-draft fields in `packaging_projects`, but the Build 222 API synchronizes authoritative editable rows to the normalized tables. New code should not create another independent copy.
- Visual theme/artwork JSON remains acceptable for bounded, versioned presentation settings; ingredients, claims, tests and exports must remain row-based.

### Dimension profiles
`soap-ribbon-glacial-approved-v1` uses an 11 × 1.5-inch artboard and renders the rear seal at 38.1 mm so it fits. `soap-ribbon-spec-50mm-seal-v1` uses a 50 mm-high artboard and a true 50 mm rear seal. This intentionally exposes the physical conflict in the source specification rather than clipping or mislabelling a file.

### Historical Build 222 migration boundary
Build 222 introduced the normalized soap-label tables. Existing databases should already contain them before Build 225. The historical numbered Build 227 migration does not replay Build 222 or Build 225; it contains only the Build 227 packaging-component and client-document additions. The current-pass file is now Build 229 only.
## Build 225 — Startup Readiness status authority

Historical additive migration: `database_build225_startup_readiness_packaging_authority.sql`. It must already be applied before Build 227; Build 227 and Build 228 must precede the current Build 229 migration.

New tables:
- `startup_readiness_items` — the authoritative go-live item definition and current status, owner, due date, evidence, blocked reason, completion, severity, route, and pass condition.
- `startup_readiness_history` — append-only status/evidence transition history for the launch cockpit.

Packaging documentation authority is `PACKAGING_STUDIO.md`. The legacy `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` files are compatibility pointers and contain no second schema/specification copy.
